from __future__ import annotations

import logging
from typing import Any, List

from fastapi import APIRouter, HTTPException

from modules.poi.core import fetch_local_pois_by_polygon, fetch_pois_by_polygon
from modules.poi.schemas import PoiRequest, PoiResponse
from modules.providers.amap.utils.transform_posi import gcj02_to_wgs84
from store.history_repo import history_repo

router = APIRouter()
logger = logging.getLogger(__name__)


def _transform_polygon_payload_coords(raw: Any, transformer) -> list:
    if not isinstance(raw, list) or not raw:
        return []

    if (
        isinstance(raw[0], list)
        and len(raw[0]) >= 2
        and isinstance(raw[0][0], (int, float))
        and isinstance(raw[0][1], (int, float))
    ):
        out: List[List[float]] = []
        for pt in raw:
            if not isinstance(pt, list) or len(pt) < 2:
                continue
            out.append(list(transformer(pt[0], pt[1])))
        return out

    out_nested = []
    for item in raw:
        transformed = _transform_polygon_payload_coords(item, transformer)
        if transformed:
            out_nested.append(transformed)
    return out_nested


@router.post("/api/v1/analysis/pois", response_model=PoiResponse)
async def fetch_pois_analysis(payload: PoiRequest):
    source = (payload.source or "local").strip().lower()
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
        s_center = payload.center
        if s_center:
            wx, wy = gcj02_to_wgs84(s_center[0], s_center[1])
            s_center = [wx, wy]

        s_poly = []
        if payload.polygon:
            s_poly = _transform_polygon_payload_coords(payload.polygon, gcj02_to_wgs84)

        s_pois = []
        for p in results:
            np = p.copy()
            if np.get("location"):
                lx, ly = np["location"]
                nwx, nwy = gcj02_to_wgs84(lx, ly)
                np["location"] = [nwx, nwy]
            s_pois.append(np)

        desc = f"{payload.keywords} - {len(results)} POIs"
        if payload.time_min:
            desc = f"{payload.time_min}min - {desc}"

        history_repo.create_record(
            {
                "center": s_center,
                "time_min": payload.time_min,
                "keywords": payload.keywords,
                "mode": payload.mode,
                "source": source,
            },
            s_poly,
            s_pois,
            desc,
        )

    return {"pois": results, "count": len(results)}
