from typing import List, Optional

from pydantic import BaseModel, Field


class H3Row(BaseModel):
    h3_id: str
    value: float = 0.0
    ring: List[List[float]] = Field(default_factory=list)


class ArcGISH3AnalyzeRequest(BaseModel):
    rows: List[H3Row] = Field(default_factory=list)
    knn_neighbors: int = Field(8, ge=1, le=64)
    export_image: bool = True
    timeout_sec: int = Field(240, ge=30, le=1800)
    run_id: Optional[str] = None
    arcgis_python_path: Optional[str] = None


class GlobalMoranOut(BaseModel):
    i: Optional[float] = None
    z_score: Optional[float] = None


class ArcGISCellOut(BaseModel):
    h3_id: str
    gi_z_score: Optional[float] = None
    lisa_i: Optional[float] = None
    lisa_z_score: Optional[float] = None


class ArcGISH3AnalyzeResponse(BaseModel):
    ok: bool = True
    status: str = "ok"
    cells: List[ArcGISCellOut] = Field(default_factory=list)
    global_moran: GlobalMoranOut = Field(default_factory=GlobalMoranOut)
    preview_svg: Optional[str] = None
    error: Optional[str] = None
    trace_id: str
