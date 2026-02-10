import math
from typing import Any, Dict, List, Literal, Optional, Tuple

import h3

from modules.gaode_service.utils.transform_posi import gcj02_to_wgs84

from .core import build_h3_grid_feature_collection

CategoryKey = Literal["dining", "shopping", "life", "transport", "scenic", "education", "medical"]

CATEGORY_RULES: List[Tuple[CategoryKey, str, str]] = [
    ("dining", "餐饮", "05"),
    ("shopping", "购物", "06"),
    ("life", "生活", "07"),
    ("transport", "交通", "15"),
    ("scenic", "风景", "11"),
    ("education", "科教", "14"),
    ("medical", "医疗", "09"),
]


def _empty_category_counts() -> Dict[CategoryKey, int]:
    return {item[0]: 0 for item in CATEGORY_RULES}


def _safe_round(value: Optional[float], ndigits: int = 6) -> Optional[float]:
    if value is None:
        return None
    try:
        if not math.isfinite(value):
            return None
        return round(float(value), ndigits)
    except Exception:
        return None


def _infer_category_key(type_text: Optional[str]) -> Optional[CategoryKey]:
    if not type_text:
        return None
    digits = "".join(ch for ch in str(type_text) if ch.isdigit())
    if len(digits) < 2:
        return None
    prefix2 = digits[:2]
    for key, _label, category_prefix in CATEGORY_RULES:
        if prefix2 == category_prefix:
            return key
    return None


def _latlng_to_cell(lat: float, lng: float, resolution: int) -> Optional[str]:
    try:
        if hasattr(h3, "latlng_to_cell"):
            return h3.latlng_to_cell(lat, lng, resolution)
        if hasattr(h3, "geo_to_h3"):
            return h3.geo_to_h3(lat, lng, resolution)
    except Exception:
        return None
    return None


def _cell_area_km2(cell_id: str, resolution: int) -> float:
    try:
        if hasattr(h3, "cell_area"):
            return float(h3.cell_area(cell_id, unit="km^2"))
        if hasattr(h3, "hex_area"):
            return float(h3.hex_area(resolution, unit="km^2"))
    except Exception:
        return 0.0
    return 0.0


def _neighbors(cell_id: str, ring_size: int) -> List[str]:
    try:
        if hasattr(h3, "grid_disk"):
            return list(h3.grid_disk(cell_id, ring_size))
        if hasattr(h3, "k_ring"):
            return list(h3.k_ring(cell_id, ring_size))
    except Exception:
        return []
    return []


def _shannon_entropy(category_counts: Dict[CategoryKey, int]) -> float:
    total = sum(category_counts.values())
    if total <= 0:
        return 0.0
    entropy = 0.0
    for count in category_counts.values():
        if count <= 0:
            continue
        p = count / total
        entropy -= p * math.log(p)
    return entropy


def aggregate_pois_to_h3(
    grid_ids: List[str],
    pois: List[Dict[str, Any]],
    resolution: int,
    poi_coord_type: Literal["gcj02", "wgs84"] = "gcj02",
) -> Tuple[Dict[str, Dict[str, Any]], int, Dict[CategoryKey, int]]:
    grid_set = set(grid_ids)
    global_category_counts = _empty_category_counts()
    stats_by_cell: Dict[str, Dict[str, Any]] = {
        cid: {
            "poi_count": 0,
            "category_counts": _empty_category_counts(),
            "density_poi_per_km2": 0.0,
            "local_entropy": 0.0,
            "neighbor_mean_density": 0.0,
            "neighbor_mean_entropy": 0.0,
            "neighbor_count": 0,
        }
        for cid in grid_ids
    }
    assigned_poi_count = 0

    for poi in pois or []:
        location = poi.get("location")
        if not isinstance(location, (list, tuple)) or len(location) < 2:
            continue
        try:
            lng = float(location[0])
            lat = float(location[1])
        except (TypeError, ValueError):
            continue

        if poi_coord_type == "gcj02":
            lng, lat = gcj02_to_wgs84(lng, lat)
        cell_id = _latlng_to_cell(lat, lng, resolution)
        if not cell_id or cell_id not in grid_set:
            continue

        assigned_poi_count += 1
        bucket = stats_by_cell[cell_id]
        bucket["poi_count"] += 1
        category_key = _infer_category_key(poi.get("type"))
        if category_key:
            bucket["category_counts"][category_key] += 1
            global_category_counts[category_key] += 1

    return stats_by_cell, assigned_poi_count, global_category_counts


def compute_cell_metrics(
    stats_by_cell: Dict[str, Dict[str, Any]],
    resolution: int,
) -> None:
    for cell_id, stats in stats_by_cell.items():
        area_km2 = _cell_area_km2(cell_id, resolution)
        poi_count = stats["poi_count"]
        density = (poi_count / area_km2) if area_km2 > 0 else 0.0
        entropy = _shannon_entropy(stats["category_counts"])
        stats["density_poi_per_km2"] = float(density)
        stats["local_entropy"] = float(entropy)


def compute_neighbor_metrics(
    stats_by_cell: Dict[str, Dict[str, Any]],
    neighbor_ring: int = 1,
) -> None:
    cell_ids = set(stats_by_cell.keys())
    for cell_id, stats in stats_by_cell.items():
        neighbors = [nid for nid in _neighbors(cell_id, neighbor_ring) if nid in cell_ids and nid != cell_id]
        if not neighbors:
            stats["neighbor_mean_density"] = 0.0
            stats["neighbor_mean_entropy"] = 0.0
            stats["neighbor_count"] = 0
            continue

        density_values = [stats_by_cell[n]["density_poi_per_km2"] for n in neighbors]
        entropy_values = [stats_by_cell[n]["local_entropy"] for n in neighbors]
        stats["neighbor_mean_density"] = float(sum(density_values) / len(density_values))
        stats["neighbor_mean_entropy"] = float(sum(entropy_values) / len(entropy_values))
        stats["neighbor_count"] = len(neighbors)


def compute_global_moran_i(
    stats_by_cell: Dict[str, Dict[str, Any]],
    value_key: str = "density_poi_per_km2",
    neighbor_ring: int = 1,
) -> Optional[float]:
    cell_ids = list(stats_by_cell.keys())
    n = len(cell_ids)
    if n < 2:
        return None

    values = {cid: float(stats_by_cell[cid].get(value_key, 0.0) or 0.0) for cid in cell_ids}
    mean_value = sum(values.values()) / n
    denominator = sum((values[cid] - mean_value) ** 2 for cid in cell_ids)
    if denominator <= 0:
        return None

    numerator = 0.0
    s0 = 0
    cell_set = set(cell_ids)
    for cid in cell_ids:
        neighbors = [nid for nid in _neighbors(cid, neighbor_ring) if nid in cell_set and nid != cid]
        for nid in neighbors:
            numerator += (values[cid] - mean_value) * (values[nid] - mean_value)
            s0 += 1

    if s0 <= 0:
        return None
    moran_i = (n / s0) * (numerator / denominator)
    return _safe_round(moran_i, 6)


def build_chart_payload(
    global_category_counts: Dict[CategoryKey, int],
    density_values: List[float],
) -> Dict[str, Any]:
    labels = [label for _key, label, _prefix in CATEGORY_RULES]
    keys = [key for key, _label, _prefix in CATEGORY_RULES]
    values = [int(global_category_counts.get(key, 0)) for key in keys]

    # Fixed bins for consistent comparison between runs
    edges = [0, 1, 2, 5, 10, 20, 50, 100, 200]
    hist_labels = [f"{edges[i]}-{edges[i + 1]}" for i in range(len(edges) - 1)] + [f">={edges[-1]}"]
    hist_counts = [0 for _ in hist_labels]
    for density in density_values:
        if density >= edges[-1]:
            hist_counts[-1] += 1
            continue
        placed = False
        for i in range(len(edges) - 1):
            if edges[i] <= density < edges[i + 1]:
                hist_counts[i] += 1
                placed = True
                break
        if not placed:
            hist_counts[0] += 1

    return {
        "category_distribution": {
            "labels": labels,
            "values": values,
        },
        "density_histogram": {
            "bins": hist_labels,
            "counts": hist_counts,
        },
    }


def analyze_h3_grid(
    polygon: List[List[float]],
    resolution: int = 10,
    coord_type: Literal["gcj02", "wgs84"] = "gcj02",
    include_mode: Literal["intersects", "inside"] = "intersects",
    min_overlap_ratio: float = 0.0,
    pois: Optional[List[Dict[str, Any]]] = None,
    poi_coord_type: Literal["gcj02", "wgs84"] = "gcj02",
    neighbor_ring: int = 1,
) -> Dict[str, Any]:
    grid = build_h3_grid_feature_collection(
        polygon_coords=polygon,
        resolution=resolution,
        coord_type=coord_type,
        include_mode=include_mode,
        min_overlap_ratio=min_overlap_ratio,
    )
    features = grid.get("features") or []
    grid_ids = [f.get("properties", {}).get("h3_id") for f in features if f.get("properties", {}).get("h3_id")]
    if not grid_ids:
        empty_charts = build_chart_payload(_empty_category_counts(), [])
        return {
            "grid": grid,
            "summary": {
                "grid_count": 0,
                "poi_count": 0,
                "avg_density_poi_per_km2": 0.0,
                "avg_local_entropy": 0.0,
                "global_moran_i_density": None,
            },
            "charts": empty_charts,
        }

    stats_by_cell, assigned_poi_count, global_category_counts = aggregate_pois_to_h3(
        grid_ids=grid_ids,
        pois=pois or [],
        resolution=resolution,
        poi_coord_type=poi_coord_type,
    )
    compute_cell_metrics(stats_by_cell, resolution=resolution)
    compute_neighbor_metrics(stats_by_cell, neighbor_ring=neighbor_ring)
    global_moran_i = compute_global_moran_i(stats_by_cell, "density_poi_per_km2", neighbor_ring=neighbor_ring)

    density_values: List[float] = []
    entropy_values: List[float] = []
    for feature in features:
        props = feature.setdefault("properties", {})
        cell_id = props.get("h3_id")
        cell_stats = stats_by_cell.get(cell_id)
        if not cell_stats:
            continue

        density = float(cell_stats["density_poi_per_km2"])
        entropy = float(cell_stats["local_entropy"])
        density_values.append(density)
        entropy_values.append(entropy)

        props.update(
            {
                "poi_count": int(cell_stats["poi_count"]),
                "density_poi_per_km2": _safe_round(density, 6) or 0.0,
                "local_entropy": _safe_round(entropy, 6) or 0.0,
                "neighbor_mean_density": _safe_round(cell_stats["neighbor_mean_density"], 6) or 0.0,
                "neighbor_mean_entropy": _safe_round(cell_stats["neighbor_mean_entropy"], 6) or 0.0,
                "neighbor_count": int(cell_stats["neighbor_count"]),
                "category_counts": cell_stats["category_counts"],
            }
        )

    grid_count = len(features)
    avg_density = (sum(density_values) / grid_count) if grid_count else 0.0
    avg_entropy = (sum(entropy_values) / grid_count) if grid_count else 0.0

    return {
        "grid": {
            "type": "FeatureCollection",
            "features": features,
            "count": grid_count,
        },
        "summary": {
            "grid_count": grid_count,
            "poi_count": assigned_poi_count,
            "avg_density_poi_per_km2": _safe_round(avg_density, 6) or 0.0,
            "avg_local_entropy": _safe_round(avg_entropy, 6) or 0.0,
            "global_moran_i_density": global_moran_i,
        },
        "charts": build_chart_payload(global_category_counts, density_values),
    }
