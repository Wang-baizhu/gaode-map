import math
import warnings
from typing import Any, Dict, List, Literal, Optional, Tuple

import h3
import numpy as np
from libpysal.weights import lag_spatial
from scipy.stats import entropy as scipy_entropy

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


def _safe_float(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        f = float(value)
        if not math.isfinite(f):
            return None
        return f
    except Exception:
        return None


def _to_list(value: Any) -> List[Any]:
    if value is None:
        return []
    try:
        return list(value)
    except Exception:
        return []


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
    counts = np.asarray(list(category_counts.values()), dtype=float)
    if counts.size <= 0:
        return 0.0
    counts = counts[counts > 0]
    if counts.size <= 0:
        return 0.0
    probs = counts / counts.sum()
    return float(scipy_entropy(probs, base=math.e))


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
    weights, id_order = _build_pysal_weights(stats_by_cell, neighbor_ring=neighbor_ring)
    if not weights or not id_order:
        for stats in stats_by_cell.values():
            stats["neighbor_mean_density"] = 0.0
            stats["neighbor_mean_entropy"] = 0.0
            stats["neighbor_count"] = 0
        return

    density_values = np.asarray(
        [float(stats_by_cell[cid].get("density_poi_per_km2", 0.0) or 0.0) for cid in id_order],
        dtype=float,
    )
    entropy_values = np.asarray(
        [float(stats_by_cell[cid].get("local_entropy", 0.0) or 0.0) for cid in id_order],
        dtype=float,
    )

    try:
        weights.transform = "R"  # Row-standardized: lag_spatial output is neighbor mean.
    except Exception:
        pass

    lag_density = np.asarray(lag_spatial(weights, density_values), dtype=float).reshape(-1)
    lag_entropy = np.asarray(lag_spatial(weights, entropy_values), dtype=float).reshape(-1)

    for idx, cid in enumerate(id_order):
        neighbors = weights.neighbors.get(cid, []) or []
        neighbor_count = int(len(neighbors))
        stats = stats_by_cell[cid]
        stats["neighbor_count"] = neighbor_count
        if neighbor_count <= 0:
            stats["neighbor_mean_density"] = 0.0
            stats["neighbor_mean_entropy"] = 0.0
            continue
        stats["neighbor_mean_density"] = float(lag_density[idx])
        stats["neighbor_mean_entropy"] = float(lag_entropy[idx])


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


def _build_fdr_mask(p_values: List[Optional[float]], alpha: float) -> List[bool]:
    mask = [False] * len(p_values)
    valid = [(idx, p) for idx, p in enumerate(p_values) if p is not None and math.isfinite(p)]
    m = len(valid)
    if m <= 0:
        return mask

    ranked = sorted(valid, key=lambda item: item[1])
    cutoff_rank = 0
    for rank, (_idx, p_val) in enumerate(ranked, start=1):
        if p_val <= (alpha * rank / m):
            cutoff_rank = rank
    if cutoff_rank <= 0:
        return mask
    for rank, (idx, _p_val) in enumerate(ranked, start=1):
        if rank <= cutoff_rank:
            mask[idx] = True
    return mask


def _build_pysal_weights(
    stats_by_cell: Dict[str, Dict[str, Any]],
    neighbor_ring: int = 1,
):
    from libpysal.weights import W

    cell_ids = list(stats_by_cell.keys())
    if len(cell_ids) < 2:
        return None, []

    cell_set = set(cell_ids)
    neighbors_map: Dict[str, List[str]] = {}
    for cid in cell_ids:
        raw_neighbors = _neighbors(cid, neighbor_ring)
        filtered_neighbors = sorted({nid for nid in raw_neighbors if nid in cell_set and nid != cid})
        neighbors_map[cid] = filtered_neighbors

    if sum(len(items) for items in neighbors_map.values()) <= 0:
        return None, []

    try:
        weights = W(neighbors_map, silence_warnings=True)
    except TypeError:
        weights = W(neighbors_map)
    id_order = list(getattr(weights, "id_order", []) or [])
    if not id_order:
        return None, []
    return weights, id_order


def compute_global_moran_significance(
    stats_by_cell: Dict[str, Dict[str, Any]],
    value_key: str = "density_poi_per_km2",
    neighbor_ring: int = 1,
    permutations: int = 4999,
    seed: Optional[int] = 42,
    alpha: float = 0.05,
) -> Tuple[Optional[float], Optional[float], Optional[float], Optional[bool]]:
    try:
        from esda.moran import Moran
    except Exception as exc:
        raise RuntimeError(
            "缺少 PySAL 依赖，请安装 esda 与 libpysal 后再进行显著性计算"
        ) from exc

    try:
        weights, id_order = _build_pysal_weights(stats_by_cell, neighbor_ring=neighbor_ring)
    except Exception as exc:
        raise RuntimeError("构建空间权重失败") from exc
    if not weights or not id_order:
        return None, None, None, None

    values = [float(stats_by_cell[cid].get(value_key, 0.0) or 0.0) for cid in id_order]
    if not values or len(values) < 2:
        return None, None, None, None

    if seed is not None:
        try:
            import numpy as np  # type: ignore
            np.random.seed(int(seed))
        except Exception:
            pass

    moran_kwargs: Dict[str, Any] = {"permutations": max(0, int(permutations))}
    moran_obj = None
    if seed is None:
        moran_obj = Moran(values, weights, **moran_kwargs)
    else:
        for seed_key in ("seed", "random_state"):
            try:
                moran_obj = Moran(values, weights, **moran_kwargs, **{seed_key: int(seed)})
                break
            except TypeError:
                continue
        if moran_obj is None:
            moran_obj = Moran(values, weights, **moran_kwargs)

    observed_i = _safe_round(getattr(moran_obj, "I", None), 6)
    if observed_i is None:
        return None, None, None, None

    z_sim = _safe_float(getattr(moran_obj, "z_sim", None))
    z_norm = _safe_float(getattr(moran_obj, "z_norm", None))
    z_score = _safe_round(z_sim if z_sim is not None else z_norm, 6)
    if permutations <= 0:
        p_norm = _safe_round(_safe_float(getattr(moran_obj, "p_norm", None)), 6)
        return observed_i, z_score, p_norm, (bool(p_norm < alpha) if p_norm is not None else None)

    p_sim = getattr(moran_obj, "p_sim", None)
    if p_sim is None:
        return observed_i, z_score, None, None
    p_value = _safe_round(float(p_sim), 6)
    if p_value is None:
        return observed_i, z_score, None, None
    return observed_i, z_score, p_value, bool(p_value < alpha)


def compute_local_spatial_significance(
    stats_by_cell: Dict[str, Dict[str, Any]],
    value_key: str = "density_poi_per_km2",
    neighbor_ring: int = 1,
    permutations: int = 4999,
    seed: Optional[int] = 42,
    alpha: float = 0.05,
    use_fdr: bool = False,
    min_poi_count: int = 1,
) -> Tuple[Dict[str, Dict[str, Any]], Dict[str, int]]:
    local_stats: Dict[str, Dict[str, Any]] = {
        cid: {
            "lisa_i": None,
            "lisa_z_score": None,
            "lisa_p_value": None,
            "lisa_significant": False,
            "lisa_cluster": "NS",
            "gi_star_value": None,
            "gi_star_z_score": None,
            "gi_star_p_value": None,
            "gi_star_significant": False,
            "gi_hotspot_type": "ns",
            "is_significant": False,
        }
        for cid in stats_by_cell.keys()
    }
    counts = {
        "significant_cell_count": 0,
        "hotspot_cell_count": 0,
        "coldspot_cell_count": 0,
    }

    try:
        from esda.moran import Moran_Local
        from esda.getisord import G_Local
    except Exception as exc:
        raise RuntimeError(
            "缺少 PySAL 依赖，请安装 esda 与 libpysal 后再进行局部显著性计算"
        ) from exc

    weights, id_order = _build_pysal_weights(stats_by_cell, neighbor_ring=neighbor_ring)
    if not weights or not id_order:
        return local_stats, counts

    values = [float(stats_by_cell[cid].get(value_key, 0.0) or 0.0) for cid in id_order]
    if len(values) < 2:
        return local_stats, counts
    mean_value = sum(values) / len(values)
    if all(abs(v - mean_value) < 1e-12 for v in values):
        # No variance -> local significance is undefined; keep all cells as NS.
        return local_stats, counts
    # Exploration mode default: include all cells in local significance / FDR set.
    eligible_flags: List[bool] = [True for _ in id_order]

    if seed is not None:
        try:
            import numpy as np  # type: ignore
            np.random.seed(int(seed))
        except Exception:
            pass

    kwargs: Dict[str, Any] = {"permutations": max(0, int(permutations))}
    local_moran = None
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message="invalid value encountered in divide",
            category=RuntimeWarning,
            module=r"esda\.moran",
        )
        if seed is None:
            local_moran = Moran_Local(values, weights, **kwargs)
        else:
            for seed_key in ("seed", "random_state"):
                try:
                    local_moran = Moran_Local(values, weights, **kwargs, **{seed_key: int(seed)})
                    break
                except TypeError:
                    continue
            if local_moran is None:
                local_moran = Moran_Local(values, weights, **kwargs)

    lisa_is = _to_list(getattr(local_moran, "Is", None))
    lisa_q = _to_list(getattr(local_moran, "q", None))
    lisa_z = _to_list(getattr(local_moran, "z_sim", None))
    if not lisa_z:
        lisa_z = _to_list(getattr(local_moran, "z", None))
    lisa_p_raw_vals = (
        _to_list(getattr(local_moran, "p_sim", None))
        if permutations > 0
        else _to_list(getattr(local_moran, "p_norm", None))
    )
    lisa_p_raw: List[Optional[float]] = [_safe_float(v) for v in lisa_p_raw_vals]
    if len(lisa_p_raw) < len(id_order):
        lisa_p_raw.extend([None] * (len(id_order) - len(lisa_p_raw)))
    lisa_p_for_test = [
        lisa_p_raw[idx] if idx < len(eligible_flags) and eligible_flags[idx] else None
        for idx in range(len(id_order))
    ]
    lisa_sig_raw = [(p is not None and p < alpha) for p in lisa_p_for_test]
    lisa_sig = _build_fdr_mask(lisa_p_for_test, alpha) if use_fdr and permutations > 0 else lisa_sig_raw
    q_to_cluster = {1: "HH", 2: "LH", 3: "LL", 4: "HL"}

    gi_local = None
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message="invalid value encountered in divide",
            category=RuntimeWarning,
            module=r"esda\.getisord",
        )
        if seed is None:
            gi_local = G_Local(values, weights, star=True, **kwargs)
        else:
            for seed_key in ("seed", "random_state"):
                try:
                    gi_local = G_Local(values, weights, star=True, **kwargs, **{seed_key: int(seed)})
                    break
                except TypeError:
                    continue
            if gi_local is None:
                gi_local = G_Local(values, weights, star=True, **kwargs)

    gi_vals = _to_list(getattr(gi_local, "Gs", None))
    gi_z_vals = _to_list(getattr(gi_local, "Zs", None))
    gi_p_raw_vals = (
        _to_list(getattr(gi_local, "p_sim", None))
        if permutations > 0
        else _to_list(getattr(gi_local, "p_norm", None))
    )
    gi_p_raw: List[Optional[float]] = [_safe_float(v) for v in gi_p_raw_vals]
    if len(gi_p_raw) < len(id_order):
        gi_p_raw.extend([None] * (len(id_order) - len(gi_p_raw)))
    gi_p_for_test = [
        gi_p_raw[idx] if idx < len(eligible_flags) and eligible_flags[idx] else None
        for idx in range(len(id_order))
    ]
    gi_sig_raw = [(p is not None and p < alpha) for p in gi_p_for_test]
    gi_sig = _build_fdr_mask(gi_p_for_test, alpha) if use_fdr and permutations > 0 else gi_sig_raw

    for idx, cid in enumerate(id_order):
        eligible = bool(eligible_flags[idx]) if idx < len(eligible_flags) else False
        lisa_i = _safe_round(_safe_float(lisa_is[idx] if idx < len(lisa_is) else None), 6)
        lisa_z_score = _safe_round(_safe_float(lisa_z[idx] if idx < len(lisa_z) else None), 6)
        lisa_p = _safe_round(lisa_p_raw[idx], 6) if eligible else None
        lisa_significant = bool(lisa_sig[idx]) if idx < len(lisa_sig) else False
        cluster_code = int(_safe_float(lisa_q[idx] if idx < len(lisa_q) else None) or 0)
        lisa_cluster = q_to_cluster.get(cluster_code, "NS") if lisa_significant else "NS"

        gi_star_value = _safe_round(_safe_float(gi_vals[idx] if idx < len(gi_vals) else None), 6)
        gi_star_z = _safe_round(_safe_float(gi_z_vals[idx] if idx < len(gi_z_vals) else None), 6)
        gi_star_p = _safe_round(gi_p_raw[idx], 6) if eligible else None
        gi_significant = bool(gi_sig[idx]) if idx < len(gi_sig) else False
        if gi_significant and gi_star_z is not None and gi_star_z > 0:
            gi_hotspot_type = "hotspot"
        elif gi_significant and gi_star_z is not None and gi_star_z < 0:
            gi_hotspot_type = "coldspot"
        else:
            gi_hotspot_type = "ns"

        is_significant = bool(lisa_significant or gi_significant)
        if is_significant:
            counts["significant_cell_count"] += 1
        if gi_hotspot_type == "hotspot":
            counts["hotspot_cell_count"] += 1
        elif gi_hotspot_type == "coldspot":
            counts["coldspot_cell_count"] += 1

        local_stats[cid] = {
            "lisa_i": lisa_i,
            "lisa_z_score": lisa_z_score,
            "lisa_p_value": lisa_p,
            "lisa_significant": lisa_significant,
            "lisa_cluster": lisa_cluster,
            "gi_star_value": gi_star_value,
            "gi_star_z_score": gi_star_z,
            "gi_star_p_value": gi_star_p,
            "gi_star_significant": gi_significant,
            "gi_hotspot_type": gi_hotspot_type,
            "is_significant": is_significant,
        }

    return local_stats, counts


def build_chart_payload(
    global_category_counts: Dict[CategoryKey, int],
    density_values: List[float],
) -> Dict[str, Any]:
    labels = [label for _key, label, _prefix in CATEGORY_RULES]
    keys = [key for key, _label, _prefix in CATEGORY_RULES]
    values = [int(global_category_counts.get(key, 0)) for key in keys]

    # Fixed bins for consistent comparison between runs.
    edges = np.asarray([0, 1, 2, 5, 10, 20, 50, 100, 200], dtype=float)
    hist_labels = [f"{int(edges[i])}-{int(edges[i + 1])}" for i in range(len(edges) - 1)] + [f">={int(edges[-1])}"]
    hist_counts = np.zeros(len(hist_labels), dtype=np.int64)

    if density_values:
        density_arr = np.asarray(density_values, dtype=float)
        density_arr = density_arr[np.isfinite(density_arr)]
        if density_arr.size > 0:
            bin_edges = np.concatenate([edges, np.asarray([np.inf])])
            bin_indices = np.digitize(density_arr, bin_edges, right=False) - 1
            bin_indices = np.clip(bin_indices, 0, len(hist_labels) - 1)
            hist_counts = np.bincount(bin_indices, minlength=len(hist_labels))

    return {
        "category_distribution": {
            "labels": labels,
            "values": values,
        },
        "density_histogram": {
            "bins": hist_labels,
            "counts": [int(item) for item in hist_counts.tolist()],
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
    moran_permutations: int = 4999,
    significance_alpha: float = 0.05,
    moran_seed: Optional[int] = 42,
    significance_fdr: bool = False,
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
                "global_moran_z_score": None,
                "global_moran_p_value": None,
                "global_moran_significant": None,
                "significant_cell_count": 0,
                "hotspot_cell_count": 0,
                "coldspot_cell_count": 0,
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
    global_moran_i, global_moran_z_score, global_moran_p_value, global_moran_significant = compute_global_moran_significance(
        stats_by_cell,
        value_key="density_poi_per_km2",
        neighbor_ring=neighbor_ring,
        permutations=max(0, int(moran_permutations)),
        seed=moran_seed,
        alpha=float(significance_alpha),
    )
    local_spatial_stats, local_sig_counts = compute_local_spatial_significance(
        stats_by_cell,
        value_key="density_poi_per_km2",
        neighbor_ring=neighbor_ring,
        permutations=max(0, int(moran_permutations)),
        seed=moran_seed,
        alpha=float(significance_alpha),
        use_fdr=bool(significance_fdr),
    )

    density_values: List[float] = []
    entropy_values: List[float] = []
    for feature in features:
        props = feature.setdefault("properties", {})
        cell_id = props.get("h3_id")
        cell_stats = stats_by_cell.get(cell_id)
        if not cell_stats:
            continue
        local_stats = local_spatial_stats.get(cell_id, {})

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
                "lisa_i": local_stats.get("lisa_i"),
                "lisa_z_score": local_stats.get("lisa_z_score"),
                "lisa_p_value": local_stats.get("lisa_p_value"),
                "lisa_significant": bool(local_stats.get("lisa_significant", False)),
                "lisa_cluster": local_stats.get("lisa_cluster", "NS"),
                "gi_star_value": local_stats.get("gi_star_value"),
                "gi_star_z_score": local_stats.get("gi_star_z_score"),
                "gi_star_p_value": local_stats.get("gi_star_p_value"),
                "gi_star_significant": bool(local_stats.get("gi_star_significant", False)),
                "gi_hotspot_type": local_stats.get("gi_hotspot_type", "ns"),
                "is_significant": bool(local_stats.get("is_significant", False)),
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
            "global_moran_z_score": global_moran_z_score,
            "global_moran_p_value": global_moran_p_value,
            "global_moran_significant": global_moran_significant,
            "significant_cell_count": int(local_sig_counts.get("significant_cell_count", 0)),
            "hotspot_cell_count": int(local_sig_counts.get("hotspot_cell_count", 0)),
            "coldspot_cell_count": int(local_sig_counts.get("coldspot_cell_count", 0)),
        },
        "charts": build_chart_payload(global_category_counts, density_values),
    }
