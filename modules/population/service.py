from __future__ import annotations

import base64
import copy
import hashlib
import io
import logging
import threading
from collections import OrderedDict
from pathlib import Path
from typing import Any, Dict, Sequence

import numpy as np
from shapely.geometry import MultiPolygon, Polygon, mapping
from shapely.geometry.base import BaseGeometry
from shapely.ops import transform

from core.config import settings
from modules.providers.amap.utils.transform_posi import gcj02_to_wgs84, wgs84_to_gcj02

from .registry import (
    DEFAULT_AGE_BAND,
    DEFAULT_SEX,
    age_band_keys,
    build_meta_payload,
    build_selected_descriptor,
    get_age_band_label,
    get_sex_label,
    resolve_population_file_paths,
)

logger = logging.getLogger(__name__)

PREVIEW_STYLE_VERSION = "v3"
GRID_STYLE_VERSION = "v6"
PREVIEW_PALETTE = [
    (14, 116, 144),   # teal
    (45, 212, 191),   # aqua
    (250, 204, 21),   # amber
    (249, 115, 22),   # orange
    (190, 24, 93),    # rose
]

DEFAULT_ANALYSIS_AGE_BAND = "25"
DENSITY_UNIT = "人/平方公里"
PERCENT_UNIT = "%"
IN_MEMORY_JSON_CACHE_MAX_ENTRIES = 512
DOMINANT_AGE_COLORS = {
    "00": "#7dd3fc",
    "01": "#60a5fa",
    "05": "#818cf8",
    "10": "#a78bfa",
    "15": "#c084fc",
    "20": "#e879f9",
    "25": "#f472b6",
    "30": "#fb7185",
    "35": "#f43f5e",
    "40": "#ef4444",
    "45": "#f97316",
    "50": "#f59e0b",
    "55": "#eab308",
    "60": "#84cc16",
    "65": "#22c55e",
    "70": "#10b981",
    "75": "#14b8a6",
    "80": "#06b6d4",
    "85": "#0ea5e9",
    "90": "#0284c7",
}

_IN_MEMORY_CACHE_LOCK = threading.Lock()
_IN_MEMORY_JSON_CACHE: "OrderedDict[str, Dict[str, Any]]" = OrderedDict()


def _require_rasterio():
    try:
        import rasterio  # type: ignore
        from rasterio.mask import mask  # type: ignore
        from rasterio.transform import array_bounds  # type: ignore
        return rasterio, mask, array_bounds
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(
            f"population analysis rasterio import failed: {exc.__class__.__name__}: {exc}"
        ) from exc


def _require_pillow():
    try:
        from PIL import Image  # type: ignore
        return Image
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(
            f"population analysis pillow import failed: {exc.__class__.__name__}: {exc}"
        ) from exc


def _project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _resolve_dir(path_value: str) -> Path:
    path = Path(path_value).expanduser()
    if not path.is_absolute():
        path = _project_root() / path
    return path.resolve()


def _cache_path(filename: str) -> Path:
    return _project_root() / "runtime" / "generated_population" / str(filename)


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
    if polygon and isinstance(polygon[0], (list, tuple)) and len(polygon[0]) >= 2 and isinstance(polygon[0][0], (int, float)):
        ring = _normalize_ring(polygon)
        return Polygon(ring) if len(ring) >= 4 else Polygon()

    polygons: list[Polygon] = []
    for item in polygon:
        ring_source = item
        if isinstance(item, list) and item and isinstance(item[0], list) and item[0] and isinstance(item[0][0], (list, tuple)):
            ring_source = item[0]
        ring = _normalize_ring(ring_source)
        if len(ring) < 4:
            continue
        poly = Polygon(ring)
        if poly.is_valid and not poly.is_empty:
            polygons.append(poly)
        else:
            repaired = poly.buffer(0)
            if repaired.is_empty:
                continue
            if isinstance(repaired, Polygon):
                polygons.append(repaired)
            elif isinstance(repaired, MultiPolygon):
                polygons.extend([part for part in repaired.geoms if isinstance(part, Polygon) and not part.is_empty])
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


def _scope_id_for_geometry(geom: BaseGeometry) -> str:
    digest = hashlib.sha1(geom.wkb).hexdigest()
    return digest[:24]


def _overview_cache_path(scope_id: str) -> Path:
    return _cache_path(f"{scope_id}_overview.json")


def _grid_cache_path(scope_id: str) -> Path:
    return _cache_path(f"{scope_id}_grid_{GRID_STYLE_VERSION}.json")


def _raster_cache_json_path(scope_id: str, sex: str, age_band: str) -> Path:
    return _cache_path(f"{scope_id}_{sex}_{age_band}_{PREVIEW_STYLE_VERSION}.json")


def _layer_cache_json_path(scope_id: str, view: str, sex_mode: str, age_mode: str, age_band: str) -> Path:
    safe_view = str(view or "density").strip().lower()
    safe_sex_mode = str(sex_mode or "male").strip().lower()
    safe_age_mode = str(age_mode or "ratio").strip().lower()
    safe_age_band = str(age_band or DEFAULT_ANALYSIS_AGE_BAND).strip().lower()
    return _cache_path(f"{scope_id}_{safe_view}_{safe_sex_mode}_{safe_age_mode}_{safe_age_band}_{GRID_STYLE_VERSION}.json")


def _read_json(path: Path) -> Dict[str, Any] | None:
    key = _cache_key(path)
    with _IN_MEMORY_CACHE_LOCK:
        payload = _IN_MEMORY_JSON_CACHE.get(key)
        if payload is None:
            return None
        _IN_MEMORY_JSON_CACHE.move_to_end(key)
        return copy.deepcopy(payload)


def _write_json(path: Path, payload: Dict[str, Any]) -> None:
    key = _cache_key(path)
    with _IN_MEMORY_CACHE_LOCK:
        _IN_MEMORY_JSON_CACHE[key] = copy.deepcopy(payload)
        _IN_MEMORY_JSON_CACHE.move_to_end(key)
        while len(_IN_MEMORY_JSON_CACHE) > IN_MEMORY_JSON_CACHE_MAX_ENTRIES:
            _IN_MEMORY_JSON_CACHE.popitem(last=False)


def _cache_key(path: Path) -> str:
    return f"{str(path.parent)}::{path.name}"


def _ensure_data_files(paths: Sequence[Path]) -> None:
    missing = [str(path) for path in paths if not path.exists()]
    if missing:
        raise RuntimeError(f"population raster files missing: {', '.join(missing)}")


def _mask_dataset(dataset_path: Path, geom_wgs84: BaseGeometry):
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
        band = np.ma.asarray(masked[0], dtype=np.float64)
        return {
            "array": band,
            "transform": masked_transform,
            "crs": src.crs,
            "shape": band.shape,
        }


def _combine_masked_layers(paths: Sequence[Path], geom_wgs84: BaseGeometry):
    base = None
    for path in paths:
        current = _mask_dataset(path, geom_wgs84)
        if current is None:
            continue
        if base is None:
            base = current
            continue
        if base["shape"] != current["shape"] or base["transform"] != current["transform"]:
            raise RuntimeError("population raster alignment mismatch")
        base["array"] = np.ma.asarray(base["array"], dtype=np.float64) + np.ma.asarray(current["array"], dtype=np.float64)
    return base


def _fallback_age_sum_paths(data_dir: Path, sex: str, age_band: str) -> list[Path]:
    if age_band != "all":
        return []
    if sex == "male":
        return [path for key in age_band_keys() for path in resolve_population_file_paths(data_dir, "male", key)]
    if sex == "female":
        return [path for key in age_band_keys() for path in resolve_population_file_paths(data_dir, "female", key)]
    if sex == "total":
        return (
            [path for key in age_band_keys() for path in resolve_population_file_paths(data_dir, "male", key)]
            + [path for key in age_band_keys() for path in resolve_population_file_paths(data_dir, "female", key)]
        )
    return []


def _combine_population_layers(data_dir: Path, sex: str, age_band: str, geom_wgs84: BaseGeometry):
    primary_paths = resolve_population_file_paths(data_dir, sex, age_band)
    _ensure_data_files(primary_paths)
    try:
        return _combine_masked_layers(primary_paths, geom_wgs84)
    except Exception as exc:
        fallback_paths = _fallback_age_sum_paths(data_dir, sex, age_band)
        if not fallback_paths:
            raise
        logger.warning(
            "population primary all-age rasters failed; fallback to age-band sum",
            extra={
                "sex": sex,
                "age_band": age_band,
                "primary_paths": [str(path) for path in primary_paths],
                "fallback_count": len(fallback_paths),
                "error": f"{exc.__class__.__name__}: {exc}",
            },
        )
        _ensure_data_files(fallback_paths)
        return _combine_masked_layers(fallback_paths, geom_wgs84)


def _masked_stats(masked_array: np.ma.MaskedArray) -> Dict[str, float | int]:
    if masked_array is None:
        return {
            "sum": 0.0,
            "nonzero_pixel_count": 0,
            "max_pixel_value": 0.0,
        }
    valid = np.ma.filled(masked_array, 0.0).astype(np.float64)
    positive = valid[valid > 0]
    return {
        "sum": _round_float(valid.sum(), 3),
        "nonzero_pixel_count": int(np.count_nonzero(valid > 0)),
        "max_pixel_value": _round_float(float(np.max(positive)) if positive.size else 0.0, 3),
    }


def _format_number_label(value: Any) -> str:
    try:
        num = float(value)
    except Exception:
        num = 0.0
    if num >= 100000000:
        return f"{num / 100000000:.2f}亿"
    if num >= 10000:
        return f"{num / 10000:.1f}万"
    if abs(num) >= 100:
        return f"{round(num):.0f}"
    if abs(num) >= 10:
        return f"{num:.1f}"
    return f"{num:.2f}"


def _build_cell_id(row: int, col: int) -> str:
    return f"r{int(row)}_c{int(col)}"


def _cell_bounds_from_transform(masked_transform, row: int, col: int) -> tuple[float, float, float, float]:
    left_top = masked_transform * (col, row)
    right_bottom = masked_transform * (col + 1, row + 1)
    west = min(float(left_top[0]), float(right_bottom[0]))
    east = max(float(left_top[0]), float(right_bottom[0]))
    south = min(float(left_top[1]), float(right_bottom[1]))
    north = max(float(left_top[1]), float(right_bottom[1]))
    return west, south, east, north


def _cell_polygon_gcj02(masked_transform, row: int, col: int) -> list[list[list[float]]]:
    west, south, east, north = _cell_bounds_from_transform(masked_transform, row, col)
    ring_wgs84 = [
        (west, north),
        (east, north),
        (east, south),
        (west, south),
        (west, north),
    ]
    ring_gcj02 = [
        [_round_float(pair[0], 6), _round_float(pair[1], 6)]
        for pair in (wgs84_to_gcj02(lng, lat) for lng, lat in ring_wgs84)
    ]
    return [ring_gcj02]


def _cell_centroid_gcj02(masked_transform, row: int, col: int) -> list[float]:
    center = masked_transform * (col + 0.5, row + 0.5)
    lng, lat = wgs84_to_gcj02(float(center[0]), float(center[1]))
    return [_round_float(lng, 6), _round_float(lat, 6)]


def _iter_population_cells(masked_array: np.ma.MaskedArray, masked_transform):
    values = np.ma.filled(masked_array, 0.0).astype(np.float64)
    mask = np.ma.getmaskarray(masked_array)
    height, width = values.shape
    for row in range(height):
        for col in range(width):
            if bool(mask[row, col]):
                continue
            raw_value = max(0.0, float(values[row, col]))
            yield {
                "cell_id": _build_cell_id(row, col),
                "row": int(row),
                "col": int(col),
                "raw_value": _round_float(raw_value, 6),
                "centroid_gcj02": _cell_centroid_gcj02(masked_transform, row, col),
                "geometry_gcj02": _cell_polygon_gcj02(masked_transform, row, col),
            }


def _color_to_hex(color: tuple[int, int, int]) -> str:
    return f"#{int(color[0]):02x}{int(color[1]):02x}{int(color[2]):02x}"


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


def _colorize_population_array(masked_array: np.ma.MaskedArray, max_size: int):
    Image = _require_pillow()

    valid = np.ma.filled(masked_array, 0.0).astype(np.float64)
    positive = valid[valid > 0]
    height, width = valid.shape
    if height <= 0 or width <= 0:
        raise RuntimeError("empty raster preview")

    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    if positive.size:
        min_value = float(np.percentile(positive, 8))
        max_value = float(np.percentile(positive, 98.5))
        if max_value <= min_value:
            min_value = float(np.min(positive))
            max_value = float(np.max(positive))
        log_valid = np.log1p(np.maximum(valid, 0.0))
        log_min = np.log1p(max(min_value, 0.0))
        log_max = np.log1p(max(max_value, min_value + 1e-9))
        span = max(log_max - log_min, 1e-9)
        normalized = np.clip((log_valid - log_min) / span, 0.0, 1.0)
        normalized = np.where(valid > 0, normalized, 0.0)
        scaled = normalized * (len(PREVIEW_PALETTE) - 1)
        left_idx = np.floor(scaled).astype(np.int64)
        left_idx = np.clip(left_idx, 0, len(PREVIEW_PALETTE) - 1)
        right_idx = np.clip(left_idx + 1, 0, len(PREVIEW_PALETTE) - 1)
        local_ratio = (scaled - left_idx).astype(np.float64)
        palette = np.asarray(PREVIEW_PALETTE, dtype=np.float64)
        left_colors = palette[left_idx]
        right_colors = palette[right_idx]
        rgb = left_colors + ((right_colors - left_colors) * local_ratio[..., None])
        rgba[..., 0] = np.where(valid > 0, rgb[..., 0], 0).astype(np.uint8)
        rgba[..., 1] = np.where(valid > 0, rgb[..., 1], 0).astype(np.uint8)
        rgba[..., 2] = np.where(valid > 0, rgb[..., 2], 0).astype(np.uint8)

        alpha = np.where(
            normalized > 0.025,
            12 + (188 * np.power(normalized, 0.92)),
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


def _build_legend(title: str, min_value: float, max_value: float, unit: str = "人口") -> Dict[str, Any]:
    stops = []
    for idx, ratio in enumerate((0.0, 0.25, 0.5, 0.75, 1.0)):
        value = min_value + (max_value - min_value) * ratio
        color = _palette_color(ratio)
        stops.append(
            {
                "ratio": ratio,
                "color": f"#{color[0]:02x}{color[1]:02x}{color[2]:02x}",
                "value": _round_float(value, 3),
            }
        )
    return {
        "title": title,
        "kind": "continuous",
        "unit": unit,
        "min_value": _round_float(min_value, 3),
        "max_value": _round_float(max_value, 3),
        "stops": stops,
    }


def _build_categorical_legend(title: str, items: list[dict[str, Any]], unit: str = "") -> Dict[str, Any]:
    stops = []
    total = max(len(items) - 1, 1)
    for idx, item in enumerate(items):
        stops.append(
            {
                "ratio": _round_float(idx / total, 3),
                "color": str(item.get("color") or "#d1d5db"),
                "value": float(item.get("value") or 0.0),
                "label": str(item.get("label") or ""),
            }
        )
    return {
        "title": title,
        "kind": "categorical",
        "unit": unit,
        "min_value": 0.0,
        "max_value": float(len(items)),
        "stops": stops,
    }


def _filled_values(masked_array: np.ma.MaskedArray) -> tuple[np.ndarray, np.ndarray]:
    values = np.ma.filled(masked_array, 0.0).astype(np.float64)
    mask = np.ma.getmaskarray(masked_array)
    return values, mask


def _ensure_layer_alignment(base_layer: Dict[str, Any], other_layer: Dict[str, Any]) -> None:
    if (
        base_layer.get("shape") != other_layer.get("shape")
        or base_layer.get("transform") != other_layer.get("transform")
    ):
        raise RuntimeError("population raster alignment mismatch")


def _build_age_ratio_cells(
    total_layer: Dict[str, Any],
    age_layer: Dict[str, Any],
) -> tuple[list[dict[str, Any]], float]:
    _ensure_layer_alignment(total_layer, age_layer)
    total_values, total_mask = _filled_values(total_layer["array"])
    age_values, age_mask = _filled_values(age_layer["array"])
    height, width = total_values.shape
    cells: list[dict[str, Any]] = []
    age_sum = 0.0
    for row in range(height):
        for col in range(width):
            if bool(total_mask[row, col]):
                continue
            total_value = max(0.0, float(total_values[row, col]))
            age_value = 0.0 if bool(age_mask[row, col]) else max(0.0, float(age_values[row, col]))
            ratio_value = (age_value / total_value) if total_value > 0 else 0.0
            age_sum += age_value
            cells.append(
                {
                    "cell_id": _build_cell_id(row, col),
                    "row": int(row),
                    "col": int(col),
                    "raw_value": _round_float(age_value, 6),
                    "ratio_value": _round_float(ratio_value, 6),
                    "display_value": _round_float(ratio_value * 100.0, 6),
                    "centroid_gcj02": _cell_centroid_gcj02(total_layer["transform"], row, col),
                    "geometry_gcj02": _cell_polygon_gcj02(total_layer["transform"], row, col),
                }
            )
    return cells, age_sum


def _build_dominant_age_cells(
    total_layer: Dict[str, Any],
    age_layers: Dict[str, Dict[str, Any]],
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    total_values, total_mask = _filled_values(total_layer["array"])
    prepared_layers: Dict[str, tuple[np.ndarray, np.ndarray]] = {}
    for age_band, layer in age_layers.items():
        _ensure_layer_alignment(total_layer, layer)
        prepared_layers[age_band] = _filled_values(layer["array"])
    height, width = total_values.shape
    cells: list[dict[str, Any]] = []
    dominant_counts = {age_band: 0 for age_band in age_band_keys()}
    for row in range(height):
        for col in range(width):
            if bool(total_mask[row, col]):
                continue
            total_value = max(0.0, float(total_values[row, col]))
            dominant_age_band = None
            dominant_age_value = 0.0
            for age_band in age_band_keys():
                values, mask = prepared_layers[age_band]
                age_value = 0.0 if bool(mask[row, col]) else max(0.0, float(values[row, col]))
                if dominant_age_band is None or age_value > dominant_age_value:
                    dominant_age_band = age_band
                    dominant_age_value = age_value
            dominant_ratio = (dominant_age_value / total_value) if total_value > 0 else 0.0
            if dominant_age_band:
                dominant_counts[dominant_age_band] += 1
            cells.append(
                {
                    "cell_id": _build_cell_id(row, col),
                    "row": int(row),
                    "col": int(col),
                    "raw_value": _round_float(dominant_age_value, 6),
                    "dominant_age_band": dominant_age_band,
                    "dominant_age_band_label": get_age_band_label(dominant_age_band or "all"),
                    "ratio_value": _round_float(dominant_ratio, 6),
                    "display_value": _round_float(dominant_ratio * 100.0, 6),
                    "centroid_gcj02": _cell_centroid_gcj02(total_layer["transform"], row, col),
                    "geometry_gcj02": _cell_polygon_gcj02(total_layer["transform"], row, col),
                }
            )
    return cells, dominant_counts


def _compute_population_overview(scope_id: str, geom_wgs84: BaseGeometry) -> Dict[str, Any]:
    data_dir = _resolve_dir(settings.population_data_dir)
    if not data_dir.exists():
        raise RuntimeError(f"population data directory not found: {data_dir}")

    male_total_data = _combine_population_layers(data_dir, "male", "all", geom_wgs84)
    female_total_data = _combine_population_layers(data_dir, "female", "all", geom_wgs84)

    male_total = _masked_stats(male_total_data["array"] if male_total_data else None)["sum"]
    female_total = _masked_stats(female_total_data["array"] if female_total_data else None)["sum"]
    total_population = _round_float(float(male_total) + float(female_total), 3)
    male_ratio = _round_float(float(male_total) / total_population, 6) if total_population > 0 else 0.0
    female_ratio = _round_float(float(female_total) / total_population, 6) if total_population > 0 else 0.0

    age_distribution: list[dict[str, Any]] = []
    for age_band in age_band_keys():
        male_paths = resolve_population_file_paths(data_dir, "male", age_band)
        female_paths = resolve_population_file_paths(data_dir, "female", age_band)
        _ensure_data_files([*male_paths, *female_paths])
        male_data = _combine_masked_layers(male_paths, geom_wgs84)
        female_data = _combine_masked_layers(female_paths, geom_wgs84)
        male_sum = _masked_stats(male_data["array"] if male_data else None)["sum"]
        female_sum = _masked_stats(female_data["array"] if female_data else None)["sum"]
        total_sum = _round_float(float(male_sum) + float(female_sum), 3)
        age_distribution.append(
            {
                "age_band": age_band,
                "age_band_label": get_age_band_label(age_band),
                "total": total_sum,
                "male": _round_float(male_sum, 3),
                "female": _round_float(female_sum, 3),
            }
        )

    payload = {
        "scope_id": scope_id,
        "summary": {
            "total_population": total_population,
            "male_total": _round_float(male_total, 3),
            "female_total": _round_float(female_total, 3),
            "male_ratio": male_ratio,
            "female_ratio": female_ratio,
        },
        "sex_totals": {
            "total": total_population,
            "male": _round_float(male_total, 3),
            "female": _round_float(female_total, 3),
        },
        "age_distribution": age_distribution,
    }
    _write_json(_overview_cache_path(scope_id), payload)
    return payload


def _load_or_compute_population_overview(scope_id: str, geom_wgs84: BaseGeometry) -> Dict[str, Any]:
    cached = _read_json(_overview_cache_path(scope_id))
    if cached:
        return cached
    return _compute_population_overview(scope_id, geom_wgs84)


def _compute_population_grid(scope_id: str, geom_wgs84: BaseGeometry) -> Dict[str, Any]:
    data_dir = _resolve_dir(settings.population_data_dir)
    if not data_dir.exists():
        raise RuntimeError(f"population data directory not found: {data_dir}")

    base_data = _combine_population_layers(data_dir, "male", "all", geom_wgs84)
    if base_data is None:
        payload = {
            "scope_id": scope_id,
            "cell_count": 0,
            "features": [],
        }
        _write_json(_grid_cache_path(scope_id), payload)
        return payload

    features: list[dict[str, Any]] = []
    for cell in _iter_population_cells(base_data["array"], base_data["transform"]):
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": cell["geometry_gcj02"],
                },
                "properties": {
                    "cell_id": cell["cell_id"],
                    "h3_id": cell["cell_id"],
                    "row": cell["row"],
                    "col": cell["col"],
                    "centroid_gcj02": cell["centroid_gcj02"],
                },
            }
        )

    payload = {
        "scope_id": scope_id,
        "cell_count": len(features),
        "features": features,
    }
    _write_json(_grid_cache_path(scope_id), payload)
    return payload


def _load_or_compute_population_grid(scope_id: str, geom_wgs84: BaseGeometry) -> Dict[str, Any]:
    cached = _read_json(_grid_cache_path(scope_id))
    if cached:
        return cached
    return _compute_population_grid(scope_id, geom_wgs84)


def _resolve_population_layer_source(view: str, sex_mode: str, age_mode: str, age_band: str) -> Dict[str, str]:
    safe_view = str(view or "density").strip().lower()
    safe_sex_mode = str(sex_mode or "male").strip().lower()
    safe_age_mode = str(age_mode or "ratio").strip().lower()
    safe_age_band = str(age_band or DEFAULT_ANALYSIS_AGE_BAND).strip().lower()

    if safe_view == "sex":
        return {
            "view": "sex",
            "sex": safe_sex_mode if safe_sex_mode in {"male", "female"} else "male",
            "age_band": "all",
            "view_label": f"{get_sex_label(safe_sex_mode if safe_sex_mode in {'male', 'female'} else 'male')}密度",
            "unit": DENSITY_UNIT,
        }
    if safe_view == "age":
        target_age_band = safe_age_band if safe_age_band in set(age_band_keys()) else DEFAULT_ANALYSIS_AGE_BAND
        resolved_age_mode = safe_age_mode if safe_age_mode in {"ratio", "dominant"} else "ratio"
        return {
            "view": "age",
            "sex": "total",
            "age_band": target_age_band,
            "age_mode": resolved_age_mode,
            "view_label": "主导年龄图" if resolved_age_mode == "dominant" else f"{get_age_band_label(target_age_band)}占比",
            "unit": PERCENT_UNIT,
        }
    if safe_view == "overview":
        return {
            "view": "overview",
            "sex": "total",
            "age_band": "all",
            "view_label": "总人口",
            "unit": "人口",
        }
    return {
        "view": "density",
        "sex": "total",
        "age_band": "all",
        "age_mode": "ratio",
        "view_label": "人口密度",
        "unit": DENSITY_UNIT,
    }


def _build_population_layer_selected(view_config: Dict[str, str], sex_mode: str, age_mode: str, age_band: str) -> Dict[str, Any]:
    safe_view = str(view_config.get("view") or "density")
    safe_sex_mode = str(sex_mode or "male")
    safe_age_mode = str(age_mode or "ratio")
    safe_age_band = str(age_band or DEFAULT_ANALYSIS_AGE_BAND)
    return {
        "view": safe_view,
        "view_label": str(view_config.get("view_label") or ""),
        "sex_mode": safe_sex_mode if safe_view == "sex" else None,
        "sex_mode_label": get_sex_label(safe_sex_mode) if safe_view == "sex" else None,
        "age_mode": safe_age_mode if safe_view == "age" else None,
        "age_mode_label": "主导年龄图" if (safe_view == "age" and safe_age_mode == "dominant") else ("年龄占比图" if safe_view == "age" else None),
        "age_band": safe_age_band if safe_view == "age" else "all",
        "age_band_label": get_age_band_label(safe_age_band) if safe_view == "age" else get_age_band_label("all"),
        "unit": str(view_config.get("unit") or "人口"),
    }


def _build_population_layer_cell_styles(
    cells: list[dict[str, Any]],
    value_key: str,
    unit: str,
    value_label: str,
) -> tuple[list[dict[str, Any]], float, float]:
    positive_values = [float(cell.get(value_key) or 0.0) for cell in cells if float(cell.get(value_key) or 0.0) > 0]
    if positive_values:
        min_value = float(np.percentile(np.asarray(positive_values, dtype=np.float64), 8))
        max_value = float(np.percentile(np.asarray(positive_values, dtype=np.float64), 98.5))
        if max_value <= min_value:
            min_value = float(min(positive_values))
            max_value = float(max(positive_values))
    else:
        min_value = 0.0
        max_value = 0.0

    span = max(max_value - min_value, 1e-9)
    styled_cells: list[dict[str, Any]] = []
    for cell in cells:
        value = max(0.0, float(cell.get(value_key) or 0.0))
        if value > 0 and max_value > 0:
            ratio = np.clip((value - min_value) / span, 0.0, 1.0)
            fill_color = _color_to_hex(_palette_color(float(ratio)))
            fill_opacity = 0.28 + (0.52 * float(np.power(ratio, 0.72)))
            stroke_color = "#ffffff"
        else:
            fill_color = "#f4f5f7"
            fill_opacity = 0.12
            stroke_color = "#d7dde7"
        styled_cells.append(
            {
                "cell_id": cell["cell_id"],
                "value": _round_float(value, 3),
                "fill_color": fill_color,
                "stroke_color": stroke_color,
                "fill_opacity": _round_float(fill_opacity, 3),
                "label": f"{value_label} {_format_number_label(value)} {unit}",
            }
        )
    return styled_cells, min_value, max_value


def _build_discrete_ratio_cell_styles(
    cells: list[dict[str, Any]],
    value_key: str,
    value_label: str,
    max_buckets: int = 12,
) -> tuple[list[dict[str, Any]], Dict[str, Any], int] | None:
    rounded_values = sorted(
        {
            _round_float(max(0.0, float(cell.get(value_key) or 0.0)), 3)
            for cell in cells
            if float(cell.get(value_key) or 0.0) > 0
        }
    )
    if not rounded_values or len(rounded_values) > max_buckets:
        return None

    total = max(len(rounded_values) - 1, 1)
    value_to_index = {value: idx for idx, value in enumerate(rounded_values)}
    styled_cells: list[dict[str, Any]] = []
    for cell in cells:
        value = max(0.0, float(cell.get(value_key) or 0.0))
        if value > 0:
            rounded = _round_float(value, 3)
            idx = value_to_index.get(rounded, 0)
            ratio = idx / total
            fill_color = _color_to_hex(_palette_color(float(ratio)))
            fill_opacity = 0.34 + (0.46 * float(np.power(ratio, 0.72)))
            stroke_color = "#ffffff"
        else:
            fill_color = "#f4f5f7"
            fill_opacity = 0.12
            stroke_color = "#d7dde7"
        styled_cells.append(
            {
                "cell_id": cell["cell_id"],
                "value": _round_float(value, 3),
                "fill_color": fill_color,
                "stroke_color": stroke_color,
                "fill_opacity": _round_float(fill_opacity, 3),
                "label": f"{value_label} {_round_float(value, 3)}%",
            }
        )

    legend_items = []
    for idx, value in enumerate(rounded_values):
        ratio = idx / total
        color = _color_to_hex(_palette_color(float(ratio)))
        legend_items.append(
            {
                "label": f"{_round_float(value, 3)}%",
                "color": color,
                "value": _round_float(value, 3),
            }
        )
    legend = _build_categorical_legend(value_label, legend_items, PERCENT_UNIT)
    return styled_cells, legend, len(rounded_values)


def _build_dominant_age_cell_styles(
    cells: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], Dict[str, int]]:
    styled_cells: list[dict[str, Any]] = []
    category_counts = {age_band: 0 for age_band in age_band_keys()}
    for cell in cells:
        age_band = str(cell.get("dominant_age_band") or "")
        ratio_percent = max(0.0, float(cell.get("display_value") or 0.0))
        if age_band in category_counts:
            category_counts[age_band] += 1
        fill_color = DOMINANT_AGE_COLORS.get(age_band, "#d1d5db")
        fill_opacity = 0.26 + (0.54 * float(np.power(np.clip(ratio_percent / 100.0, 0.0, 1.0), 0.72)))
        styled_cells.append(
            {
                "cell_id": cell["cell_id"],
                "value": _round_float(ratio_percent, 3),
                "fill_color": fill_color,
                "stroke_color": "#ffffff",
                "fill_opacity": _round_float(fill_opacity, 3),
                "label": f"主导年龄 {get_age_band_label(age_band)}，占比 {_round_float(ratio_percent, 2)}%",
            }
        )
    return styled_cells, category_counts


def _build_population_layer_summary(
    view: str,
    selected: Dict[str, Any],
    overview: Dict[str, Any],
    cells: list[dict[str, Any]],
    display_values: list[float],
    raw_sum: float,
    age_band: str,
) -> Dict[str, Any]:
    overview_summary = overview.get("summary") or {}
    total_population = float(overview_summary.get("total_population") or 0.0)
    nonzero_cell_count = int(sum(1 for value in display_values if value > 0))
    cell_count = len(cells)
    peak_value = float(max(display_values)) if display_values else 0.0
    average_value = float(sum(display_values) / cell_count) if cell_count else 0.0

    if view == "sex":
        selected_population = raw_sum
        return {
            "male_total": _round_float(float(overview_summary.get("male_total") or 0.0), 3),
            "female_total": _round_float(float(overview_summary.get("female_total") or 0.0), 3),
            "male_ratio": _round_float(float(overview_summary.get("male_ratio") or 0.0), 6),
            "female_ratio": _round_float(float(overview_summary.get("female_ratio") or 0.0), 6),
            "selected_population": _round_float(selected_population, 3),
            "ratio_of_total_population": _round_float((selected_population / total_population), 6) if total_population > 0 else 0.0,
            "peak_density_per_km2": _round_float(peak_value, 3),
            "average_density_per_km2": _round_float(average_value, 3),
            "nonzero_cell_count": nonzero_cell_count,
            "sex_mode": selected.get("sex_mode"),
            "sex_mode_label": selected.get("sex_mode_label"),
        }
    if view == "age":
        age_mode = str(selected.get("age_mode") or "ratio")
        if age_mode == "dominant":
            dominant_counter: Dict[str, int] = {}
            for cell in cells:
                key = str(cell.get("dominant_age_band") or "")
                if not key:
                    continue
                dominant_counter[key] = int(dominant_counter.get(key) or 0) + 1
            top_age_band = max(dominant_counter, key=dominant_counter.get, default="")
            dominant_cell_count = int(dominant_counter.get(top_age_band) or 0)
            dominant_cell_ratio = (float(dominant_cell_count) / float(cell_count)) if cell_count > 0 else 0.0
            return {
                "top_dominant_age_band": top_age_band or None,
                "top_dominant_age_band_label": get_age_band_label(top_age_band) if top_age_band else None,
                "dominant_cell_count": dominant_cell_count,
                "dominant_cell_ratio": _round_float(dominant_cell_ratio, 6),
                "average_dominant_ratio_percent": _round_float(average_value, 3),
                "peak_dominant_ratio_percent": _round_float(peak_value, 3),
                "nonzero_cell_count": nonzero_cell_count,
                "age_mode": age_mode,
            }
        return {
            "selected_population": _round_float(raw_sum, 3),
            "ratio_of_total_population": _round_float((raw_sum / total_population), 6) if total_population > 0 else 0.0,
            "peak_ratio_percent": _round_float(peak_value, 3),
            "nonzero_cell_count": nonzero_cell_count,
            "value_bucket_count": len(
                {
                    _round_float(max(0.0, float(cell.get("display_value") or 0.0)), 6)
                    for cell in cells
                    if float(cell.get("display_value") or 0.0) > 0
                }
            ),
            "age_band": age_band,
            "age_band_label": get_age_band_label(age_band),
            "age_mode": age_mode,
        }
    if view == "overview":
        age_rows = overview.get("age_distribution") or []
        dominant_age_row = max(age_rows, key=lambda item: float(item.get("total") or 0.0), default=None)
        return {
            "total_population": _round_float(total_population, 3),
            "male_total": _round_float(float(overview_summary.get("male_total") or 0.0), 3),
            "female_total": _round_float(float(overview_summary.get("female_total") or 0.0), 3),
            "male_ratio": _round_float(float(overview_summary.get("male_ratio") or 0.0), 6),
            "female_ratio": _round_float(float(overview_summary.get("female_ratio") or 0.0), 6),
            "selected_population": _round_float(total_population, 3),
            "ratio_of_total_population": 1.0 if total_population > 0 else 0.0,
            "peak_density_per_km2": _round_float(peak_value, 3),
            "nonzero_cell_count": nonzero_cell_count,
            "dominant_age_band": dominant_age_row.get("age_band") if dominant_age_row else None,
            "dominant_age_band_label": dominant_age_row.get("age_band_label") if dominant_age_row else None,
            "dominant_age_population": _round_float(float((dominant_age_row or {}).get("total") or 0.0), 3),
        }
    return {
        "total_population": _round_float(total_population, 3),
        "selected_population": _round_float(total_population, 3),
        "ratio_of_total_population": 1.0 if total_population > 0 else 0.0,
        "average_density_per_km2": _round_float(average_value, 3),
        "peak_density_per_km2": _round_float(peak_value, 3),
        "nonzero_cell_count": nonzero_cell_count,
        "cell_count": cell_count,
    }


def build_population_meta_payload() -> Dict[str, Any]:
    return build_meta_payload()


def get_population_overview(polygon: list, coord_type: str = "gcj02") -> Dict[str, Any]:
    geom_wgs84 = _to_wgs84_geometry(polygon, coord_type)
    scope_id = _scope_id_for_geometry(geom_wgs84)
    return _load_or_compute_population_overview(scope_id, geom_wgs84)


def get_population_grid(polygon: list, coord_type: str = "gcj02") -> Dict[str, Any]:
    geom_wgs84 = _to_wgs84_geometry(polygon, coord_type)
    scope_id = _scope_id_for_geometry(geom_wgs84)
    return _load_or_compute_population_grid(scope_id, geom_wgs84)


def get_population_layer(
    polygon: list,
    coord_type: str = "gcj02",
    scope_id: str | None = None,
    view: str = "density",
    sex_mode: str = "male",
    age_mode: str = "ratio",
    age_band: str = DEFAULT_ANALYSIS_AGE_BAND,
) -> Dict[str, Any]:
    geom_wgs84 = _to_wgs84_geometry(polygon, coord_type)
    resolved_scope_id = scope_id or _scope_id_for_geometry(geom_wgs84)
    overview = _load_or_compute_population_overview(resolved_scope_id, geom_wgs84)
    _load_or_compute_population_grid(resolved_scope_id, geom_wgs84)

    view_config = _resolve_population_layer_source(view, sex_mode, age_mode, age_band)
    selected = _build_population_layer_selected(view_config, sex_mode, age_mode, age_band)

    cache_path = _layer_cache_json_path(
        resolved_scope_id,
        str(view_config.get("view") or "density"),
        str(selected.get("sex_mode") or "male"),
        str(selected.get("age_mode") or "ratio"),
        str(selected.get("age_band") or DEFAULT_ANALYSIS_AGE_BAND),
    )
    cached = _read_json(cache_path)
    if cached:
        cached["scope_id"] = resolved_scope_id
        cached["selected"] = selected
        return cached

    data_dir = _resolve_dir(settings.population_data_dir)
    if not data_dir.exists():
        raise RuntimeError(f"population data directory not found: {data_dir}")

    combined = None
    legend = None
    raw_cells: list[dict[str, Any]] = []
    display_values: list[float] = []
    raw_sum = 0.0

    if str(view_config.get("view")) == "age" and str(view_config.get("age_mode")) == "ratio":
        total_layer = _combine_population_layers(data_dir, "total", "all", geom_wgs84)
        age_layer = _combine_population_layers(data_dir, "total", str(view_config["age_band"]), geom_wgs84)
        if total_layer is not None and age_layer is not None:
            raw_cells, raw_sum = _build_age_ratio_cells(total_layer, age_layer)
            display_values = [float(cell["display_value"]) for cell in raw_cells]
            discrete = _build_discrete_ratio_cell_styles(
                raw_cells,
                "display_value",
                str(view_config["view_label"]),
            )
            if discrete is not None:
                styled_cells, legend, _ = discrete
            else:
                styled_cells, min_value, max_value = _build_population_layer_cell_styles(
                    raw_cells,
                    "display_value",
                    PERCENT_UNIT,
                    str(view_config["view_label"]),
                )
                legend = _build_legend(
                    str(view_config["view_label"]),
                    min_value,
                    max_value,
                    PERCENT_UNIT,
                )
        else:
            combined = None
    elif str(view_config.get("view")) == "age" and str(view_config.get("age_mode")) == "dominant":
        total_layer = _combine_population_layers(data_dir, "total", "all", geom_wgs84)
        age_layers = {
            age_key: _combine_population_layers(data_dir, "total", age_key, geom_wgs84)
            for age_key in age_band_keys()
        }
        if total_layer is not None and all(layer is not None for layer in age_layers.values()):
            raw_cells, dominant_counts = _build_dominant_age_cells(total_layer, age_layers)
            display_values = [float(cell["display_value"]) for cell in raw_cells]
            styled_cells, category_counts = _build_dominant_age_cell_styles(raw_cells)
            legend_items = [
                {
                    "label": get_age_band_label(age_key),
                    "color": DOMINANT_AGE_COLORS.get(age_key, "#d1d5db"),
                    "value": float(category_counts.get(age_key) or 0),
                }
                for age_key in age_band_keys()
                if int(category_counts.get(age_key) or 0) > 0
            ]
            legend = _build_categorical_legend("主导年龄图", legend_items, "主导格子数")
        else:
            combined = None
    else:
        combined = _combine_population_layers(
            data_dir,
            str(view_config["sex"]),
            str(view_config["age_band"]),
            geom_wgs84,
        )

    if combined is None and not raw_cells:
        payload = {
            "scope_id": resolved_scope_id,
            "selected": selected,
            "summary": {},
            "legend": _build_legend(str(view_config["view_label"]), 0.0, 0.0, str(view_config["unit"])),
            "cells": [],
        }
        _write_json(cache_path, payload)
        return payload

    if combined is not None:
        raw_cells = list(_iter_population_cells(combined["array"], combined["transform"]))
        display_values = []
        for cell in raw_cells:
            raw_value = float(cell["raw_value"])
            display_value = raw_value * 100.0 if view_config["unit"] == DENSITY_UNIT else raw_value
            cell["display_value"] = _round_float(display_value, 6)
            display_values.append(display_value)

        styled_cells, min_value, max_value = _build_population_layer_cell_styles(
            raw_cells,
            "display_value",
            str(view_config["unit"]),
            str(view_config["view_label"]),
        )
        raw_sum = float(sum(float(cell["raw_value"]) for cell in raw_cells))
        legend = _build_legend(
            str(view_config["view_label"]),
            min_value,
            max_value,
            str(view_config["unit"]),
        )

    summary = _build_population_layer_summary(
        str(view_config["view"]),
        selected,
        overview,
        raw_cells,
        display_values,
        raw_sum,
        str(view_config["age_band"]),
    )
    if (
        str(view_config.get("view")) == "age"
        and str(view_config.get("age_mode")) == "ratio"
        and isinstance(legend, dict)
        and str(legend.get("kind") or "") == "categorical"
    ):
        summary["value_bucket_count"] = len((legend.get("stops") or []))

    payload = {
        "scope_id": resolved_scope_id,
        "selected": selected,
        "summary": summary,
        "legend": legend,
        "cells": styled_cells,
    }
    _write_json(cache_path, payload)
    return payload


def get_population_raster_preview(
    polygon: list,
    coord_type: str = "gcj02",
    sex: str = DEFAULT_SEX,
    age_band: str = DEFAULT_AGE_BAND,
    scope_id: str | None = None,
) -> Dict[str, Any]:
    geom_wgs84 = _to_wgs84_geometry(polygon, coord_type)
    resolved_scope_id = scope_id or _scope_id_for_geometry(geom_wgs84)
    overview = _load_or_compute_population_overview(resolved_scope_id, geom_wgs84)
    selected = build_selected_descriptor(sex, age_band)

    cache_json_path = _raster_cache_json_path(resolved_scope_id, sex, age_band)
    cached = _read_json(cache_json_path)
    if cached:
        cached["scope_id"] = resolved_scope_id
        cached["selected"] = selected
        return cached

    data_dir = _resolve_dir(settings.population_data_dir)
    if not data_dir.exists():
        raise RuntimeError(f"population data directory not found: {data_dir}")
    combined = _combine_population_layers(data_dir, sex, age_band, geom_wgs84)
    if combined is None:
        payload = {
            "scope_id": resolved_scope_id,
            "selected": selected,
            "summary": {
                "selected_population": 0.0,
                "selected_ratio_of_total": 0.0,
                "nonzero_pixel_count": 0,
                "max_pixel_value": 0.0,
            },
            "image_url": None,
            "bounds_gcj02": [],
            "legend": _build_legend(f"{selected['sex_label']} {selected['age_band_label']}", 0.0, 0.0),
        }
        _write_json(cache_json_path, payload)
        return payload

    masked_array = combined["array"]
    stats = _masked_stats(masked_array)
    total_population = float(((overview.get("summary") or {}).get("total_population") or 0.0))
    image, min_value, max_value = _colorize_population_array(masked_array, int(settings.population_preview_max_size or 2048))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    png_base64 = base64.b64encode(buffer.getvalue()).decode("ascii")
    image_url = f"data:image/png;base64,{png_base64}"

    height, width = masked_array.shape
    bounds_gcj02 = _bounds_gcj02_from_transform(combined["transform"], width, height)
    payload = {
        "scope_id": resolved_scope_id,
        "selected": selected,
        "summary": {
            "selected_population": _round_float(stats["sum"], 3),
            "selected_ratio_of_total": _round_float((float(stats["sum"]) / total_population), 6) if total_population > 0 else 0.0,
            "nonzero_pixel_count": int(stats["nonzero_pixel_count"]),
            "max_pixel_value": _round_float(stats["max_pixel_value"], 3),
        },
        "image_url": image_url,
        "bounds_gcj02": bounds_gcj02,
        "legend": _build_legend(f"{selected['sex_label']} {selected['age_band_label']}", min_value, max_value),
    }
    _write_json(cache_json_path, payload)
    return payload
