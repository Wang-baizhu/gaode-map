from __future__ import annotations

import asyncio
import threading
import time
import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from modules.road.core import analyze_road_syntax
from modules.road.schemas import RoadSyntaxRequest, RoadSyntaxResponse

router = APIRouter()

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
        now_ts = float(time.time())
        return {
            "run_id": str(run_id or "").strip(),
            "status": "running",
            "stage": "queued",
            "message": "任务已提交，等待进度同步",
            "step": 0,
            "total": 9,
            "started_at": now_ts,
            "updated_at": now_ts,
            "elapsed_sec": 0.0,
            "extra": {
                "missing_progress_record": True,
            },
        }
    return payload

