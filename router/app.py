import asyncio
import json
import logging
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence
from datetime import datetime
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, Security, Query, status, Response, Request
from fastapi.responses import StreamingResponse, HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates

from core.config import settings
# REMOVED: from core.models import (...)

# New Schema Locations
from modules.gaode_service.schemas import (
    MapGenerateRequest,
    MapResponse,
)
from modules.map_manage.schemas import (
    MapRequest,
    PolygonCreateRequest,
    PolygonListResponse,
    PolygonRecord,
)

# Modules & Logic
from modules import generate_map_json
from modules.isochrone import get_isochrone_polygon
from modules.isochrone.schemas import IsochroneRequest, IsochroneResponse
from modules.poi.schemas import (
    PoiRequest,
    PoiResponse,
    HistorySaveRequest,
)
from modules.poi.core import (
    fetch_pois_by_polygon,
    fetch_local_pois_by_polygon,
)
from modules.grid_h3.analysis import analyze_h3_grid
from modules.grid_h3.analysis_schemas import H3MetricsRequest, H3MetricsResponse, H3ExportRequest
from modules.grid_h3.arcgis_bridge import run_arcgis_h3_export
from modules.grid_h3.core import build_h3_grid_feature_collection
from modules.grid_h3.schemas import GridRequest, GridResponse
from modules.road_syntax.core import analyze_road_syntax
from modules.road_syntax.schemas import RoadSyntaxRequest, RoadSyntaxResponse
from modules.gaode_service.utils.transform_posi import gcj02_to_wgs84, wgs84_to_gcj02

# Stores
from store import (
    delete_polygon,
    find_map_by_center_and_type,
    find_map_by_fingerprint,
    build_center_fingerprint,
    get_map_data,
    list_polygons_for_map,
    save_map_data,
    save_polygon,
)
from store.history_repo import history_repo

# Utils
from utils import export_map_to_xlsx, parse_json, generate_html_content, load_type_config
from router.utils.deps import load_map_request, verify_api_key

import os
import time
import threading
import uuid
from shapely.geometry import mapping
from shapely.ops import transform

logger = logging.getLogger(__name__)

router = APIRouter()
templates = Jinja2Templates(directory=settings.templates_dir)


ROAD_SYNTAX_PROGRESS_LOCK = threading.Lock()
ROAD_SYNTAX_PROGRESS: Dict[str, Dict[str, Any]] = {}
ROAD_SYNTAX_PROGRESS_TTL_SEC = 3600


def _cleanup_road_syntax_progress(now_ts: Optional[float] = None) -> None:
    now_value = float(now_ts if now_ts is not None else time.time())
    stale_ids: List[str] = []
    for run_id, item in ROAD_SYNTAX_PROGRESS.items():
        updated_at = float(item.get("updated_at") or 0.0)
        if (now_value - updated_at) > float(ROAD_SYNTAX_PROGRESS_TTL_SEC):
            stale_ids.append(run_id)
    for run_id in stale_ids:
        ROAD_SYNTAX_PROGRESS.pop(run_id, None)


def _update_road_syntax_progress(
    run_id: str,
    *,
    status: str = "running",
    stage: str = "",
    message: str = "",
    step: Optional[int] = None,
    total: Optional[int] = None,
    extra: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    now_ts = float(time.time())
    run_key = str(run_id or "").strip()
    if not run_key:
        run_key = uuid.uuid4().hex
    with ROAD_SYNTAX_PROGRESS_LOCK:
        _cleanup_road_syntax_progress(now_ts)
        existing = ROAD_SYNTAX_PROGRESS.get(run_key) or {}
        started_at = float(existing.get("started_at") or now_ts)
        step_value: Optional[int] = None
        total_value: Optional[int] = None
        try:
            if step is not None:
                step_value = int(step)
        except (TypeError, ValueError):
            step_value = None
        try:
            if total is not None:
                total_value = int(total)
        except (TypeError, ValueError):
            total_value = None
        payload = {
            "run_id": run_key,
            "status": str(status or "running"),
            "stage": str(stage or ""),
            "message": str(message or ""),
            "step": step_value,
            "total": total_value,
            "started_at": started_at,
            "updated_at": now_ts,
            "elapsed_sec": round(max(0.0, now_ts - started_at), 1),
            "extra": dict(extra or {}),
        }
        ROAD_SYNTAX_PROGRESS[run_key] = payload
        return dict(payload)


def _get_road_syntax_progress(run_id: str) -> Optional[Dict[str, Any]]:
    run_key = str(run_id or "").strip()
    if not run_key:
        return None
    now_ts = float(time.time())
    with ROAD_SYNTAX_PROGRESS_LOCK:
        _cleanup_road_syntax_progress(now_ts)
        payload = ROAD_SYNTAX_PROGRESS.get(run_key)
        if not payload:
            return None
        data = dict(payload)
        started_at = float(data.get("started_at") or now_ts)
        data["elapsed_sec"] = round(max(0.0, now_ts - started_at), 1)
        return data


def _normalize_boundary_ring(path: Any) -> List[List[float]]:
    ring: List[List[float]] = []
    for pt in path if isinstance(path, list) else []:
        if not isinstance(pt, list) or len(pt) < 2:
            continue
        try:
            lng = float(pt[0])
            lat = float(pt[1])
        except (TypeError, ValueError):
            continue
        ring.append([lng, lat])
    if len(ring) < 3:
        return []
    first = ring[0]
    last = ring[-1]
    if abs(first[0] - last[0]) > 1e-9 or abs(first[1] - last[1]) > 1e-9:
        ring.append([first[0], first[1]])
    return ring if len(ring) >= 4 else []


def _extract_boundary_rings(geometry: Dict[str, Any]) -> List[List[List[float]]]:
    if not isinstance(geometry, dict):
        return []
    geom_type = str(geometry.get("type") or "")
    coords = geometry.get("coordinates")
    rings: List[List[List[float]]] = []
    if geom_type == "Polygon" and isinstance(coords, list) and coords and isinstance(coords[0], list):
        ring = _normalize_boundary_ring(coords[0])
        if ring:
            rings.append(ring)
    elif geom_type == "MultiPolygon" and isinstance(coords, list):
        for polygon in coords:
            if not isinstance(polygon, list) or not polygon or not isinstance(polygon[0], list):
                continue
            ring = _normalize_boundary_ring(polygon[0])
            if ring:
                rings.append(ring)
    return rings


def _signed_ring_area(ring: List[List[float]]) -> float:
    if len(ring) < 4:
        return 0.0
    area = 0.0
    for i in range(len(ring) - 1):
        a = ring[i]
        b = ring[i + 1]
        area += (float(a[0]) * float(b[1])) - (float(b[0]) * float(a[1]))
    return area / 2.0


def _resolve_city_boundary_candidates(city_name: str) -> List[str]:
    city = (city_name or "").strip().lower()
    is_changsha = ("长沙" in city_name) or city in {"changsha", "changsha city", "cs"}
    if is_changsha:
        return [
            "changsha_boundary_gcj02.geojson",
            "changsha_boundary.geojson",
        ]
    return []


def _load_city_boundary_ring(city_name: str) -> Dict[str, Any]:
    candidates = _resolve_city_boundary_candidates(city_name)
    if not candidates:
        raise HTTPException(status_code=400, detail=f"暂不支持城市边界: {city_name}")

    boundary_dir = Path(settings.city_boundary_dir).expanduser()
    if not boundary_dir.exists() or not boundary_dir.is_dir():
        raise HTTPException(status_code=500, detail=f"城市边界目录不存在: {boundary_dir}")

    rings: List[List[List[float]]] = []
    used_file: Optional[Path] = None
    tried_paths: List[str] = []
    for filename in candidates:
        path = boundary_dir / filename
        tried_paths.append(str(path))
        if not path.exists():
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"边界文件读取失败: {path} ({exc})") from exc

        if isinstance(payload, dict) and payload.get("type") == "FeatureCollection":
            for feature in payload.get("features") or []:
                if not isinstance(feature, dict):
                    continue
                rings.extend(_extract_boundary_rings(feature.get("geometry") or {}))
        elif isinstance(payload, dict) and payload.get("type") == "Feature":
            rings.extend(_extract_boundary_rings(payload.get("geometry") or {}))
        elif isinstance(payload, dict):
            rings.extend(_extract_boundary_rings(payload))

        if rings:
            used_file = path
            break

    if not rings:
        raise HTTPException(
            status_code=404,
            detail=f"未找到可用城市边界文件，请检查: {', '.join(tried_paths)}",
        )

    largest_ring = sorted(
        rings,
        key=lambda ring: (abs(_signed_ring_area(ring)), len(ring)),
        reverse=True,
    )[0]
    return {
        "city": city_name,
        "source_file": str(used_file) if used_file else "",
        "ring": largest_ring,
    }

# =============================================================================
# 1. Base / Misc
# =============================================================================

@router.get("/health", summary="健康检查")
async def health_check():
    """检查服务是否正常运行"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
    }

@router.get("/", summary="根路径")
async def root():
    return {
        "message": "欢迎使用高德地图扣子插件API",
        "docs": f"{settings.app_base_url}/docs",
        "health": f"{settings.app_base_url}/health",
    }

@router.get("/favicon.ico", include_in_schema=False)
async def favicon():
    icon_path = os.path.join(settings.static_dir, "favicon.ico")
    if os.path.exists(icon_path):
        return FileResponse(icon_path)
    return Response(status_code=204)

@router.get("/api/v1/config", summary="获取APP配置")
async def get_frontend_config():
    """
    返回前端所需配置 (如高德 Key)
    """
    return {
        "amap_js_api_key": settings.amap_js_api_key,
        "amap_js_security_code": settings.amap_js_security_code,
        "tianditu_key": settings.tianditu_key,
        "map_type_config_json": load_type_config()
    }

# =============================================================================
# 2. Pages (HTML Views)
# =============================================================================

@router.get("/map", response_class=HTMLResponse, summary="渲染常规地图")
async def render_map_page(
    search_type: str = Query(..., alias="type"),
    location: str = Query(..., description="lng,lat"),
    place_types: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
):
    """
    根据参数渲染地图 HTML (旧版逻辑)
    """
    normalized_type = (search_type or "").strip()
    if normalized_type not in ("around", "city"):
        raise HTTPException(status_code=400, detail="Type must be 'around' or 'city'")
        
    try:
        parts = location.split(",")
        lng = float(parts[0])
        lat = float(parts[1])
    except:
         raise HTTPException(status_code=400, detail="Invalid location format")

    # 复用 build_center_fingerprint 等逻辑寻找缓存的数据
    parsed_place_types = parse_json(place_types)
    normalized_place_types = tuple(item for item in (parsed_place_types or []) if item)
    effective_source = (source or "gaode").strip()
    effective_year = year or datetime.now().year
    
    fingerprint = build_center_fingerprint(
        {"lng": lng, "lat": lat},
        normalized_type,
        normalized_place_types,
        effective_source,
        effective_year,
    )
    
    existing = find_map_by_fingerprint(fingerprint)
    if not existing:
         raise HTTPException(status_code=404, detail="Map data not found")
         
    map_id, map_data, _ = existing
    map_req = MapRequest(**map_data)
    html_content = await generate_html_content(map_req, map_id=map_id)
    return HTMLResponse(content=html_content)

@router.get("/analysis", response_class=HTMLResponse, summary="渲染分析工作台")
async def render_analysis_page(request: Request):
    """
    渲染高级分析页面 (Analysis Dashboard)
    """
    type_config_json = json.dumps(load_type_config(), ensure_ascii=False)
    return templates.TemplateResponse(
        "analysis.html",
        {
            "request": request,
            "amap_js_api_key": settings.amap_js_api_key,
            "amap_js_security_code": settings.amap_js_security_code,
            "tianditu_key": settings.tianditu_key,
            "map_type_config_json": type_config_json,
            "map_id": "null",
            "map_data_json": "{}",
            "static_version": str(int(time.time()))
        }
    )

# =============================================================================
# 3. Core API (Map Generation & Management)
# =============================================================================

@router.post("/api/v1/generate-map", response_model=MapResponse, summary="生成地图数据")
async def generate_map(
    request: MapGenerateRequest,
    api_key_valid: bool = Security(verify_api_key),
):
    """
    生成地图 JSON 数据并缓存
    """
    try:
        logger.info("Generating map for: %s", request.place)
        
        # Hook logic borrowed from original api.py
        def pre_points_hook(center, search_type, place_types=None):
            normalized_pt = tuple(sorted({item for item in (place_types or []) if item}))
            src = request.source or "gaode"
            y = request.year or datetime.now().year
            existing = find_map_by_center_and_type(center, search_type, normalized_pt, src, y)
            if existing:
                return existing[0], existing[1]
            return None

        src = request.source or "gaode"
        y = request.year or datetime.now().year
        
        map_payload, cached_id = generate_map_json(
            place=request.place,
            search_type=request.type,
            place_types=request.place_types,
            radius=request.radius,
            year=y,
            source=src,
            auth_header=None,
            pre_points_hook=pre_points_hook
        )
        
        map_req = MapRequest(**map_payload["body"])
        
        if cached_id is None:
            cached_id = await asyncio.to_thread(
                save_map_data,
                map_req.model_dump(),
                map_req.center,
                request.type,
                tuple(sorted({i for i in (request.place_types or []) if i})),
                src,
                y
            )
        
        # Build URL
        base = settings.app_base_url.rstrip("/")
        loc = f"{map_req.center['lng']},{map_req.center['lat']}"
        params = {"type": request.type, "location": loc}
        if src != "gaode": params["source"] = src
        if request.year: params["year"] = str(request.year)
        if request.place_types: params["place_types"] = json.dumps(request.place_types, ensure_ascii=False)
        
        url = f"{base}/map?{urlencode(params)}"
        return MapResponse(status=200, message="Success", url=url)

    except Exception as e:
        logger.error(f"Map generation failed: {e}", exc_info=True)
        return MapResponse(status=500, message=f"Failed: {str(e)}")

@router.get("/api/v1/maps/{map_id}/export/xlsx")
async def export_map_xlsx(map_id: int):
    map_req = await load_map_request(map_id)
    fname, content = export_map_to_xlsx(map_req, map_id)
    return StreamingResponse(
        BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'}
    )

# ... Polygon CRUD ...
@router.get("/api/v1/maps/{map_id}/polygons", response_model=PolygonListResponse)
async def list_map_polygons(map_id: int):
    map_data = await asyncio.to_thread(get_map_data, map_id)
    if not map_data: raise HTTPException(404, "Map not found")
    polygons = await asyncio.to_thread(list_polygons_for_map, map_id)
    return {"polygons": polygons}

@router.post("/api/v1/maps/{map_id}/polygons", response_model=PolygonRecord)
async def create_map_polygon(map_id: int, payload: PolygonCreateRequest):
    map_data = await asyncio.to_thread(get_map_data, map_id)
    if not map_data: raise HTTPException(404, "Map not found")
    pid = await asyncio.to_thread(save_polygon, map_id, payload.coordinates)
    return {"id": pid, "coordinates": payload.coordinates}

@router.delete("/api/v1/maps/{map_id}/polygons/{polygon_id}")
async def delete_map_polygon(map_id: int, polygon_id: int):
    success = await asyncio.to_thread(delete_polygon, map_id, polygon_id)
    if not success: raise HTTPException(404, "Polygon not found")
    return {"status": "ok"}


# =============================================================================
# 4. Analysis API (Isochrone & POI & History)
# =============================================================================

@router.post("/api/v1/analysis/isochrone", response_model=IsochroneResponse)
async def calculate_isochrone(payload: IsochroneRequest):
    start = time.time()
    lat, lon = payload.lat, payload.lon
    # Transform to WGS84 for engine
    if payload.coord_type == "gcj02":
        lon, lat = gcj02_to_wgs84(payload.lon, payload.lat)
        
    poly_wgs84 = await asyncio.to_thread(
        get_isochrone_polygon, lat, lon, payload.time_min * 60, payload.mode
    )
    
    if poly_wgs84.is_empty:
        raise HTTPException(404, "Empty isochrone result")
        
    final_poly = poly_wgs84
    # Transform back if needed
    if payload.coord_type == "gcj02":
        def _trans(x, y, z=None):
            # Shapely transform handler
            try:
                iter(x)
                nx, ny = [], []
                for i in range(len(x)):
                    tx, ty = wgs84_to_gcj02(x[i], y[i])
                    nx.append(tx); ny.append(ty)
                return tuple(nx), tuple(ny)
            except:
                return wgs84_to_gcj02(x, y)
        final_poly = transform(_trans, poly_wgs84)
        
    return {
        "type": "Feature",
        "properties": {
            "center": [payload.lon, payload.lat],
            "time_min": payload.time_min,
            "mode": payload.mode,
            "calc_time_ms": int((time.time() - start) * 1000)
        },
        "geometry": mapping(final_poly)
    }


@router.post("/api/v1/analysis/h3-grid", response_model=GridResponse)
async def build_h3_grid(payload: GridRequest):
    feature_collection = await asyncio.to_thread(
        build_h3_grid_feature_collection,
        payload.polygon,
        payload.resolution,
        payload.coord_type,
        payload.include_mode,
        payload.min_overlap_ratio,
    )
    return feature_collection


@router.get("/api/v1/analysis/city-boundary")
async def get_city_boundary(city: str = Query("长沙市", description="城市名称")):
    target_city = (city or "长沙市").strip() or "长沙市"
    return _load_city_boundary_ring(target_city)


@router.post("/api/v1/analysis/h3-metrics", response_model=H3MetricsResponse)
async def analyze_h3_metrics(payload: H3MetricsRequest):
    poi_payload = [
        p.model_dump() if hasattr(p, "model_dump") else p.dict()
        for p in payload.pois
    ]
    try:
        result = await asyncio.to_thread(
            analyze_h3_grid,
            polygon=payload.polygon,
            resolution=payload.resolution,
            coord_type=payload.coord_type,
            include_mode=payload.include_mode,
            min_overlap_ratio=payload.min_overlap_ratio,
            pois=poi_payload,
            poi_coord_type=payload.poi_coord_type,
            neighbor_ring=payload.neighbor_ring,
            use_arcgis=True,
            arcgis_python_path=payload.arcgis_python_path,
            arcgis_neighbor_ring=payload.arcgis_neighbor_ring,
            # Grid analysis is ring-based; keep legacy KNN field accepted but ignored.
            arcgis_knn_neighbors=None,
            arcgis_export_image=payload.arcgis_export_image,
            arcgis_timeout_sec=payload.arcgis_timeout_sec,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return result


@router.post("/api/v1/analysis/h3/export")
async def export_h3_analysis(payload: H3ExportRequest):
    try:
        export_result = await asyncio.to_thread(
            run_arcgis_h3_export,
            export_format=payload.format,
            include_poi=payload.include_poi,
            style_mode=payload.style_mode,
            grid_features=[
                feature.model_dump() if hasattr(feature, "model_dump") else feature
                for feature in (payload.grid_features or [])
            ],
            poi_features=[
                feature.model_dump() if hasattr(feature, "model_dump") else feature
                for feature in (payload.poi_features or [])
            ],
            style_meta=payload.style_meta,
            arcgis_python_path=payload.arcgis_python_path,
            timeout_sec=payload.arcgis_timeout_sec,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=f"ArcGIS导出失败: {exc}") from exc

    filename = str(export_result.get("filename") or "h3_analysis_export.bin")
    content_type = str(export_result.get("content_type") or "application/octet-stream")
    content = export_result.get("content") or b""
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=content, media_type=content_type, headers=headers)


@router.post("/api/v1/analysis/road-syntax", response_model=RoadSyntaxResponse)
async def analyze_road_syntax_api(payload: RoadSyntaxRequest):
    run_id = str(payload.run_id or "").strip() or uuid.uuid4().hex
    _update_road_syntax_progress(
        run_id,
        status="running",
        stage="queued",
        message="已接收请求，等待开始计算",
        step=0,
        total=9,
        extra={},
    )

    def _progress_callback(snapshot: Dict[str, Any]) -> None:
        _update_road_syntax_progress(
            run_id,
            status="running",
            stage=str(snapshot.get("stage") or ""),
            message=str(snapshot.get("message") or ""),
            step=snapshot.get("step"),
            total=snapshot.get("total"),
            extra=snapshot.get("extra") if isinstance(snapshot.get("extra"), dict) else {},
        )

    try:
        result = await asyncio.to_thread(
            analyze_road_syntax,
            polygon=payload.polygon,
            coord_type=payload.coord_type,
            mode=payload.mode,
            graph_model=payload.graph_model,
            highway_filter=payload.highway_filter,
            include_geojson=payload.include_geojson,
            max_edge_features=payload.max_edge_features,
            merge_geojson_edges=payload.merge_geojson_edges,
            merge_bucket_step=payload.merge_bucket_step,
            radii_m=payload.radii_m,
            metric=payload.metric,
            depthmap_cli_path=payload.depthmap_cli_path,
            tulip_bins=payload.tulip_bins,
            use_arcgis_webgl=payload.use_arcgis_webgl,
            arcgis_python_path=payload.arcgis_python_path,
            arcgis_timeout_sec=payload.arcgis_timeout_sec,
            arcgis_metric_field=payload.arcgis_metric_field,
            progress_callback=_progress_callback,
        )
    except RuntimeError as exc:
        _update_road_syntax_progress(
            run_id,
            status="failed",
            stage="failed",
            message=str(exc),
            extra={},
        )
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    _update_road_syntax_progress(
        run_id,
        status="success",
        stage="completed",
        message="计算完成",
        step=9,
        total=9,
        extra={},
    )
    return result


@router.get("/api/v1/analysis/road-syntax/progress")
async def get_road_syntax_progress(run_id: str = Query(..., description="Road syntax run id")):
    payload = _get_road_syntax_progress(run_id)
    if not payload:
        raise HTTPException(status_code=404, detail="run_id 不存在或已过期")
    return payload


@router.post("/api/v1/analysis/pois", response_model=PoiResponse)
async def fetch_pois_analysis(payload: PoiRequest):
    # payload.polygon assumed GCJ02
    source = (payload.source or "gaode").strip().lower()
    try:
        if source == "local":
            results = await fetch_local_pois_by_polygon(
                payload.polygon,
                types=payload.types,
                year=payload.year,
                max_count=payload.max_count,
            )
        else:
            results = await fetch_pois_by_polygon(
                payload.polygon,
                payload.keywords,
                payload.types,
                max_count=payload.max_count,
            )
    except Exception as exc:
        logger.exception("POI fetch failed: source=%s", source)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    
    if payload.save_history:
        # Standardize to WGS84 for storage
        s_center = payload.center
        if s_center:
            wx, wy = gcj02_to_wgs84(s_center[0], s_center[1])
            s_center = [wx, wy]
            
        s_poly = []
        if payload.polygon:
            s_poly = [list(gcj02_to_wgs84(p[0], p[1])) for p in payload.polygon]
            
        s_pois = []
        for p in results:
            np = p.copy()
            if np.get("location"):
                lx, ly = np["location"]
                nwx, nwy = gcj02_to_wgs84(lx, ly)
                np["location"] = [nwx, nwy]
            s_pois.append(np)
            
        desc = f"{payload.keywords} - {len(results)} POIs"
        if payload.time_min: desc = f"{payload.time_min}min - {desc}"
        
        history_repo.create_record(
            {"center": s_center, "time_min": payload.time_min, "keywords": payload.keywords, "mode": payload.mode, "source": source},
            s_poly, s_pois, desc
        )
        
    return {"pois": results, "count": len(results)}


@router.post("/api/v1/analysis/history/save")
async def save_history_manually(payload: HistorySaveRequest):
    """
    Manually save analysis result to history (Aggregate multiple batches)
    """
    # Standardize to WGS84 for storage
    s_center = payload.center
    if s_center:
        wx, wy = gcj02_to_wgs84(s_center[0], s_center[1])
        s_center = [wx, wy]
        
    s_poly = []
    if payload.polygon:
        # Handle simple Polygon vs MultiPolygon structure if needed, 
        # but usually frontend sends simple list of points for the isochrone
        s_poly = [list(gcj02_to_wgs84(p[0], p[1])) for p in payload.polygon]
        
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
        # Fallback to coordinates
        display_title = f"{s_center[0]:.4f},{s_center[1]:.4f}"
    
    desc = f"{display_title} - {len(s_pois)} POIs" if display_title else f"{payload.keywords} - {len(s_pois)} POIs"
    if payload.time_min and "min" not in desc: # Avoid double prefix if name already has it
        desc = f"{payload.time_min}min - {desc}"
    
    try:
        history_id = history_repo.create_record(
            {"center": s_center, "time_min": payload.time_min, "keywords": payload.keywords, "mode": payload.mode},
            s_poly, s_pois, desc
        )
    except Exception as e:
        logger.exception("Failed to save analysis history: %s", e)
        raise HTTPException(status_code=500, detail=f"保存历史失败: {str(e)}")

    return {"status": "ok", "history_id": history_id, "count": len(s_pois)}

@router.get("/api/v1/analysis/history")
async def get_history_list(limit: int = 20):
    return history_repo.get_list(limit)

@router.get("/api/v1/analysis/history/{id}")
async def get_history_detail(id: int):
    res = history_repo.get_detail(id)
    if not res: raise HTTPException(404, "Record not found")
    
    # Convert WGS84 storage -> GCJ02 display
    params = res.get("params") or {}
    if params.get("center"):
         cx, cy = params["center"]
         nx, ny = wgs84_to_gcj02(cx, cy)
         params["center"] = [nx, ny]
         
    if res.get("polygon"):
        poly = res["polygon"]
        # Helper to convert ring
        def cr(r): return [list(wgs84_to_gcj02(p[0], p[1])) for p in r]
        
        if poly and len(poly) > 0:
            if isinstance(poly[0][0], list): # Multi/Hole
                res["polygon"] = [cr(ring) for ring in poly]
            else:
                res["polygon"] = cr(poly)
                
    if res.get("pois"):
         for p in res["pois"]:
             if p.get("location"):
                 lx, ly = p["location"]
                 nlx, nly = wgs84_to_gcj02(lx, ly)
                 p["location"] = [nlx, nly]
                 
    return res

@router.delete("/api/v1/analysis/history/{id}")
async def delete_history(id: int):
    if not history_repo.delete_record(id):
        raise HTTPException(404, "Delete failed")
    return {"status": "success", "id": id}
