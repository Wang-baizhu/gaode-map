from __future__ import annotations

import base64
import copy
import io
import json
import logging
import math
import threading
from collections import OrderedDict
from hashlib import sha1
from pathlib import Path
from typing import Any, Dict, Sequence

import numpy as np
from shapely.geometry import MultiPolygon, Polygon, mapping
from shapely.geometry.base import BaseGeometry
from shapely.ops import transform

from core.config import settings
from modules.providers.amap.utils.transform_posi import gcj02_to_wgs84, wgs84_to_gcj02

logger = logging.getLogger(__name__)

RADIANCE_VIEW = "radiance"
RADIANCE_VIEW_LABEL = "夜光辐亮"
RADIANCE_UNIT = "nWatts/(cm^2 sr)"
PREVIEW_STYLE_VERSION = "v1"
GRID_STYLE_VERSION = "v1"
MANIFEST_FILENAME = "manifest.json"
DEFAULT_VARIABLE_NAME = "NearNadir_Composite_Snow_Free"
PREVIEW_PALETTE = [
    (9, 11, 31),
    (35, 57, 91),
    (47, 104, 141),
    (96, 165, 250),
    (250, 204, 21),
    (249, 115, 22),
]

_CACHE_LOCK = threading.Lock()
_CLIP_CACHE: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()
_CLIP_CACHE_MAX_ENTRIES = 16


def _require_rasterio():
    try:
        import rasterio  # type: ignore
        from rasterio.mask import mask  # type: ignore
        from rasterio.transform import array_bounds  # type: ignore

        return rasterio, mask, array_bounds
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(
            f"nightlight rasterio import failed: {exc.__class__.__name__}: {exc}"
        ) from exc


def _require_pillow():
    try:
        from PIL import Image  # type: ignore

        return Image
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(
            f"nightlight pillow import failed: {exc.__class__.__name__}: {exc}"
        ) from exc


def _project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _resolve_dir(path_value: str) -> Path:
    path = Path(path_value).expanduser()
    if not path.is_absolute():
        path = _project_root() / path
    return path.resolve()


def _manifest_path() -> Path:
    return _resolve_dir(settings.nightlight_data_dir) / MANIFEST_FILENAME


def _normalize_ring(points: Sequence[Any]) -> list[tuple[float, float]]:
    coords: list[tuple[float, float]] = []
    for item in points or []:
        if not isinstance(item, (list, tuple)) or len(item) < 2:
            continue
        try:
            coords.append((float(item[0]), float(item[1])))
        except (TypeError, ValueError):
            continue
    if coords and coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords


def _polygon_from_payload(polygon: list) -> BaseGeometry:
    if not isinstance(polygon, list) or not polygon:
        return Polygon()
    if (
        polygon
        and isinstance(polygon[0], (list, tuple))
        and len(polygon[0]) >= 2
        and isinstance(polygon[0][0], (int, float))
    ):
        ring = _normalize_ring(polygon)
        return Polygon(ring) if len(ring) >= 4 else Polygon()

    polygons: list[Polygon] = []
    for item in polygon:
        ring_source = item
        if (
            isinstance(item, list)
            and item
            and isinstance(item[0], list)
            and item[0]
            and isinstance(item[0][0], (list, tuple))
        ):
            ring_source = item[0]
        ring = _normalize_ring(ring_source)
        if len(ring) < 4:
            continue
        poly = Polygon(ring)
        repaired = poly if poly.is_valid else poly.buffer(0)
        if repaired.is_empty:
            continue
        if isinstance(repaired, Polygon):
            polygons.append(repaired)
        elif isinstance(repaired, MultiPolygon):
            polygons.extend(part for part in repaired.geoms if isinstance(part, Polygon) and not part.is_empty)
    if not polygons:
        return Polygon()
    if len(polygons) == 1:
        return polygons[0]
    return MultiPolygon(polygons)


def _convert_geometry(geom: BaseGeometry, converter) -> BaseGeometry:
    def _transform(x, y, z=None):
        try:
            iter(x)
            nx = []
            ny = []
            for idx in range(len(x)):
                tx, ty = converter(x[idx], y[idx])
                nx.append(tx)
                ny.append(ty)
            return tuple(nx), tuple(ny)
        except Exception:
            return converter(x, y)

    return transform(_transform, geom)


def _to_wgs84_geometry(polygon: list, coord_type: str) -> BaseGeometry:
    geom = _polygon_from_payload(polygon)
    if geom.is_empty:
        raise ValueError("invalid polygon")
    if coord_type == "gcj02":
        geom = _convert_geometry(geom, gcj02_to_wgs84)
    geom = geom.buffer(0)
    if geom.is_empty:
        raise ValueError("invalid polygon")
    return geom


def _round_float(value: Any, digits: int = 6) -> float:
    try:
        return round(float(value), digits)
    except Exception:
        return 0.0


def _year_label(year: int) -> str:
    return f"{int(year)} 年"


def _build_scope_id(geom_wgs84: BaseGeometry, year: int) -> str:
    digest = sha1(f"{year}:".encode("utf-8") + geom_wgs84.wkb).hexdigest()
    return digest[:24]


def _default_summary() -> Dict[str, Any]:
    return {
        "total_radiance": 0.0,
        "mean_radiance": 0.0,
        "max_radiance": 0.0,
        "lit_pixel_ratio": 0.0,
        "p90_radiance": 0.0,
        "valid_pixel_count": 0,
        "lit_pixel_count": 0,
    }


def _load_manifest() -> Dict[str, Any]:
    manifest_path = _manifest_path()
    if not manifest_path.exists():
        raise RuntimeError(f"nightlight manifest not found: {manifest_path}")
    try:
        payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise RuntimeError(f"nightlight manifest parse failed: {exc}") from exc
    datasets = payload.get("datasets")
    if not isinstance(datasets, list) or not datasets:
        raise RuntimeError("nightlight manifest datasets missing")
    available_years = []
    for item in datasets:
        try:
            year = int(item.get("year"))
        except Exception:
            continue
        label = str(item.get("label") or _year_label(year))
        file_value = str(item.get("file") or "").strip()
        if not file_value:
            continue
        available_years.append(
            {
                "year": year,
                "label": label,
                "file": file_value,
                "unit": str(item.get("unit") or RADIANCE_UNIT),
                "variable": str(item.get("variable") or DEFAULT_VARIABLE_NAME),
            }
        )
    if not available_years:
        raise RuntimeError("nightlight manifest contains no usable datasets")
    payload["datasets"] = sorted(available_years, key=lambda item: int(item["year"]))
    try:
        default_year = int(payload.get("default_year"))
    except Exception:
        default_year = int(payload["datasets"][-1]["year"])
    if default_year not in {int(item["year"]) for item in payload["datasets"]}:
        default_year = int(payload["datasets"][-1]["year"])
    payload["default_year"] = default_year
    return payload


def _resolve_dataset(year: int | None = None) -> Dict[str, Any]:
    manifest = _load_manifest()
    target_year = int(year) if year is not None else int(manifest["default_year"])
    for item in manifest["datasets"]:
        if int(item["year"]) != target_year:
            continue
        dataset_path = _resolve_dir(settings.nightlight_data_dir) / str(item["file"])
        if not dataset_path.exists():
            raise RuntimeError(f"nightlight dataset not found: {dataset_path}")
        return {
            "year": target_year,
            "label": str(item["label"]),
            "file": str(item["file"]),
            "path": dataset_path,
            "unit": str(item.get("unit") or RADIANCE_UNIT),
            "variable": str(item.get("variable") or DEFAULT_VARIABLE_NAME),
        }
    raise ValueError(f"nightlight dataset year unavailable: {target_year}")


def _clip_cache_key(scope_id: str, year: int, dataset_marker: str = "") -> str:
    marker = str(dataset_marker or "").strip()
    return f"{year}:{scope_id}:{marker}"


def _push_clip_cache(key: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    with _CACHE_LOCK:
        _CLIP_CACHE[key] = payload
        _CLIP_CACHE.move_to_end(key)
        while len(_CLIP_CACHE) > _CLIP_CACHE_MAX_ENTRIES:
            _CLIP_CACHE.popitem(last=False)
        return payload


def _get_clip_cache(key: str) -> Dict[str, Any] | None:
    with _CACHE_LOCK:
        payload = _CLIP_CACHE.get(key)
        if payload is None:
            return None
        _CLIP_CACHE.move_to_end(key)
        return payload


def _extract_valid_values(masked_array: np.ma.MaskedArray) -> np.ndarray:
    values = np.ma.filled(masked_array, np.nan).astype(np.float64)
    mask = np.ma.getmaskarray(masked_array)
    valid = (~mask) & np.isfinite(values)
    if not np.any(valid):
        return np.asarray([], dtype=np.float64)
    return np.maximum(values[valid], 0.0)


def _mask_dataset(dataset_path: Path, geom_wgs84: BaseGeometry) -> Dict[str, Any] | None:
    rasterio, mask, _ = _require_rasterio()
    with rasterio.open(dataset_path) as src:
        try:
            masked, masked_transform = mask(
                src,
                [mapping(geom_wgs84)],
                crop=True,
                filled=False,
            )
        except ValueError:
            return None
        band = masked[0]
        if band.size == 0:
            return None
        return {
            "array": band,
            "transform": masked_transform,
            "crs": src.crs,
            "width": int(band.shape[1]),
            "height": int(band.shape[0]),
            "nodata": src.nodata,
        }


def _load_or_compute_clip(scope_id: str, year: int, dataset_path: Path, geom_wgs84: BaseGeometry) -> Dict[str, Any] | None:
    key = _clip_cache_key(scope_id, year, str(dataset_path))
    cached = _get_clip_cache(key)
    if cached is not None:
        return cached
    payload = _mask_dataset(dataset_path, geom_wgs84)
    if payload is None:
        return _push_clip_cache(key, {"array": None, "empty": True})
    payload["empty"] = False
    return _push_clip_cache(key, payload)


def _summarize_values(masked_array: np.ma.MaskedArray | None) -> Dict[str, Any]:
    if masked_array is None:
        return _default_summary()
    values = _extract_valid_values(masked_array)
    valid_count = int(values.size)
    if valid_count <= 0:
        return _default_summary()
    lit_values = values[values > 0]
    lit_count = int(lit_values.size)
    summary = {
        "total_radiance": _round_float(np.sum(values), 3),
        "mean_radiance": _round_float(np.mean(values), 3),
        "max_radiance": _round_float(np.max(values), 3),
        "lit_pixel_ratio": _round_float((lit_count / valid_count), 6),
        "p90_radiance": _round_float(np.percentile(values, 90), 3),
        "valid_pixel_count": valid_count,
        "lit_pixel_count": lit_count,
    }
    return summary


def _transform_corner(masked_transform, col: int, row: int) -> tuple[float, float]:
    return masked_transform * (float(col), float(row))


def _cell_polygon_gcj02(masked_transform, row_start: int, col_start: int, row_end: int, col_end: int) -> list[list[list[float]]]:
    corners_wgs84 = [
        _transform_corner(masked_transform, col_start, row_start),
        _transform_corner(masked_transform, col_end, row_start),
        _transform_corner(masked_transform, col_end, row_end),
        _transform_corner(masked_transform, col_start, row_end),
        _transform_corner(masked_transform, col_start, row_start),
    ]
    return [[
        [float(pair[0]), float(pair[1])]
        for pair in (wgs84_to_gcj02(lng, lat) for lng, lat in corners_wgs84)
    ]]


def _cell_centroid_gcj02(masked_transform, row_start: int, col_start: int, row_end: int, col_end: int) -> list[float]:
    center_col = col_start + ((col_end - col_start) / 2.0)
    center_row = row_start + ((row_end - row_start) / 2.0)
    lng, lat = masked_transform * (center_col, center_row)
    gcj_lng, gcj_lat = wgs84_to_gcj02(float(lng), float(lat))
    return [float(gcj_lng), float(gcj_lat)]


def _build_cell_id(row_start: int, col_start: int, stride: int) -> str:
    return f"nl_{int(row_start)}_{int(col_start)}_{int(stride)}"


def _build_aggregated_cells(masked_array: np.ma.MaskedArray, masked_transform, max_cells: int) -> list[dict[str, Any]]:
    values = np.ma.filled(masked_array, np.nan).astype(np.float64)
    mask = np.ma.getmaskarray(masked_array)
    valid = (~mask) & np.isfinite(values)
    valid_count = int(np.sum(valid))
    if valid_count <= 0:
        return []
    safe_values = np.maximum(values, 0.0)
    stride = max(1, int(math.ceil(math.sqrt(valid_count / max(max_cells, 1)))))
    height, width = safe_values.shape
    cells: list[dict[str, Any]] = []
    block_row = 0
    for row_start in range(0, height, stride):
        row_end = min(height, row_start + stride)
        block_col = 0
        for col_start in range(0, width, stride):
            col_end = min(width, col_start + stride)
            block_valid = valid[row_start:row_end, col_start:col_end]
            if not np.any(block_valid):
                block_col += 1
                continue
            block_values = safe_values[row_start:row_end, col_start:col_end][block_valid]
            value = float(np.mean(block_values))
            cell_id = _build_cell_id(row_start, col_start, stride)
            cells.append(
                {
                    "cell_id": cell_id,
                    "row": int(block_row),
                    "col": int(block_col),
                    "raw_value": _round_float(value, 6),
                    "centroid_gcj02": _cell_centroid_gcj02(masked_transform, row_start, col_start, row_end, col_end),
                    "geometry_gcj02": _cell_polygon_gcj02(masked_transform, row_start, col_start, row_end, col_end),
                }
            )
            block_col += 1
        block_row += 1
    return cells


def _palette_color(ratio: float) -> tuple[int, int, int]:
    if ratio <= 0:
        return PREVIEW_PALETTE[0]
    if ratio >= 1:
        return PREVIEW_PALETTE[-1]
    scaled = ratio * (len(PREVIEW_PALETTE) - 1)
    idx = int(np.floor(scaled))
    if idx >= len(PREVIEW_PALETTE) - 1:
        return PREVIEW_PALETTE[-1]
    local = scaled - idx
    left = PREVIEW_PALETTE[idx]
    right = PREVIEW_PALETTE[idx + 1]
    return tuple(
        int(round(left[channel] + (right[channel] - left[channel]) * local))
        for channel in range(3)
    )


def _colorize_nightlight_array(masked_array: np.ma.MaskedArray, max_size: int):
    Image = _require_pillow()

    values = np.ma.filled(masked_array, np.nan).astype(np.float64)
    mask = np.ma.getmaskarray(masked_array)
    valid = (~mask) & np.isfinite(values)
    safe = np.where(valid, np.maximum(values, 0.0), 0.0)
    height, width = safe.shape
    if height <= 0 or width <= 0:
        raise RuntimeError("empty nightlight raster preview")

    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    positive = safe[safe > 0]
    if positive.size:
        min_value = float(np.percentile(positive, 5))
        max_value = float(np.percentile(positive, 98))
        if max_value <= min_value:
            min_value = float(np.min(positive))
            max_value = float(np.max(positive))
        log_valid = np.log1p(safe)
        log_min = np.log1p(max(min_value, 0.0))
        log_max = np.log1p(max(max_value, min_value + 1e-9))
        span = max(log_max - log_min, 1e-9)
        normalized = np.clip((log_valid - log_min) / span, 0.0, 1.0)
        normalized = np.where(safe > 0, normalized, 0.0)
        scaled = normalized * (len(PREVIEW_PALETTE) - 1)
        left_idx = np.floor(scaled).astype(np.int64)
        left_idx = np.clip(left_idx, 0, len(PREVIEW_PALETTE) - 1)
        right_idx = np.clip(left_idx + 1, 0, len(PREVIEW_PALETTE) - 1)
        local_ratio = (scaled - left_idx).astype(np.float64)
        palette = np.asarray(PREVIEW_PALETTE, dtype=np.float64)
        left_colors = palette[left_idx]
        right_colors = palette[right_idx]
        rgb = left_colors + ((right_colors - left_colors) * local_ratio[..., None])
        rgba[..., 0] = np.where(safe > 0, rgb[..., 0], 0).astype(np.uint8)
        rgba[..., 1] = np.where(safe > 0, rgb[..., 1], 0).astype(np.uint8)
        rgba[..., 2] = np.where(safe > 0, rgb[..., 2], 0).astype(np.uint8)
        alpha = np.where(
            normalized > 0.025,
            18 + (210 * np.power(normalized, 0.8)),
            0,
        )
        rgba[..., 3] = alpha.astype(np.uint8)
    else:
        min_value = 0.0
        max_value = 0.0

    image = Image.fromarray(rgba, mode="RGBA")
    longest = max(width, height)
    if longest > max_size:
        scale = max_size / float(longest)
        target_size = (max(1, int(round(width * scale))), max(1, int(round(height * scale))))
        image = image.resize(target_size, Image.Resampling.NEAREST)
    return image, min_value, max_value


def _bounds_gcj02_from_transform(masked_transform, width: int, height: int) -> list[list[float]]:
    _, _, array_bounds = _require_rasterio()
    west, south, east, north = array_bounds(height, width, masked_transform)
    sw = wgs84_to_gcj02(west, south)
    ne = wgs84_to_gcj02(east, north)
    return [
        [float(sw[0]), float(sw[1])],
        [float(ne[0]), float(ne[1])],
    ]


def _build_legend(title: str, min_value: float, max_value: float, unit: str = RADIANCE_UNIT) -> Dict[str, Any]:
    stops = []
    for ratio in (0.0, 0.25, 0.5, 0.75, 1.0):
        value = min_value + ((max_value - min_value) * ratio)
        color = _palette_color(ratio)
        stops.append(
            {
                "ratio": _round_float(ratio, 3),
                "color": f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}",
                "value": _round_float(value, 3),
                "label": None,
            }
        )
    return {
        "title": RADIANCE_VIEW_LABEL,
        "kind": "continuous",
        "unit": unit,
        "min_value": _round_float(min_value, 3),
        "max_value": _round_float(max_value, 3),
        "stops": stops,
    }


def _build_layer_cells(grid_cells: list[dict[str, Any]], unit: str) -> tuple[list[dict[str, Any]], Dict[str, Any]]:
    if not grid_cells:
        return [], _build_legend(RADIANCE_VIEW_LABEL, 0.0, 0.0, unit)
    values = np.asarray([max(0.0, float(cell["raw_value"])) for cell in grid_cells], dtype=np.float64)
    positive = values[values > 0]
    if positive.size:
        min_value = float(np.percentile(positive, 5))
        max_value = float(np.percentile(positive, 98))
        if max_value <= min_value:
            min_value = float(np.min(positive))
            max_value = float(np.max(positive))
    else:
        min_value = 0.0
        max_value = 0.0
    span = max(max_value - min_value, 1e-9)
    cells = []
    for cell in grid_cells:
        raw_value = max(0.0, float(cell["raw_value"]))
        normalized = 0.0 if max_value <= min_value else max(0.0, min(1.0, (raw_value - min_value) / span))
        color = _palette_color(normalized if raw_value > 0 else 0.0)
        opacity = 0.12 + (0.52 * normalized) if raw_value > 0 else 0.08
        cells.append(
            {
                "cell_id": str(cell["cell_id"]),
                "value": _round_float(raw_value, 3),
                "fill_color": f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}",
                "stroke_color": "#ffffff",
                "fill_opacity": _round_float(opacity, 3),
                "label": f"{RADIANCE_VIEW_LABEL} {_round_float(raw_value, 2)} {unit}",
            }
        )
    return cells, _build_legend(RADIANCE_VIEW_LABEL, min_value, max_value, unit)


def _selected_descriptor(year: int, unit: str) -> Dict[str, Any]:
    return {
        "year": int(year),
        "year_label": _year_label(year),
        "view": RADIANCE_VIEW,
        "view_label": RADIANCE_VIEW_LABEL,
        "unit": unit,
    }


def build_nightlight_meta_payload() -> Dict[str, Any]:
    manifest = _load_manifest()
    return {
        "available_years": [
            {"year": int(item["year"]), "label": str(item["label"])}
            for item in manifest["datasets"]
        ],
        "default_year": int(manifest["default_year"]),
    }


def get_nightlight_overview(polygon: list, coord_type: str = "gcj02", year: int | None = None) -> Dict[str, Any]:
    dataset = _resolve_dataset(year)
    geom_wgs84 = _to_wgs84_geometry(polygon, coord_type)
    scope_id = _build_scope_id(geom_wgs84, int(dataset["year"]))
    clip = _load_or_compute_clip(scope_id, int(dataset["year"]), dataset["path"], geom_wgs84)
    summary = _summarize_values(None if not clip or clip.get("empty") else clip.get("array"))
    return {
        "scope_id": scope_id,
        "year": int(dataset["year"]),
        "summary": summary,
    }


def get_nightlight_grid(polygon: list, coord_type: str = "gcj02", year: int | None = None) -> Dict[str, Any]:
    dataset = _resolve_dataset(year)
    geom_wgs84 = _to_wgs84_geometry(polygon, coord_type)
    scope_id = _build_scope_id(geom_wgs84, int(dataset["year"]))
    clip = _load_or_compute_clip(scope_id, int(dataset["year"]), dataset["path"], geom_wgs84)
    if not clip or clip.get("empty"):
        return {
            "scope_id": scope_id,
            "year": int(dataset["year"]),
            "cell_count": 0,
            "features": [],
        }
    raw_cells = _build_aggregated_cells(
        clip["array"],
        clip["transform"],
        int(settings.nightlight_grid_max_cells or 5000),
    )
    features = []
    for cell in raw_cells:
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": cell["geometry_gcj02"],
                },
                "properties": {
                    "cell_id": cell["cell_id"],
                    "row": cell["row"],
                    "col": cell["col"],
                    "centroid_gcj02": cell["centroid_gcj02"],
                },
            }
        )
    return {
        "scope_id": scope_id,
        "year": int(dataset["year"]),
        "cell_count": len(features),
        "features": features,
    }


def get_nightlight_layer(
    polygon: list,
    coord_type: str = "gcj02",
    scope_id: str | None = None,
    year: int | None = None,
    view: str = RADIANCE_VIEW,
) -> Dict[str, Any]:
    safe_view = str(view or RADIANCE_VIEW).strip().lower()
    if safe_view != RADIANCE_VIEW:
        raise ValueError(f"unsupported nightlight view: {view}")
    dataset = _resolve_dataset(year)
    geom_wgs84 = _to_wgs84_geometry(polygon, coord_type)
    resolved_scope_id = str(scope_id or _build_scope_id(geom_wgs84, int(dataset["year"])))
    clip = _load_or_compute_clip(resolved_scope_id, int(dataset["year"]), dataset["path"], geom_wgs84)
    if not clip or clip.get("empty"):
        return {
            "scope_id": resolved_scope_id,
            "year": int(dataset["year"]),
            "selected": _selected_descriptor(int(dataset["year"]), str(dataset["unit"])),
            "summary": _default_summary(),
            "legend": _build_legend(RADIANCE_VIEW_LABEL, 0.0, 0.0, str(dataset["unit"])),
            "cells": [],
        }
    summary = _summarize_values(clip["array"])
    raw_cells = _build_aggregated_cells(
        clip["array"],
        clip["transform"],
        int(settings.nightlight_grid_max_cells or 5000),
    )
    cells, legend = _build_layer_cells(raw_cells, str(dataset["unit"]))
    return {
        "scope_id": resolved_scope_id,
        "year": int(dataset["year"]),
        "selected": _selected_descriptor(int(dataset["year"]), str(dataset["unit"])),
        "summary": summary,
        "legend": legend,
        "cells": cells,
    }


def get_nightlight_raster_preview(
    polygon: list,
    coord_type: str = "gcj02",
    scope_id: str | None = None,
    year: int | None = None,
) -> Dict[str, Any]:
    dataset = _resolve_dataset(year)
    geom_wgs84 = _to_wgs84_geometry(polygon, coord_type)
    resolved_scope_id = str(scope_id or _build_scope_id(geom_wgs84, int(dataset["year"])))
    clip = _load_or_compute_clip(resolved_scope_id, int(dataset["year"]), dataset["path"], geom_wgs84)
    if not clip or clip.get("empty"):
        return {
            "scope_id": resolved_scope_id,
            "year": int(dataset["year"]),
            "selected": _selected_descriptor(int(dataset["year"]), str(dataset["unit"])),
            "summary": _default_summary(),
            "image_url": None,
            "bounds_gcj02": [],
            "legend": _build_legend(RADIANCE_VIEW_LABEL, 0.0, 0.0, str(dataset["unit"])),
        }
    image, min_value, max_value = _colorize_nightlight_array(
        clip["array"],
        int(settings.nightlight_preview_max_size or 2048),
    )
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    png_bytes = buffer.getvalue()
    image_url = "data:image/png;base64," + base64.b64encode(png_bytes).decode("ascii")
    summary = _summarize_values(clip["array"])
    return {
        "scope_id": resolved_scope_id,
        "year": int(dataset["year"]),
        "selected": _selected_descriptor(int(dataset["year"]), str(dataset["unit"])),
        "summary": summary,
        "image_url": image_url,
        "bounds_gcj02": _bounds_gcj02_from_transform(
            clip["transform"],
            int(clip["width"]),
            int(clip["height"]),
        ),
        "legend": _build_legend(RADIANCE_VIEW_LABEL, min_value, max_value, str(dataset["unit"])),
    }
