import os
import uuid
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import ValidationError

from .runner import ArcGISRunner, ArcGISRunnerError, ArcGISRunnerTimeout, _path_exists_cross_platform
from .schemas import ArcGISH3AnalyzeRequest, ArcGISH3AnalyzeResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(name)s - %(message)s")
logger = logging.getLogger("host_bridge")


def _load_env_file(path: Path) -> None:
    if not path.exists() or not path.is_file():
        return
    for raw_line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _bootstrap_env() -> None:
    root = Path(__file__).resolve().parents[1]
    _load_env_file(root / ".env")
    _load_env_file(root / "host_bridge" / ".env")


def _resolve_token() -> str:
    return str(os.getenv("ARCGIS_TOKEN") or os.getenv("ARCGIS_BRIDGE_TOKEN") or "").strip()


def _resolve_script_path() -> str:
    explicit = str(os.getenv("ARCGIS_SCRIPT_PATH", "")).strip()
    if explicit:
        return explicit
    default = Path(__file__).resolve().parents[1] / "scripts" / "arcgis_h3_pipeline.py"
    return str(default)


_bootstrap_env()


def _load_runner() -> ArcGISRunner:
    python_path = os.getenv("ARCGIS_PYTHON_PATH", r"C:\Python27\ArcGIS10.7\python.exe")
    script_path = _resolve_script_path()
    return ArcGISRunner(default_python_path=python_path, script_path=script_path)


def _mask_path(path: str) -> str:
    if not path:
        return ""
    p = str(path)
    if len(p) <= 6:
        return p
    return p[:3] + "..." + p[-3:]


app = FastAPI(title="ArcGIS Host Bridge", version="1.0.0")
runner = _load_runner()


@app.get("/health")
def health() -> dict:
    python_path = os.getenv("ARCGIS_PYTHON_PATH", r"C:\Python27\ArcGIS10.7\python.exe")
    script_path = _resolve_script_path()
    token = _resolve_token()
    return {
        "status": "ok",
        "python_exists": bool(_path_exists_cross_platform(python_path)),
        "script_exists": bool(_path_exists_cross_platform(script_path)) if script_path else False,
        "token_configured": bool(token),
        "python_path": _mask_path(python_path),
        "script_path": _mask_path(script_path),
    }


@app.post("/v1/arcgis/h3/analyze", response_model=ArcGISH3AnalyzeResponse)
def analyze_h3(
    payload: ArcGISH3AnalyzeRequest,
    x_arcgis_token: Optional[str] = Header(default=None),
):
    expected_token = _resolve_token()
    if not expected_token:
        raise HTTPException(status_code=500, detail="ARCGIS_TOKEN/ARCGIS_BRIDGE_TOKEN is not configured")
    if str(x_arcgis_token or "").strip() != expected_token:
        raise HTTPException(status_code=401, detail="invalid arcgis token")

    trace_id = str(payload.run_id or uuid.uuid4().hex)
    logger.info("[ArcGISHostBridge] request trace_id=%s rows=%d", trace_id, len(payload.rows or []))

    try:
        result = runner.run(payload, trace_id=trace_id)
    except ArcGISRunnerTimeout as exc:
        logger.error("[ArcGISHostBridge] timeout trace_id=%s err=%s", trace_id, exc)
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except (ArcGISRunnerError, ValidationError) as exc:
        logger.error("[ArcGISHostBridge] failed trace_id=%s err=%s", trace_id, exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return ArcGISH3AnalyzeResponse(
        ok=True,
        status=str(result.get("status") or "ok"),
        cells=result.get("cells") or [],
        global_moran=result.get("global_moran") or {},
        preview_svg=result.get("preview_svg"),
        error=None,
        trace_id=trace_id,
    )
