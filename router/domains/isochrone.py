from __future__ import annotations

import asyncio
import math
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from shapely.geometry import MultiPolygon, Point, Polygon, mapping
from shapely.ops import transform, unary_union

from modules.isochrone import get_isochrone_polygon
from modules.isochrone.schemas import (
    IsochroneDebugSampleRequest,
    IsochroneDebugSampleResponse,
    IsochroneRequest,
    IsochroneResponse,
)
from modules.providers.amap.utils.transform_posi import gcj02_to_wgs84, wgs84_to_gcj02

router = APIRouter()


def _meters_per_degree_lon(lat_deg: float) -> float:
    lat_rad = math.radians(float(lat_deg))
    return max(1000.0, 111320.0 * abs(math.cos(lat_rad)))


def _segment_length_m(x1: float, y1: float, x2: float, y2: float, lat_ref: float) -> float:
    dx_m = (float(x2) - float(x1)) * _meters_per_degree_lon(lat_ref)
    dy_m = (float(y2) - float(y1)) * 111320.0
    return math.sqrt(dx_m * dx_m + dy_m * dy_m)


def _dedupe_points(points: List[List[float]], precision: int = 6) -> List[List[float]]:
    out: List[List[float]] = []
    seen = set()
    for pt in points:
        if not isinstance(pt, list) or len(pt) < 2:
            continue
        x = float(pt[0])
        y = float(pt[1])
        key = (round(x, precision), round(y, precision))
        if key in seen:
            continue
        seen.add(key)
        out.append([x, y])
    return out


def _limit_points_evenly(points: List[List[float]], limit: int) -> List[List[float]]:
    if len(points) <= limit:
        return points
    if limit <= 1:
        return [points[0]]
    span = len(points) - 1
    selected: List[List[float]] = []
    used = set()
    for i in range(limit):
        idx = int(round((i * span) / (limit - 1)))
        idx = min(max(idx, 0), len(points) - 1)
        if idx in used:
            continue
        used.add(idx)
        selected.append(points[idx])
    if not selected:
        return [points[0]]
    return selected


def _sample_boundary_points(poly: Polygon, step_m: float, cap: Optional[int] = 300) -> List[List[float]]:
    if not poly or poly.is_empty or not poly.exterior:
        return []
    coords = list(poly.exterior.coords)
    if len(coords) < 2:
        return []
    lat_ref = float(poly.centroid.y)
    sampled: List[List[float]] = []
    for i in range(len(coords) - 1):
        x1, y1 = float(coords[i][0]), float(coords[i][1])
        x2, y2 = float(coords[i + 1][0]), float(coords[i + 1][1])
        seg_len = _segment_length_m(x1, y1, x2, y2, lat_ref)
        steps = max(1, int(math.ceil(seg_len / max(1.0, step_m))))
        for k in range(steps):
            t = float(k) / float(steps)
            sampled.append([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t])
            if cap is not None and len(sampled) >= cap:
                return _dedupe_points(sampled)
    sampled.append([float(coords[-1][0]), float(coords[-1][1])])
    return _dedupe_points(sampled)


def _sample_inner_points(poly: Polygon, step_m: float, cap: int = 300) -> List[List[float]]:
    if not poly or poly.is_empty:
        return []
    min_x, min_y, max_x, max_y = poly.bounds
    if max_x <= min_x or max_y <= min_y:
        return []

    lat_ref = float(poly.centroid.y)
    dx_deg = max(step_m / _meters_per_degree_lon(lat_ref), 1e-6)
    dy_deg = max(step_m / 111320.0, 1e-6)
    if dx_deg <= 0 or dy_deg <= 0:
        return []

    y = float(min_y)
    row = 0
    sampled: List[List[float]] = []
    while y <= float(max_y) and len(sampled) < cap:
        x_start = float(min_x) + (0.5 * dx_deg if (row % 2 == 1) else 0.0)
        x = x_start
        while x <= float(max_x) and len(sampled) < cap:
            pt = Point(float(x), float(y))
            if poly.covers(pt):
                sampled.append([float(x), float(y)])
            x += dx_deg
        y += dy_deg
        row += 1
    return _dedupe_points(sampled)


def _pick_largest_polygon(geom: Any) -> Optional[Polygon]:
    if geom is None:
        return None
    if isinstance(geom, Polygon):
        return geom if not geom.is_empty else None
    if isinstance(geom, MultiPolygon):
        geoms = [g for g in geom.geoms if isinstance(g, Polygon) and not g.is_empty]
        if not geoms:
            return None
        return max(geoms, key=lambda g: g.area)
    if getattr(geom, "geom_type", "") == "GeometryCollection":
        polys: List[Polygon] = []
        for g in getattr(geom, "geoms", []):
            picked = _pick_largest_polygon(g)
            if picked is not None:
                polys.append(picked)
        if not polys:
            return None
        return max(polys, key=lambda g: g.area)
    return None


def _has_non_empty_area_geometry(geom: Any) -> bool:
    return bool(getattr(geom, "is_empty", True) is False)


def _build_scope_sample_points(
    scope_poly: Polygon,
    center_lon: float,
    center_lat: float,
    *,
    boundary_step_m: float,
    inner_step_m: float,
    max_points: Optional[int],
) -> List[List[float]]:
    _ = inner_step_m
    boundary_cap = None if max_points is None else max(120, int(max_points) * 4)
    boundary_pts = _sample_boundary_points(scope_poly, float(boundary_step_m), cap=boundary_cap)
    if boundary_pts:
        if max_points is not None and len(boundary_pts) > int(max_points):
            return _limit_points_evenly(boundary_pts, int(max_points))
        return boundary_pts

    base_points: List[List[float]] = [[float(center_lon), float(center_lat)]]
    if scope_poly and not scope_poly.is_empty:
        rp = scope_poly.representative_point()
        base_points.append([float(rp.x), float(rp.y)])
    deduped = _dedupe_points(base_points)
    if max_points is not None and len(deduped) > int(max_points):
        return _limit_points_evenly(deduped, int(max_points))
    return deduped


def _parse_clip_polygon(
    clip_polygon_raw: Optional[List[List[float]]],
    coord_type: str,
) -> Optional[Polygon]:
    if not clip_polygon_raw:
        return None

    clip_ring: List[List[float]] = []
    for pt in clip_polygon_raw or []:
        if not isinstance(pt, list) or len(pt) < 2:
            continue
        try:
            x = float(pt[0])
            y = float(pt[1])
        except (TypeError, ValueError):
            continue
        if coord_type == "gcj02":
            x, y = gcj02_to_wgs84(x, y)
        clip_ring.append([x, y])

    if len(clip_ring) >= 3:
        first = clip_ring[0]
        last = clip_ring[-1]
        if abs(first[0] - last[0]) > 1e-9 or abs(first[1] - last[1]) > 1e-9:
            clip_ring.append([first[0], first[1]])
    if len(clip_ring) < 4:
        raise HTTPException(400, "Invalid clip_polygon")

    clip_geom = Polygon(clip_ring)
    if not clip_geom.is_valid:
        clip_geom = clip_geom.buffer(0)
    clip_poly = _pick_largest_polygon(clip_geom)
    if clip_poly is None:
        raise HTTPException(400, "Invalid clip_polygon")
    return clip_poly


def _transform_area_geometry_to_coord_type(geom: Any, coord_type: str) -> Any:
    if coord_type != "gcj02" or geom is None:
        return geom

    def _trans(x, y, z=None):
        try:
            iter(x)
            nx, ny = [], []
            for i in range(len(x)):
                tx, ty = wgs84_to_gcj02(x[i], y[i])
                nx.append(tx)
                ny.append(ty)
            return tuple(nx), tuple(ny)
        except Exception:
            return wgs84_to_gcj02(x, y)

    return transform(_trans, geom)


def _transform_point_from_wgs84(lon: float, lat: float, coord_type: str) -> List[float]:
    if coord_type == "gcj02":
        tlon, tlat = wgs84_to_gcj02(float(lon), float(lat))
        return [float(tlon), float(tlat)]
    return [float(lon), float(lat)]


@router.post("/api/v1/analysis/isochrone", response_model=IsochroneResponse)
async def calculate_isochrone(payload: IsochroneRequest):
    start = time.time()
    lat, lon = payload.lat, payload.lon
    if payload.coord_type == "gcj02":
        lon, lat = gcj02_to_wgs84(payload.lon, payload.lat)

    clip_poly = _parse_clip_polygon(payload.clip_polygon, payload.coord_type)

    sample_points: List[List[float]] = [[lon, lat]]
    if payload.origin_mode == "multi_sample":
        if clip_poly is None:
            raise HTTPException(400, "origin_mode=multi_sample requires clip_polygon")
        sample_points = _build_scope_sample_points(
            clip_poly,
            lon,
            lat,
            boundary_step_m=float(payload.sample_boundary_step_m),
            inner_step_m=float(payload.sample_inner_step_m),
            max_points=int(payload.sample_max_points) if payload.sample_max_points is not None else None,
        )
        if not sample_points:
            sample_points = [[lon, lat]]

    if payload.origin_mode == "multi_sample":
        sem = asyncio.Semaphore(8)

        async def _compute_one(pt: List[float]):
            async with sem:
                return await asyncio.to_thread(
                    get_isochrone_polygon,
                    float(pt[1]),
                    float(pt[0]),
                    payload.time_min * 60,
                    payload.mode,
                )

        results = await asyncio.gather(*[_compute_one(pt) for pt in sample_points], return_exceptions=True)
        polys = []
        for item in results:
            if isinstance(item, Exception):
                continue
            picked = _pick_largest_polygon(item)
            if picked is not None and not picked.is_empty:
                polys.append(picked)
        if clip_poly is not None:
            polys.append(clip_poly)
        if not polys:
            raise HTTPException(404, "Empty isochrone result")
        final_poly = unary_union(polys)
        if not _has_non_empty_area_geometry(final_poly):
            raise HTTPException(404, "Empty isochrone result")
    else:
        poly_wgs84 = await asyncio.to_thread(
            get_isochrone_polygon, lat, lon, payload.time_min * 60, payload.mode
        )
        final_poly = _pick_largest_polygon(poly_wgs84)
        if final_poly is None:
            raise HTTPException(404, "Empty isochrone result")

    should_clip_output = bool(payload.clip_output) if payload.clip_output is not None else (
        payload.origin_mode != "multi_sample"
    )
    if clip_poly is not None and should_clip_output:
        clipped = final_poly.intersection(clip_poly)
        final_poly = clipped
        if not _has_non_empty_area_geometry(final_poly):
            raise HTTPException(404, "Empty isochrone result after clip")

    final_poly = _transform_area_geometry_to_coord_type(final_poly, payload.coord_type)

    return {
        "type": "Feature",
        "properties": {
            "center": [payload.lon, payload.lat],
            "time_min": payload.time_min,
            "mode": payload.mode,
            "origin_mode": payload.origin_mode,
            "origin_count": len(sample_points),
            "scope_clipped": bool(payload.clip_polygon and should_clip_output),
            "calc_time_ms": int((time.time() - start) * 1000),
        },
        "geometry": mapping(final_poly),
    }


@router.post("/api/v1/analysis/isochrone/debug-samples", response_model=IsochroneDebugSampleResponse)
async def debug_isochrone_samples(payload: IsochroneDebugSampleRequest):
    lat, lon = payload.lat, payload.lon
    if payload.coord_type == "gcj02":
        lon, lat = gcj02_to_wgs84(payload.lon, payload.lat)

    clip_poly = _parse_clip_polygon(payload.clip_polygon, payload.coord_type)
    if clip_poly is None:
        raise HTTPException(400, "Invalid clip_polygon")

    sample_points = _build_scope_sample_points(
        clip_poly,
        lon,
        lat,
        boundary_step_m=float(payload.sample_boundary_step_m),
        inner_step_m=220.0,
        max_points=int(payload.sample_max_points) if payload.sample_max_points is not None else None,
    )
    if not sample_points:
        sample_points = [[float(lon), float(lat)]]

    sem = asyncio.Semaphore(8)

    async def _compute_one(sample_id: str, seq: int, pt: List[float]):
        async with sem:
            try:
                geom = await asyncio.to_thread(
                    get_isochrone_polygon,
                    float(pt[1]),
                    float(pt[0]),
                    payload.time_min * 60,
                    payload.mode,
                )
            except Exception as exc:
                return {
                    "ok": False,
                    "sample_id": sample_id,
                    "seq": seq,
                    "message": str(exc) or exc.__class__.__name__,
                }

            if geom is None or getattr(geom, "is_empty", True):
                return {
                    "ok": False,
                    "sample_id": sample_id,
                    "seq": seq,
                    "message": "Empty isochrone result",
                }

            transformed_geom = _transform_area_geometry_to_coord_type(geom, payload.coord_type)
            return {
                "ok": True,
                "sample_id": sample_id,
                "seq": seq,
                "geometry": mapping(transformed_geom),
            }

    sample_point_rows = []
    tasks = []
    for idx, pt in enumerate(sample_points, start=1):
        sample_id = f"sample_{idx:03d}"
        sample_point_rows.append(
            {
                "id": sample_id,
                "seq": idx,
                "location": _transform_point_from_wgs84(float(pt[0]), float(pt[1]), payload.coord_type),
            }
        )
        tasks.append(_compute_one(sample_id, idx, pt))

    raw_results = await asyncio.gather(*tasks)
    feature_rows = []
    errors = []
    for item in raw_results:
        if item.get("ok"):
            feature_rows.append(
                {
                    "type": "Feature",
                    "properties": {
                        "sample_id": item["sample_id"],
                        "seq": item["seq"],
                    },
                    "geometry": item["geometry"],
                }
            )
            continue
        errors.append(
            {
                "sample_id": item["sample_id"],
                "seq": item["seq"],
                "message": item["message"],
            }
        )

    if not feature_rows:
        raise HTTPException(502, "All debug sample isochrone requests failed")

    scope_geometry = mapping(_transform_area_geometry_to_coord_type(clip_poly, payload.coord_type))
    return {
        "scope_geometry": scope_geometry,
        "sample_points": sample_point_rows,
        "isochrone_features": feature_rows,
        "meta": {
            "origin_count": len(sample_point_rows),
            "time_min": payload.time_min,
            "mode": payload.mode,
            "coord_type": payload.coord_type,
            "sample_boundary_step_m": payload.sample_boundary_step_m,
            "errors": errors,
        },
    }

