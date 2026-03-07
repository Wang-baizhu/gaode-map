from __future__ import annotations

import base64
import csv
import hashlib
import json
from datetime import datetime
from io import BytesIO, StringIO
from typing import Any, Dict, List, Optional, Sequence, Tuple
from zipfile import ZIP_DEFLATED, ZipFile

from modules.grid_h3.arcgis_bridge import run_arcgis_h3_export

from .schemas import (
    ALLOWED_EXPORT_PARTS,
    H3_PROFESSIONAL_PARTS,
    AnalysisExportBundleRequest,
)

REQUEST_SIZE_LIMIT_BYTES = 64 * 1024 * 1024
ZIP_SIZE_LIMIT_BYTES = 128 * 1024 * 1024
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"


class AnalysisExportError(RuntimeError):
    pass


class AnalysisExportEmptyError(AnalysisExportError):
    pass


class AnalysisExportOnlyProfessionalFailedError(AnalysisExportError):
    pass


class AnalysisExportTooLargeError(AnalysisExportError):
    pass


class _SkipPartError(RuntimeError):
    pass


_PART_FILE_PATHS: Dict[str, str] = {
    "overview_json": "01_overview/result_overview.json",
    "isochrone_geojson": "02_scope/isochrone.geojson",
    "poi_csv": "03_poi/pois.csv",
    "poi_geojson": "03_poi/pois.geojson",
    "poi_panel_png": "07_panels/poi_panel.png",
    "h3_grid_geojson": "04_h3/grid.geojson",
    "h3_summary_csv": "04_h3/summary.csv",
    "h3_metrics_json": "04_h3/metrics.json",
    "h3_metric_panel_png": "07_panels/h3_metric_panel.png",
    "h3_structure_panel_png": "07_panels/h3_structure_panel.png",
    "h3_typing_panel_png": "07_panels/h3_typing_panel.png",
    "h3_lq_panel_png": "07_panels/h3_lq_panel.png",
    "h3_gap_panel_png": "07_panels/h3_gap_panel.png",
    "road_syntax_geojson": "05_road/roads.geojson",
    "road_syntax_summary_csv": "05_road/summary.csv",
    "road_connectivity_panel_png": "08_road_panels/connectivity_panel.png",
    "road_control_panel_png": "08_road_panels/control_panel.png",
    "road_depth_panel_png": "08_road_panels/depth_panel.png",
    "road_choice_panel_png": "08_road_panels/choice_panel.png",
    "road_integration_panel_png": "08_road_panels/integration_panel.png",
    "road_intelligibility_panel_png": "08_road_panels/intelligibility_panel.png",
    "h3_gpkg": "06_h3_professional/h3_analysis.gpkg",
    "h3_arcgis_package": "06_h3_professional/h3_analysis_arcgis_package.zip",
    "map_snapshot_png": "99_assets/map_snapshot.png",
}

_FRONTEND_CHART_FILE_PATHS: Dict[str, str] = {
    "poi_category": "07_charts/poi_category.png",
    "h3_category_distribution": "07_charts/h3_category_distribution.png",
    "h3_density_histogram": "07_charts/h3_density_histogram.png",
    "h3_structure_overview": "07_charts/h3_structure_overview.png",
    "h3_lq_distribution": "07_charts/h3_lq_distribution.png",
    "h3_gap_scatter": "07_charts/h3_gap_scatter.png",
    "road_intelligibility_scatter": "07_charts/road_intelligibility_scatter.png",
}

_FRONTEND_PANEL_PART_TO_ID: Dict[str, str] = {
    "poi_panel_png": "poi_panel",
    "h3_metric_panel_png": "h3_metric_panel",
    "h3_structure_panel_png": "h3_structure_panel",
    "h3_typing_panel_png": "h3_typing_panel",
    "h3_lq_panel_png": "h3_lq_panel",
    "h3_gap_panel_png": "h3_gap_panel",
    "road_connectivity_panel_png": "road_connectivity_panel",
    "road_control_panel_png": "road_control_panel",
    "road_depth_panel_png": "road_depth_panel",
    "road_choice_panel_png": "road_choice_panel",
    "road_integration_panel_png": "road_integration_panel",
    "road_intelligibility_panel_png": "road_intelligibility_panel",
}


def estimate_request_size_bytes(payload: AnalysisExportBundleRequest) -> int:
    try:
        return len(payload.model_dump_json().encode("utf-8"))
    except Exception:
        return 0


def build_analysis_export_bundle(payload: AnalysisExportBundleRequest) -> Dict[str, Any]:
    selected_parts = _normalize_selected_parts(payload.parts)
    if not selected_parts:
        raise AnalysisExportEmptyError("No export parts selected")

    generated_at = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    manifest: Dict[str, Any] = {
        "export_version": "1.0",
        "generated_at": generated_at,
        "template": payload.template,
        "coord_type": payload.coord_type,
        "selected_parts": selected_parts,
        "included_files": [],
        "skipped_parts": [],
        "errors": [],
    }

    professional_selected = [p for p in selected_parts if p in H3_PROFESSIONAL_PARTS]
    professional_selected_only = len(professional_selected) == len(selected_parts)
    professional_failed_parts: set[str] = set()

    zip_buffer = BytesIO()
    with ZipFile(zip_buffer, mode="w", compression=ZIP_DEFLATED) as zf:
        for part in selected_parts:
            try:
                if part == "frontend_charts_png":
                    chart_files, skipped_chart_ids = _build_frontend_chart_files(payload)
                    for chart_id in skipped_chart_ids:
                        manifest["skipped_parts"].append(
                            {
                                "part": part,
                                "chart_id": chart_id,
                                "reason": "missing_or_invalid_chart_png",
                            }
                        )
                    if not chart_files:
                        raise _SkipPartError("empty_frontend_charts")
                    for path, content in chart_files:
                        _write_zip_file(
                            zf,
                            path=path,
                            content=content,
                            record_count=1,
                            included_files=manifest["included_files"],
                        )
                    continue
                if part in _FRONTEND_PANEL_PART_TO_ID:
                    panel_id = _FRONTEND_PANEL_PART_TO_ID[part]
                    panel_png = _extract_frontend_panel_png(panel_id, payload)
                    if not panel_png:
                        manifest["skipped_parts"].append(
                            {
                                "part": part,
                                "panel_id": panel_id,
                                "reason": "missing_or_invalid_panel_png",
                            }
                        )
                        continue
                    _write_zip_file(
                        zf,
                        path=_PART_FILE_PATHS[part],
                        content=panel_png,
                        record_count=1,
                        included_files=manifest["included_files"],
                    )
                    continue
                content, record_count = _build_part_content(part, payload)
                _write_zip_file(
                    zf,
                    path=_PART_FILE_PATHS[part],
                    content=content,
                    record_count=record_count,
                    included_files=manifest["included_files"],
                )
            except _SkipPartError as exc:
                manifest["skipped_parts"].append({"part": part, "reason": str(exc)})
            except Exception as exc:  # noqa: BLE001
                manifest["errors"].append({"part": part, "error": str(exc)})
                if part in H3_PROFESSIONAL_PARTS:
                    professional_failed_parts.add(part)

        manifest_bytes = _encode_json_bytes(manifest)
        _write_zip_file(
            zf,
            path="manifest.json",
            content=manifest_bytes,
            record_count=len(manifest.get("included_files") or []),
            included_files=None,
        )

    included_files = manifest.get("included_files") or []
    if not included_files:
        if professional_selected_only and set(professional_selected) and set(professional_selected).issubset(professional_failed_parts):
            raise AnalysisExportOnlyProfessionalFailedError("Professional exports failed")
        raise AnalysisExportEmptyError("No valid export content generated")

    zip_bytes = zip_buffer.getvalue()
    if len(zip_bytes) > ZIP_SIZE_LIMIT_BYTES:
        raise AnalysisExportTooLargeError(
            f"ZIP payload too large ({len(zip_bytes)} bytes > {ZIP_SIZE_LIMIT_BYTES} bytes)"
        )

    filename = f"analysis_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
    return {
        "filename": filename,
        "content": zip_bytes,
        "manifest": manifest,
    }


def _normalize_selected_parts(parts: Sequence[str]) -> List[str]:
    allowed = set(ALLOWED_EXPORT_PARTS)
    result: List[str] = []
    for part in parts or []:
        key = str(part or "").strip()
        if not key or key not in allowed:
            continue
        if key in result:
            continue
        result.append(key)
    return result


def _write_zip_file(
    zf: ZipFile,
    *,
    path: str,
    content: bytes,
    record_count: int,
    included_files: Optional[List[Dict[str, Any]]],
) -> None:
    data = bytes(content or b"")
    zf.writestr(path, data)
    if included_files is not None:
        included_files.append(
            {
                "file": path,
                "size_bytes": len(data),
                "record_count": max(0, int(record_count)),
                "sha256": hashlib.sha256(data).hexdigest(),
            }
        )


def _build_part_content(part: str, payload: AnalysisExportBundleRequest) -> Tuple[bytes, int]:
    if part == "overview_json":
        overview = _build_overview_payload(payload)
        return _encode_json_bytes(overview), 1

    if part == "isochrone_geojson":
        feature = _normalize_feature(payload.isochrone_feature)
        if not feature:
            raise _SkipPartError("missing_or_invalid_isochrone_feature")
        return _encode_json_bytes(feature), 1

    if part == "poi_csv":
        poi_rows = _normalize_poi_rows(payload.pois)
        if not poi_rows:
            raise _SkipPartError("empty_poi_list")
        return _build_poi_csv(poi_rows), len(poi_rows)

    if part == "poi_geojson":
        poi_rows = _normalize_poi_rows(payload.pois)
        if not poi_rows:
            raise _SkipPartError("empty_poi_list")
        geojson = {
            "type": "FeatureCollection",
            "features": _pois_to_features(poi_rows),
            "count": len(poi_rows),
        }
        return _encode_json_bytes(geojson), len(poi_rows)

    if part == "frontend_charts_png":
        chart_files, _ = _build_frontend_chart_files(payload)
        if not chart_files:
            raise _SkipPartError("empty_frontend_charts")
        return b"", len(chart_files)

    if part in _FRONTEND_PANEL_PART_TO_ID:
        panel_id = _FRONTEND_PANEL_PART_TO_ID[part]
        panel_png = _extract_frontend_panel_png(panel_id, payload)
        if not panel_png:
            raise _SkipPartError("missing_or_invalid_panel_png")
        return panel_png, 1

    if part == "h3_grid_geojson":
        features = _extract_h3_grid_features(payload)
        if not features:
            raise _SkipPartError("empty_h3_grid")
        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "count": len(features),
        }
        return _encode_json_bytes(geojson), len(features)

    if part == "h3_summary_csv":
        features = _extract_h3_grid_features(payload)
        if not features:
            raise _SkipPartError("empty_h3_grid")
        rows = _build_h3_summary_rows(features)
        if not rows:
            raise _SkipPartError("empty_h3_summary_rows")
        return _build_csv_bytes(rows, headers=list(rows[0].keys())), len(rows)

    if part == "h3_metrics_json":
        h3_payload = payload.h3
        if not h3_payload:
            raise _SkipPartError("missing_h3_payload")
        features = _extract_h3_grid_features(payload)
        if not features and not h3_payload.summary and not h3_payload.charts:
            raise _SkipPartError("empty_h3_metrics_payload")
        metrics = {
            "summary": _json_safe_value(h3_payload.summary),
            "charts": _json_safe_value(h3_payload.charts),
            "style_meta": _json_safe_value(h3_payload.style_meta),
            "grid_count": len(features),
        }
        return _encode_json_bytes(metrics), max(1, len(features))

    if part == "road_syntax_geojson":
        features = _extract_road_features(payload)
        if not features:
            raise _SkipPartError("empty_road_syntax_features")
        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "count": len(features),
        }
        return _encode_json_bytes(geojson), len(features)

    if part == "road_syntax_summary_csv":
        summary = (payload.road_syntax.summary if payload.road_syntax else {}) or {}
        rows = _build_summary_rows(summary)
        if not rows:
            raise _SkipPartError("empty_road_syntax_summary")
        return _build_csv_bytes(rows, headers=["key", "value"]), len(rows)

    if part == "map_snapshot_png":
        png_bytes = _decode_png_base64(payload.map_snapshot_png_base64)
        if not png_bytes:
            raise _SkipPartError("missing_map_snapshot_png")
        return png_bytes, 1

    if part in {"h3_gpkg", "h3_arcgis_package"}:
        return _build_h3_professional_export(part, payload)

    raise _SkipPartError("unsupported_part")


def _build_overview_payload(payload: AnalysisExportBundleRequest) -> Dict[str, Any]:
    poi_rows = _normalize_poi_rows(payload.pois)
    h3_features = _extract_h3_grid_features(payload)
    road_features = _extract_road_features(payload)
    return {
        "context": _json_safe_value(payload.context),
        "coord_type": payload.coord_type,
        "counts": {
            "pois": len(poi_rows),
            "h3_grid_features": len(h3_features),
            "road_features": len(road_features),
            "has_isochrone": _normalize_feature(payload.isochrone_feature) is not None,
            "has_h3_summary": bool(payload.h3 and payload.h3.summary),
            "has_road_summary": bool(payload.road_syntax and payload.road_syntax.summary),
        },
    }


def _build_h3_professional_export(part: str, payload: AnalysisExportBundleRequest) -> Tuple[bytes, int]:
    h3_payload = payload.h3
    if not h3_payload:
        raise _SkipPartError("missing_h3_payload")

    grid_features = _extract_h3_grid_features(payload)
    if not grid_features:
        raise _SkipPartError("empty_h3_grid")

    poi_rows = _normalize_poi_rows(payload.pois)
    poi_features = _pois_to_features(poi_rows)
    style_mode = _resolve_h3_style_mode(h3_payload.style_meta)
    export_format = "gpkg" if part == "h3_gpkg" else "arcgis_package"

    export_result = run_arcgis_h3_export(
        export_format=export_format,
        include_poi=bool(poi_features),
        style_mode=style_mode,
        grid_features=grid_features,
        poi_features=poi_features,
        style_meta=_json_safe_dict(h3_payload.style_meta),
        arcgis_python_path=None,
        timeout_sec=300,
    )
    content = export_result.get("content") or b""
    if not isinstance(content, (bytes, bytearray)) or not content:
        raise RuntimeError("ArcGIS export returned empty content")

    return bytes(content), len(grid_features)


def _resolve_h3_style_mode(style_meta: Dict[str, Any]) -> str:
    mode = ""
    if isinstance(style_meta, dict):
        mode = str(style_meta.get("style_mode") or "").strip().lower()
        if mode not in {"density", "gi_z", "lisa_i"}:
            mode = str(style_meta.get("structure_fill_mode") or "").strip().lower()
    if mode not in {"density", "gi_z", "lisa_i"}:
        mode = "density"
    return mode


def _extract_h3_grid_features(payload: AnalysisExportBundleRequest) -> List[Dict[str, Any]]:
    source = payload.h3.grid_features if payload.h3 else []
    return _normalize_feature_list(source, allowed_geometry_types={"Polygon", "MultiPolygon"})


def _extract_road_features(payload: AnalysisExportBundleRequest) -> List[Dict[str, Any]]:
    roads = payload.road_syntax.roads if payload.road_syntax else {}
    features: List[Dict[str, Any]] = []
    if isinstance(roads, dict):
        candidates = roads.get("features") if isinstance(roads.get("features"), list) else []
        features = _normalize_feature_list(candidates, allowed_geometry_types={"LineString", "MultiLineString"})
    return features


def _normalize_feature_list(
    features: Sequence[Dict[str, Any]],
    *,
    allowed_geometry_types: Optional[set[str]] = None,
) -> List[Dict[str, Any]]:
    result: List[Dict[str, Any]] = []
    for item in features or []:
        feature = _normalize_feature(item, allowed_geometry_types=allowed_geometry_types)
        if feature:
            result.append(feature)
    return result


def _normalize_feature(
    raw: Any,
    *,
    allowed_geometry_types: Optional[set[str]] = None,
) -> Optional[Dict[str, Any]]:
    if not isinstance(raw, dict):
        return None
    if str(raw.get("type") or "") != "Feature":
        return None
    geometry = _normalize_geometry(raw.get("geometry"))
    if not geometry:
        return None
    if allowed_geometry_types and geometry.get("type") not in allowed_geometry_types:
        return None
    properties = _json_safe_dict(raw.get("properties") if isinstance(raw.get("properties"), dict) else {})
    return {
        "type": "Feature",
        "geometry": geometry,
        "properties": properties,
    }


def _normalize_geometry(raw: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(raw, dict):
        return None
    geom_type = str(raw.get("type") or "")
    coords = raw.get("coordinates")

    if geom_type == "Point":
        point = _normalize_position(coords)
        if not point:
            return None
        return {"type": "Point", "coordinates": point}

    if geom_type == "LineString":
        line = _normalize_line(coords)
        if not line:
            return None
        return {"type": "LineString", "coordinates": line}

    if geom_type == "MultiLineString":
        lines: List[List[List[float]]] = []
        for item in coords if isinstance(coords, list) else []:
            line = _normalize_line(item)
            if line:
                lines.append(line)
        if not lines:
            return None
        return {"type": "MultiLineString", "coordinates": lines}

    if geom_type == "Polygon":
        polygon = _normalize_polygon(coords)
        if not polygon:
            return None
        return {"type": "Polygon", "coordinates": polygon}

    if geom_type == "MultiPolygon":
        polygons: List[List[List[List[float]]]] = []
        for item in coords if isinstance(coords, list) else []:
            polygon = _normalize_polygon(item)
            if polygon:
                polygons.append(polygon)
        if not polygons:
            return None
        return {"type": "MultiPolygon", "coordinates": polygons}

    return None


def _normalize_position(raw: Any) -> Optional[List[float]]:
    if not isinstance(raw, (list, tuple)) or len(raw) < 2:
        return None
    try:
        lng = float(raw[0])
        lat = float(raw[1])
    except (TypeError, ValueError):
        return None
    if not (lng == lng and lat == lat):
        return None
    return [lng, lat]


def _normalize_line(raw: Any) -> Optional[List[List[float]]]:
    if not isinstance(raw, list):
        return None
    points: List[List[float]] = []
    for item in raw:
        point = _normalize_position(item)
        if point:
            points.append(point)
    if len(points) < 2:
        return None
    return points


def _normalize_ring(raw: Any) -> Optional[List[List[float]]]:
    line = _normalize_line(raw)
    if not line or len(line) < 3:
        return None
    first = line[0]
    last = line[-1]
    if first[0] != last[0] or first[1] != last[1]:
        line.append([first[0], first[1]])
    if len(line) < 4:
        return None
    return line


def _normalize_polygon(raw: Any) -> Optional[List[List[List[float]]]]:
    if not isinstance(raw, list):
        return None
    rings: List[List[List[float]]] = []
    for item in raw:
        ring = _normalize_ring(item)
        if ring:
            rings.append(ring)
    if not rings:
        return None
    return rings


def _normalize_poi_rows(source: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for item in source or []:
        if not isinstance(item, dict):
            continue
        location = item.get("location")
        point = _normalize_position(location)
        if not point:
            continue
        rows.append(
            {
                "id": str(item.get("id") or ""),
                "name": str(item.get("name") or ""),
                "type": str(item.get("type") or ""),
                "category": str(item.get("category") or item.get("category_name") or ""),
                "lng": point[0],
                "lat": point[1],
                "address": str(item.get("address") or ""),
                "distance": _normalize_optional_float(item.get("distance")),
                "source": str(item.get("source") or ""),
            }
        )
    return rows


def _build_poi_csv(rows: Sequence[Dict[str, Any]]) -> bytes:
    headers = ["id", "name", "type", "category", "lng", "lat", "address", "distance", "source"]
    return _build_csv_bytes(rows, headers=headers)


def _build_h3_summary_rows(features: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for feature in features or []:
        props = feature.get("properties") if isinstance(feature, dict) else {}
        if not isinstance(props, dict):
            props = {}
        rows.append(
            {
                "h3_id": str(props.get("h3_id") or ""),
                "poi_count": _normalize_optional_int(props.get("poi_count")),
                "density_poi_per_km2": _normalize_optional_float(props.get("density_poi_per_km2")),
                "local_entropy": _normalize_optional_float(props.get("local_entropy")),
                "neighbor_mean_density": _normalize_optional_float(props.get("neighbor_mean_density")),
                "neighbor_mean_entropy": _normalize_optional_float(props.get("neighbor_mean_entropy")),
                "neighbor_count": _normalize_optional_int(props.get("neighbor_count")),
                "gi_star_z_score": _normalize_optional_float(props.get("gi_star_z_score")),
                "lisa_i": _normalize_optional_float(props.get("lisa_i")),
                "category_counts": json.dumps(_json_safe_dict(props.get("category_counts") or {}), ensure_ascii=False),
            }
        )
    return rows


def _build_summary_rows(summary: Dict[str, Any]) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    for key in sorted(summary.keys()):
        value = summary.get(key)
        if isinstance(value, (dict, list)):
            value_text = json.dumps(_json_safe_value(value), ensure_ascii=False)
        else:
            value_text = "" if value is None else str(value)
        rows.append({"key": str(key), "value": value_text})
    return rows


def _build_csv_bytes(rows: Sequence[Dict[str, Any]], *, headers: List[str]) -> bytes:
    stream = StringIO()
    writer = csv.DictWriter(stream, fieldnames=headers, lineterminator="\n")
    writer.writeheader()
    for row in rows:
        writer.writerow({key: row.get(key, "") for key in headers})
    return stream.getvalue().encode("utf-8")


def _build_frontend_chart_files(payload: AnalysisExportBundleRequest) -> Tuple[List[Tuple[str, bytes]], List[str]]:
    chart_files: List[Tuple[str, bytes]] = []
    skipped_chart_ids: List[str] = []
    seen_ids: set[str] = set()
    for item in payload.frontend_charts or []:
        chart_id = str(getattr(item, "chart_id", "") or "").strip()
        if not chart_id or chart_id in seen_ids:
            continue
        seen_ids.add(chart_id)
        path = _FRONTEND_CHART_FILE_PATHS.get(chart_id)
        if not path:
            continue
        png_bytes = _decode_png_base64(getattr(item, "png_base64", None))
        if not png_bytes:
            skipped_chart_ids.append(chart_id)
            continue
        chart_files.append((path, png_bytes))
    return chart_files, skipped_chart_ids


def _extract_frontend_panel_png(panel_id: str, payload: AnalysisExportBundleRequest) -> Optional[bytes]:
    target_id = str(panel_id or "").strip()
    if not target_id:
        return None
    for item in payload.frontend_panels or []:
        current_id = str(getattr(item, "panel_id", "") or "").strip()
        if current_id != target_id:
            continue
        png_bytes = _decode_png_base64(getattr(item, "png_base64", None))
        if png_bytes:
            return png_bytes
        return None
    return None


def _decode_png_base64(raw: Optional[str]) -> Optional[bytes]:
    text = str(raw or "").strip()
    if not text:
        return None
    if text.startswith("data:"):
        marker = "base64,"
        idx = text.find(marker)
        if idx < 0:
            return None
        prefix = text[: idx + len(marker)].lower()
        if "image/png" not in prefix:
            return None
        text = text[idx + len(marker) :]

    try:
        data = base64.b64decode(text, validate=True)
    except Exception:
        return None

    if not data.startswith(PNG_MAGIC):
        return None
    return data


def _pois_to_features(rows: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    features: List[Dict[str, Any]] = []
    for row in rows or []:
        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [row["lng"], row["lat"]],
                },
                "properties": {
                    "id": row.get("id", ""),
                    "name": row.get("name", ""),
                    "type": row.get("type", ""),
                    "category": row.get("category", ""),
                    "address": row.get("address", ""),
                    "distance": row.get("distance", ""),
                    "source": row.get("source", ""),
                },
            }
        )
    return features


def _json_safe_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, dict):
        return {str(k): _json_safe_value(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe_value(v) for v in value]
    return str(value)


def _json_safe_dict(value: Any) -> Dict[str, Any]:
    if not isinstance(value, dict):
        return {}
    return {str(k): _json_safe_value(v) for k, v in value.items()}


def _normalize_optional_float(value: Any) -> Any:
    try:
        num = float(value)
    except (TypeError, ValueError):
        return ""
    if num != num:
        return ""
    return num


def _normalize_optional_int(value: Any) -> Any:
    try:
        return int(value)
    except (TypeError, ValueError):
        return ""


def _encode_json_bytes(value: Any) -> bytes:
    return json.dumps(_json_safe_value(value), ensure_ascii=False, indent=2).encode("utf-8")
