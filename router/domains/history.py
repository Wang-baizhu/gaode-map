from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query

from modules.poi.schemas import HistorySaveRequest
from modules.providers.amap.utils.transform_posi import gcj02_to_wgs84, wgs84_to_gcj02
from store.history_repo import history_repo

router = APIRouter()


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float))


def _transform_nested_coords(raw: Any, transformer):
    if not isinstance(raw, list):
        return raw

    if len(raw) >= 2 and _is_number(raw[0]) and _is_number(raw[1]):
        try:
            nx, ny = transformer(float(raw[0]), float(raw[1]))
            out = [nx, ny]
            if len(raw) > 2:
                out.extend(raw[2:])
            return out
        except Exception:
            return raw

    return [_transform_nested_coords(item, transformer) for item in raw]


def _transform_geojson_coordinates(value: Any, transformer):
    if isinstance(value, dict):
        out = {}
        for key, val in value.items():
            if key == "coordinates":
                out[key] = _transform_nested_coords(val, transformer)
            else:
                out[key] = _transform_geojson_coordinates(val, transformer)
        return out

    if isinstance(value, list):
        return [_transform_geojson_coordinates(item, transformer) for item in value]

    return value


def _transform_polygon_payload_coords(raw: Any, transformer) -> list:
    if not isinstance(raw, list):
        return []
    if not raw:
        return []

    if isinstance(raw[0], list) and len(raw[0]) >= 2 and not isinstance(raw[0][0], list):
        out = []
        for pt in raw:
            try:
                x, y = float(pt[0]), float(pt[1])
                nx, ny = transformer(x, y)
                out.append([nx, ny])
            except Exception:
                continue
        return out

    out = []
    for item in raw:
        transformed = _transform_polygon_payload_coords(item, transformer)
        if transformed:
            out.append(transformed)
    return out


@router.post("/api/v1/analysis/history/save")
async def save_history_manually(payload: HistorySaveRequest):
    s_center = payload.center
    if s_center:
        wx, wy = gcj02_to_wgs84(s_center[0], s_center[1])
        s_center = [wx, wy]

    s_poly = []
    if payload.polygon:
        s_poly = _transform_polygon_payload_coords(payload.polygon, gcj02_to_wgs84)

    s_drawn_poly = []
    if payload.drawn_polygon:
        transformed_drawn = _transform_nested_coords(payload.drawn_polygon, gcj02_to_wgs84)
        s_drawn_poly = transformed_drawn if isinstance(transformed_drawn, list) else []

    s_pois = []
    for p in payload.pois:
        np = p.copy()
        if np.get("location"):
            lx, ly = np["location"]
            nwx, nwy = gcj02_to_wgs84(lx, ly)
            np["location"] = [nwx, nwy]
        s_pois.append(np)

    display_title = payload.location_name
    if not display_title and s_center:
        display_title = f"{s_center[0]:.4f},{s_center[1]:.4f}"

    desc = f"{display_title} - {len(s_pois)} POIs" if display_title else f"{payload.keywords} - {len(s_pois)} POIs"
    if payload.time_min and "min" not in desc:
        desc = f"{payload.time_min}min - {desc}"

    try:
        source = (payload.source or "local").strip().lower()
        if source not in ("gaode", "local"):
            source = "local"
        params_payload = {
            "center": s_center,
            "time_min": payload.time_min,
            "keywords": payload.keywords,
            "mode": payload.mode,
            "source": source,
        }
        if s_drawn_poly:
            params_payload["drawn_polygon"] = s_drawn_poly
        history_id = history_repo.create_record(
            params_payload,
            s_poly, s_pois, desc
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存历史失败: {str(e)}")

    return {"status": "ok", "history_id": history_id, "count": len(s_pois)}


@router.get("/api/v1/analysis/history")
async def get_history_list(limit: int = Query(0, ge=0)):
    return history_repo.get_list(limit)


def _convert_history_detail_to_gcj02(res: Dict[str, Any], *, include_pois: bool) -> Dict[str, Any]:
    payload = dict(res or {})

    params = payload.get("params") or {}
    if params.get("center"):
        cx, cy = params["center"]
        nx, ny = wgs84_to_gcj02(cx, cy)
        params["center"] = [nx, ny]

    if params.get("drawn_polygon"):
        try:
            transformed = _transform_nested_coords(params["drawn_polygon"], wgs84_to_gcj02)
            params["drawn_polygon"] = transformed if isinstance(transformed, list) else []
        except Exception:
            params["drawn_polygon"] = []

    if isinstance(params.get("h3_result"), dict):
        params["h3_result"] = _transform_geojson_coordinates(params["h3_result"], wgs84_to_gcj02)

    if isinstance(params.get("road_result"), dict):
        params["road_result"] = _transform_geojson_coordinates(params["road_result"], wgs84_to_gcj02)

    if payload.get("polygon"):
        poly = payload["polygon"]

        def cr(r):
            return [list(wgs84_to_gcj02(p[0], p[1])) for p in r]

        if poly and len(poly) > 0:
            if isinstance(poly[0][0], list):
                payload["polygon"] = [cr(ring) for ring in poly]
            else:
                payload["polygon"] = cr(poly)

    if include_pois and payload.get("pois"):
        for p in payload["pois"]:
            if p.get("location"):
                lx, ly = p["location"]
                nlx, nly = wgs84_to_gcj02(lx, ly)
                p["location"] = [nlx, nly]

    return payload


@router.get("/api/v1/analysis/history/{id}/pois")
async def get_history_pois(id: int):
    res = history_repo.get_pois(id)
    if not res:
        raise HTTPException(404, "Record not found")

    pois = res.get("pois") or []
    for poi in pois:
        if poi.get("location"):
            lx, ly = poi["location"]
            nlx, nly = wgs84_to_gcj02(lx, ly)
            poi["location"] = [nlx, nly]
    return res


@router.get("/api/v1/analysis/history/{id}")
async def get_history_detail(id: int, include_pois: bool = Query(True)):
    res = history_repo.get_detail(id, include_pois=include_pois)
    if not res:
        raise HTTPException(404, "Record not found")
    return _convert_history_detail_to_gcj02(res, include_pois=include_pois)


@router.delete("/api/v1/analysis/history/{id}")
async def delete_history(id: int):
    if not history_repo.delete_record(id):
        raise HTTPException(404, "Delete failed")
    return {"status": "success", "id": id}
