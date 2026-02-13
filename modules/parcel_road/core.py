import json
import logging
import math
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import requests
from shapely.geometry import GeometryCollection, LineString, MultiLineString, MultiPolygon, Polygon, shape, mapping
from shapely.ops import polygonize, transform, unary_union

from core.config import settings
from modules.gaode_service.utils.transform_posi import gcj02_to_wgs84, wgs84_to_gcj02

logger = logging.getLogger(__name__)

EARTH_RADIUS_M = 6371008.8


def _decode_polyline(encoded: str, precision: int = 6) -> List[Tuple[float, float]]:
    if not encoded:
        return []
    coords: List[Tuple[float, float]] = []
    index = 0
    lat = 0
    lng = 0
    factor = 10 ** precision

    while index < len(encoded):
        result = 1
        shift = 0
        while True:
            b = ord(encoded[index]) - 63 - 1
            index += 1
            result += b << shift
            shift += 5
            if b < 0x1F:
                break
        lat += ~(result >> 1) if (result & 1) else (result >> 1)

        result = 1
        shift = 0
        while True:
            b = ord(encoded[index]) - 63 - 1
            index += 1
            result += b << shift
            shift += 5
            if b < 0x1F:
                break
        lng += ~(result >> 1) if (result & 1) else (result >> 1)

        coords.append((lng / factor, lat / factor))

    return coords


def _iter_lines(geom: Any) -> Iterable[LineString]:
    if geom is None or geom.is_empty:
        return
    if isinstance(geom, LineString):
        if len(geom.coords) >= 2:
            yield geom
        return
    if isinstance(geom, MultiLineString):
        for line in geom.geoms:
            if len(line.coords) >= 2:
                yield line
        return
    if isinstance(geom, GeometryCollection):
        for item in geom.geoms:
            yield from _iter_lines(item)


def _iter_polygons(geom: Any) -> Iterable[Polygon]:
    if geom is None or geom.is_empty:
        return
    if isinstance(geom, Polygon):
        yield geom
        return
    if isinstance(geom, MultiPolygon):
        for poly in geom.geoms:
            if not poly.is_empty:
                yield poly
        return
    if isinstance(geom, GeometryCollection):
        for item in geom.geoms:
            yield from _iter_polygons(item)


def _ring_to_polygon(polygon_ring: Sequence[Sequence[float]]) -> Polygon:
    points: List[Tuple[float, float]] = []
    for pt in polygon_ring:
        if not isinstance(pt, (list, tuple)) or len(pt) < 2:
            continue
        points.append((float(pt[0]), float(pt[1])))

    if len(points) < 3:
        raise ValueError("Invalid polygon ring")

    if points[0] != points[-1]:
        points.append(points[0])

    poly = Polygon(points)
    if not poly.is_valid:
        poly = poly.buffer(0)
    if poly.is_empty:
        raise ValueError("Failed to build valid polygon")

    if isinstance(poly, MultiPolygon):
        poly = max(poly.geoms, key=lambda g: g.area)

    return poly


def _gcj_ring_to_wgs(polygon_ring: Sequence[Sequence[float]]) -> List[List[float]]:
    wgs_ring: List[List[float]] = []
    for pt in polygon_ring:
        if not isinstance(pt, (list, tuple)) or len(pt) < 2:
            continue
        lng, lat = float(pt[0]), float(pt[1])
        wl, wa = gcj02_to_wgs84(lng, lat)
        wgs_ring.append([wl, wa])
    return wgs_ring


def _transform_wgs_to_gcj(geom: Any) -> Any:
    def _trans(x, y, z=None):
        try:
            nx: List[float] = []
            ny: List[float] = []
            for i in range(len(x)):
                tx, ty = wgs84_to_gcj02(float(x[i]), float(y[i]))
                nx.append(tx)
                ny.append(ty)
            return tuple(nx), tuple(ny)
        except TypeError:
            tx, ty = wgs84_to_gcj02(float(x), float(y))
            return tx, ty

    return transform(_trans, geom)


def _project_to_local_meters(geom: Any, ref_lat: float) -> Any:
    lat0 = math.radians(ref_lat)

    def _proj(x, y, z=None):
        try:
            xs: List[float] = []
            ys: List[float] = []
            for i in range(len(x)):
                lon_rad = math.radians(float(x[i]))
                lat_rad = math.radians(float(y[i]))
                xs.append(EARTH_RADIUS_M * lon_rad * math.cos(lat0))
                ys.append(EARTH_RADIUS_M * lat_rad)
            return tuple(xs), tuple(ys)
        except TypeError:
            lon_rad = math.radians(float(x))
            lat_rad = math.radians(float(y))
            return EARTH_RADIUS_M * lon_rad * math.cos(lat0), EARTH_RADIUS_M * lat_rad

    return transform(_proj, geom)


def _extract_lines_from_payload(payload: Any) -> List[LineString]:
    lines: List[LineString] = []
    seen = set()

    def _add_line(geom: LineString) -> None:
        if geom.is_empty or len(geom.coords) < 2:
            return
        key = geom.wkb_hex
        if key in seen:
            return
        seen.add(key)
        lines.append(geom)

    def _try_add_geometry(geometry_obj: Any) -> None:
        if not isinstance(geometry_obj, dict):
            return
        geom_type = geometry_obj.get("type")
        if geom_type not in {"LineString", "MultiLineString", "GeometryCollection"}:
            return
        try:
            geom = shape(geometry_obj)
        except Exception:
            return
        for line in _iter_lines(geom):
            _add_line(line)

    def _try_add_polyline(encoded: str) -> None:
        if not isinstance(encoded, str) or len(encoded) < 3:
            return

        if encoded.lstrip().startswith("{"):
            try:
                geometry_obj = json.loads(encoded)
                _try_add_geometry(geometry_obj)
                return
            except Exception:
                pass

        for precision in (6, 5):
            try:
                coords = _decode_polyline(encoded, precision=precision)
            except Exception:
                coords = []
            if len(coords) >= 2:
                _add_line(LineString(coords))
                return

    def _walk(node: Any) -> None:
        if isinstance(node, dict):
            _try_add_geometry(node.get("geometry"))

            for key in ("shape", "polyline", "polyline6", "encoded_polyline", "line"):
                _try_add_polyline(node.get(key))

            for value in node.values():
                _walk(value)
        elif isinstance(node, list):
            for item in node:
                _walk(item)

    _walk(payload)
    return lines


def _fetch_valhalla_expansion_lines(
    center_lng: float,
    center_lat: float,
    time_min: int,
    mode: str,
) -> List[LineString]:
    costing_map = {
        "walking": "pedestrian",
        "bicycling": "bicycle",
        "driving": "auto",
    }
    costing = costing_map.get(mode, "pedestrian")

    payload: Dict[str, Any] = {
        "costing": costing,
        "action": "isochrone",
        "locations": [{"lon": center_lng, "lat": center_lat}],
        "contours": [{"time": int(time_min)}],
        "dedupe": True,
        "skip_opposites": True,
    }

    url = f"{settings.valhalla_base_url.rstrip('/')}/expansion"
    resp = requests.post(url, json=payload, timeout=settings.valhalla_timeout_s)
    resp.raise_for_status()
    data = resp.json()

    lines = _extract_lines_from_payload(data)
    if not lines:
        raise RuntimeError("Valhalla expansion returned no road geometries")
    return lines


def _clip_lines_to_polygon(lines: Iterable[LineString], polygon: Polygon) -> List[LineString]:
    clipped: List[LineString] = []
    for line in lines:
        if line.is_empty:
            continue
        try:
            inter = line.intersection(polygon)
        except Exception:
            continue
        for part in _iter_lines(inter):
            if part.length > 1e-10:
                clipped.append(part)
    return clipped


def _build_parcels_from_roads(
    boundary_polygon_wgs: Polygon,
    road_lines_wgs: List[LineString],
    min_parcel_area_m2: float,
) -> List[Dict[str, Any]]:
    if not road_lines_wgs:
        return []

    merged = unary_union(road_lines_wgs + [boundary_polygon_wgs.boundary])
    raw_faces = list(polygonize(merged))

    ref_lat = float(boundary_polygon_wgs.centroid.y)
    parcels: List[Dict[str, Any]] = []

    for face in raw_faces:
        if face.is_empty:
            continue
        clipped = face.intersection(boundary_polygon_wgs)
        for poly in _iter_polygons(clipped):
            if poly.is_empty:
                continue
            poly_meter = _project_to_local_meters(poly, ref_lat)
            area_m2 = float(poly_meter.area)
            if area_m2 < min_parcel_area_m2:
                continue
            perimeter_m = float(poly_meter.length)
            compactness = float((4 * math.pi * area_m2 / (perimeter_m ** 2)) if perimeter_m > 0 else 0.0)
            parcels.append(
                {
                    "geom_wgs": poly,
                    "area_m2": area_m2,
                    "perimeter_m": perimeter_m,
                    "compactness": compactness,
                }
            )

    parcels.sort(key=lambda item: item["area_m2"], reverse=True)
    return parcels


def build_road_parcels_feature_collection(
    polygon_ring: Sequence[Sequence[float]],
    coord_type: str = "gcj02",
    center: Optional[Sequence[float]] = None,
    mode: str = "walking",
    time_min: int = 15,
    min_parcel_area_m2: float = 300.0,
) -> Dict[str, Any]:
    coord = (coord_type or "gcj02").lower()
    if coord not in {"gcj02", "wgs84"}:
        raise ValueError("coord_type must be gcj02 or wgs84")

    if coord == "gcj02":
        polygon_wgs = _ring_to_polygon(_gcj_ring_to_wgs(polygon_ring))
    else:
        polygon_wgs = _ring_to_polygon(polygon_ring)

    if center and len(center) >= 2:
        center_lng = float(center[0])
        center_lat = float(center[1])
        if coord == "gcj02":
            center_lng, center_lat = gcj02_to_wgs84(center_lng, center_lat)
    else:
        center_lng = float(polygon_wgs.centroid.x)
        center_lat = float(polygon_wgs.centroid.y)

    road_lines = _fetch_valhalla_expansion_lines(
        center_lng=center_lng,
        center_lat=center_lat,
        time_min=int(time_min),
        mode=mode,
    )
    road_lines = _clip_lines_to_polygon(road_lines, polygon_wgs)

    if not road_lines:
        raise RuntimeError("No usable road lines found inside current polygon")

    parcels = _build_parcels_from_roads(
        boundary_polygon_wgs=polygon_wgs,
        road_lines_wgs=road_lines,
        min_parcel_area_m2=float(min_parcel_area_m2),
    )

    features: List[Dict[str, Any]] = []
    for idx, row in enumerate(parcels, start=1):
        geom = row["geom_wgs"]
        if coord == "gcj02":
            geom = _transform_wgs_to_gcj(geom)

        features.append(
            {
                "type": "Feature",
                "geometry": mapping(geom),
                "properties": {
                    "parcel_id": f"parcel_{idx:04d}",
                    "area_m2": round(row["area_m2"], 2),
                    "perimeter_m": round(row["perimeter_m"], 2),
                    "compactness": round(row["compactness"], 4),
                },
            }
        )

    return {
        "type": "FeatureCollection",
        "features": features,
        "count": len(features),
        "meta": {
            "source": "valhalla_expansion",
            "road_line_count": len(road_lines),
            "min_parcel_area_m2": float(min_parcel_area_m2),
        },
    }
