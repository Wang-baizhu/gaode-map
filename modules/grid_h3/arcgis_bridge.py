import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class ArcGISBridgeError(RuntimeError):
    pass


def _cleanup_old_arcgis_previews(output_root: Path, ttl_hours: int) -> None:
    """Best-effort cleanup for stale ArcGIS preview snapshots."""
    try:
        keep_seconds = max(1, int(ttl_hours)) * 3600
    except Exception:
        keep_seconds = 168 * 3600
    now_ts = datetime.now().timestamp()
    if not output_root.exists() or not output_root.is_dir():
        return

    for path in output_root.glob("arcgis_h3_preview_*.svg"):
        try:
            age_seconds = now_ts - float(path.stat().st_mtime)
            if age_seconds >= keep_seconds:
                path.unlink(missing_ok=True)
        except Exception:
            continue


def _safe_float(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        f = float(value)
        if f != f:
            return None
        return f
    except Exception:
        return None


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _mix_hex_color(from_hex: str, to_hex: str, ratio: float) -> str:
    r = _clamp(float(ratio), 0.0, 1.0)
    f = str(from_hex or "#000000").lstrip("#")
    t = str(to_hex or "#000000").lstrip("#")
    if len(f) != 6 or len(t) != 6:
        return from_hex or "#000000"
    try:
        fr, fg, fb = int(f[0:2], 16), int(f[2:4], 16), int(f[4:6], 16)
        tr, tg, tb = int(t[0:2], 16), int(t[2:4], 16), int(t[4:6], 16)
    except Exception:
        return from_hex or "#000000"
    rr = round(fr + (tr - fr) * r)
    rg = round(fg + (tg - fg) * r)
    rb = round(fb + (tb - fb) * r)
    return f"#{rr:02x}{rg:02x}{rb:02x}"


def _extract_outer_ring(feature: Dict[str, Any]) -> List[List[float]]:
    geometry = (feature or {}).get("geometry") or {}
    if str(geometry.get("type") or "") != "Polygon":
        return []
    coordinates = geometry.get("coordinates") or []
    if not coordinates:
        return []
    ring = coordinates[0] or []
    result: List[List[float]] = []
    for pt in ring:
        if not isinstance(pt, (list, tuple)) or len(pt) < 2:
            continue
        try:
            result.append([float(pt[0]), float(pt[1])])
        except Exception:
            continue
    return result


def _resolve_lisa_render_meta(cell_map: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    values: List[float] = []
    for item in (cell_map or {}).values():
        v = _safe_float((item or {}).get("lisa_i"))
        if v is None:
            continue
        values.append(float(v))
    if not values:
        return {
            "mean": 0.0,
            "std": 0.0,
            "clip_min": 0.0,
            "clip_max": 0.0,
            "degraded": True,
        }
    n = float(len(values))
    mean = sum(values) / n
    variance = sum((v - mean) * (v - mean) for v in values) / n
    std = variance ** 0.5
    degraded = std <= 1e-12
    if degraded:
        return {
            "mean": mean,
            "std": std,
            "clip_min": mean,
            "clip_max": mean,
            "degraded": True,
        }
    return {
        "mean": mean,
        "std": std,
        "clip_min": mean - 3.0 * std,
        "clip_max": mean + 3.0 * std,
        "degraded": False,
    }


def _resolve_gi_z_style(z_value: Optional[float]) -> Dict[str, Any]:
    z = _safe_float(z_value)
    if z is None:
        return {"fill": "#000000", "fill_opacity": 0.0}
    min_v, max_v, center = -3.0, 3.0, 0.0
    vv = _clamp(z, min_v, max_v)
    min_opacity, max_opacity = 0.10, 0.52
    threshold = 0.2
    if vv >= center:
        span = max(1e-9, max_v - center)
        ratio = (vv - center) / span
        fill = _mix_hex_color("#f8fafc", "#b91c1c", ratio)
    else:
        span = max(1e-9, center - min_v)
        ratio = (center - vv) / span
        fill = _mix_hex_color("#f8fafc", "#1d4ed8", ratio)
    if abs(vv - center) < threshold:
        return {"fill": fill, "fill_opacity": min_opacity * 0.6}
    fill_opacity = min_opacity + (max_opacity - min_opacity) * _clamp(ratio, 0.0, 1.0)
    return {"fill": fill, "fill_opacity": fill_opacity}


def _resolve_lisa_i_style(lisa_i: Optional[float], lisa_meta: Dict[str, Any]) -> Dict[str, Any]:
    v = _safe_float(lisa_i)
    if v is None:
        return {"fill": "#000000", "fill_opacity": 0.0}
    if bool((lisa_meta or {}).get("degraded")):
        return {"fill": "#cbd5e1", "fill_opacity": 0.10}
    mean = _safe_float((lisa_meta or {}).get("mean")) or 0.0
    clip_min = _safe_float((lisa_meta or {}).get("clip_min"))
    clip_max = _safe_float((lisa_meta or {}).get("clip_max"))
    if clip_min is None or clip_max is None or clip_max <= clip_min:
        return {"fill": "#cbd5e1", "fill_opacity": 0.10}
    vv = _clamp(v, clip_min, clip_max)
    min_opacity, max_opacity = 0.10, 0.48
    if vv >= mean:
        span = max(1e-9, clip_max - mean)
        ratio = (vv - mean) / span
        fill = _mix_hex_color("#f8fafc", "#f97316", ratio)
    else:
        span = max(1e-9, mean - clip_min)
        ratio = (mean - vv) / span
        fill = _mix_hex_color("#f8fafc", "#0f766e", ratio)
    fill_opacity = min_opacity + (max_opacity - min_opacity) * _clamp(ratio, 0.0, 1.0)
    return {"fill": fill, "fill_opacity": fill_opacity}


def _render_preview_svg_from_rows(
    rows: List[Dict[str, Any]],
    cell_map: Dict[str, Dict[str, Any]],
    mode: str = "gi_z",
    width: int = 920,
    height: int = 920,
) -> str:
    all_pts: List[List[float]] = []
    normalized_rows: List[Dict[str, Any]] = []
    for row in rows or []:
        h3_id = str((row or {}).get("h3_id") or "")
        ring = (row or {}).get("ring") or []
        if not h3_id or len(ring) < 3:
            continue
        clean_ring: List[List[float]] = []
        for pt in ring:
            if not isinstance(pt, (list, tuple)) or len(pt) < 2:
                continue
            x = _safe_float(pt[0])
            y = _safe_float(pt[1])
            if x is None or y is None:
                continue
            clean_ring.append([x, y])
        if len(clean_ring) < 3:
            continue
        all_pts.extend(clean_ring)
        normalized_rows.append({"h3_id": h3_id, "ring": clean_ring})

    if not normalized_rows or not all_pts:
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="240">'
            '<text x="16" y="36" font-size="16" fill="#374151">ArcGIS structure preview is empty</text>'
            '</svg>'
        )

    xs = [pt[0] for pt in all_pts]
    ys = [pt[1] for pt in all_pts]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    span_x = max(1e-9, max_x - min_x)
    span_y = max(1e-9, max_y - min_y)
    pad = 22.0
    draw_w = width - 2 * pad
    draw_h = height - 2 * pad

    def to_svg_xy(lng: float, lat: float) -> List[float]:
        x = pad + ((lng - min_x) / span_x) * draw_w
        y = pad + ((max_y - lat) / span_y) * draw_h
        return [x, y]

    view_mode = "lisa_i" if str(mode or "").lower() == "lisa_i" else "gi_z"
    lisa_meta = _resolve_lisa_render_meta(cell_map) if view_mode == "lisa_i" else {}

    lines: List[str] = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect x="0" y="0" width="100%" height="100%" fill="#f8fafc"/>',
    ]
    for row in normalized_rows:
        meta = cell_map.get(row["h3_id"]) or {}
        if view_mode == "lisa_i":
            style = _resolve_lisa_i_style(_safe_float(meta.get("lisa_i")), lisa_meta)
        else:
            style = _resolve_gi_z_style(_safe_float(meta.get("gi_z_score")))
        fill = style["fill"]
        fill_opacity = float(style["fill_opacity"])
        stroke = "#2c6ecb"
        pts = [to_svg_xy(pt[0], pt[1]) for pt in row["ring"]]
        if not pts:
            continue
        path_d = "M " + " L ".join(f"{p[0]:.2f} {p[1]:.2f}" for p in pts) + " Z"
        lines.append(
            f'<path d="{path_d}" fill="{fill}" fill-opacity="{fill_opacity:.3f}" '
            f'stroke="{stroke}" stroke-width="1.2" stroke-opacity="0.95"/>'
        )

    lines.extend(
        [
            '<rect x="16" y="16" width="292" height="96" rx="8" fill="#ffffff" fill-opacity="0.88" stroke="#d1d5db"/>',
            '<text x="28" y="38" font-size="12" fill="#111827">ArcGIS bridge preview</text>',
            '<text x="28" y="58" font-size="11" fill="#374151">'
            + ('Fill: LMiIndex (stddev continuous)' if view_mode == "lisa_i" else 'Fill: GiZScore (continuous)')
            + '</text>',
            '<text x="28" y="76" font-size="11" fill="#374151">Stroke: unified grid border (#2c6ecb)</text>',
            f'<text x="28" y="94" font-size="10" fill="#6b7280">Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</text>',
        ]
    )
    lines.append("</svg>")
    return "\n".join(lines)


def _build_rows(features: List[Dict[str, Any]], stats_by_cell: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for feature in features:
        props = (feature or {}).get("properties") or {}
        h3_id = str(props.get("h3_id") or "")
        if not h3_id:
            continue
        ring = _extract_outer_ring(feature)
        if len(ring) < 3:
            continue
        density = _safe_float((stats_by_cell.get(h3_id) or {}).get("density_poi_per_km2"))
        rows.append({
            "h3_id": h3_id,
            "value": density or 0.0,
            "ring": ring,
        })
    return rows


def run_arcgis_h3_analysis(
    features: List[Dict[str, Any]],
    stats_by_cell: Dict[str, Dict[str, Any]],
    arcgis_python_path: Optional[str] = None,
    knn_neighbors: int = 8,
    timeout_sec: int = 240,
    export_image: bool = True,
) -> Dict[str, Any]:
    if not settings.arcgis_bridge_enabled:
        raise ArcGISBridgeError("ArcGIS bridge is disabled by ARCGIS_BRIDGE_ENABLED")

    if not features:
        raise ArcGISBridgeError("Grid is empty, cannot run ArcGIS bridge")

    token = str(settings.arcgis_bridge_token or "").strip()
    if not token:
        raise ArcGISBridgeError("ARCGIS_BRIDGE_TOKEN is not configured")

    rows = _build_rows(features, stats_by_cell)
    if not rows:
        raise ArcGISBridgeError("No valid H3 rows to submit ArcGIS bridge")

    run_id = datetime.now().strftime("%Y%m%d_%H%M%S_%f") + "_" + uuid.uuid4().hex[:8]
    bridge_timeout = max(int(settings.arcgis_bridge_timeout_s or 300), int(timeout_sec or 240))
    payload: Dict[str, Any] = {
        "rows": rows,
        "knn_neighbors": int(max(1, min(64, int(knn_neighbors)))),
        "export_image": bool(export_image),
        "timeout_sec": int(max(30, int(timeout_sec))),
        "run_id": run_id,
    }
    if arcgis_python_path:
        payload["arcgis_python_path"] = str(arcgis_python_path)

    endpoint = str(settings.arcgis_bridge_base_url or "").rstrip("/") + "/v1/arcgis/h3/analyze"
    headers = {
        "X-ArcGIS-Token": token,
        "Content-Type": "application/json",
    }

    logger.info("[ArcGISBridge] request %s rows=%d run_id=%s", endpoint, len(rows), run_id)

    try:
        with httpx.Client(timeout=float(bridge_timeout)) as client:
            resp = client.post(endpoint, headers=headers, json=payload)
    except httpx.TimeoutException as exc:
        raise ArcGISBridgeError(f"ArcGIS bridge timeout after {bridge_timeout}s") from exc
    except httpx.RequestError as exc:
        raise ArcGISBridgeError(f"ArcGIS bridge unreachable: {exc}") from exc

    try:
        body = resp.json()
    except Exception:
        body = {}

    if resp.status_code != 200:
        detail = body.get("detail") if isinstance(body, dict) else None
        if isinstance(detail, dict):
            detail = json.dumps(detail, ensure_ascii=False)
        raise ArcGISBridgeError(f"ArcGIS bridge HTTP {resp.status_code}: {detail or resp.text[:300]}")

    if not isinstance(body, dict) or not body.get("ok"):
        err = body.get("error") if isinstance(body, dict) else None
        status = body.get("status") if isinstance(body, dict) else None
        raise ArcGISBridgeError(f"ArcGIS bridge failed: {err or status or 'unknown error'}")

    cells = body.get("cells") or []
    global_moran = body.get("global_moran") or {}
    trace_id = str(body.get("trace_id") or "")
    status_text = str(body.get("status") or "ok")

    cell_map: Dict[str, Dict[str, Any]] = {}
    for item in cells:
        h3_id = str((item or {}).get("h3_id") or "")
        if h3_id:
            cell_map[h3_id] = item

    image_url = None
    image_url_gi = None
    image_url_lisa = None
    if export_image:
        output_root = Path(settings.static_dir) / "generated" / "arcgis"
        output_root.mkdir(parents=True, exist_ok=True)
        _cleanup_old_arcgis_previews(output_root, settings.file_lifetime_hours)
        gi_svg = _render_preview_svg_from_rows(rows, cell_map, mode="gi_z")
        lisa_svg = _render_preview_svg_from_rows(rows, cell_map, mode="lisa_i")
        image_path_gi = output_root / f"arcgis_h3_preview_{run_id}_gi.svg"
        image_path_lisa = output_root / f"arcgis_h3_preview_{run_id}_lisa.svg"
        image_path_gi.write_text(gi_svg, encoding="utf-8")
        image_path_lisa.write_text(lisa_svg, encoding="utf-8")
        image_url_gi = f"/static/generated/arcgis/{image_path_gi.name}"
        image_url_lisa = f"/static/generated/arcgis/{image_path_lisa.name}"
        image_url = image_url_gi

    if trace_id:
        status_text = f"{status_text} (trace_id={trace_id})"

    return {
        "cells": cells,
        "global_moran": global_moran,
        "status": status_text,
        "image_url": image_url,
        "image_url_gi": image_url_gi,
        "image_url_lisa": image_url_lisa,
    }
