from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from .schemas import GridResponse


class PoiLike(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    location: List[float] = Field(..., min_length=2, max_length=2, description="[lng, lat]")
    type: Optional[str] = None


class H3MetricsRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    polygon: List[List[float]] = Field(
        ...,
        min_length=3,
        description="Polygon ring coordinates ([[lng, lat], ...])",
    )
    resolution: int = Field(10, ge=0, le=15, description="H3 resolution")
    coord_type: Literal["gcj02", "wgs84"] = Field(
        "gcj02",
        description="Input coordinate system of polygon",
    )
    include_mode: Literal["intersects", "inside"] = Field(
        "intersects",
        description="Grid include strategy against source polygon",
    )
    min_overlap_ratio: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Minimum overlap ratio (0~1), used when include_mode=intersects",
    )
    pois: List[PoiLike] = Field(default_factory=list, description="POI list for aggregation")
    poi_coord_type: Literal["gcj02", "wgs84"] = Field(
        "gcj02",
        description="Coordinate system of POI locations",
    )
    neighbor_ring: int = Field(1, ge=1, le=3, description="Neighbor ring size for neighborhood metrics")
    use_arcgis: bool = Field(False, description="Whether to run ArcGIS(ArcPy) as spatial analysis engine")
    arcgis_python_path: Optional[str] = Field(
        None,
        description=r"Optional ArcPy python path, e.g. C:\Python27\ArcGIS10.7\python.exe",
    )
    arcgis_neighbor_ring: int = Field(
        1,
        ge=1,
        le=3,
        description="Neighbor ring size for ArcGIS path; mapped to KNN(1->6,2->18,3->36)",
    )
    arcgis_knn_neighbors: Optional[int] = Field(
        None,
        ge=1,
        le=64,
        description="Deprecated legacy KNN input. Accepted for compatibility and ignored (ring is used).",
    )
    arcgis_export_image: bool = Field(
        True,
        description="Whether to export ArcGIS structure preview image for frontend display",
    )
    arcgis_timeout_sec: int = Field(
        240,
        ge=30,
        le=1800,
        description="ArcGIS bridge timeout in seconds",
    )


class H3AnalysisSummary(BaseModel):
    grid_count: int = Field(0, ge=0)
    poi_count: int = Field(0, ge=0)
    avg_density_poi_per_km2: float = 0.0
    avg_local_entropy: float = 0.0
    global_moran_i_density: Optional[float] = None
    global_moran_z_score: Optional[float] = None
    analysis_engine: Literal["pysal", "arcgis"] = "pysal"
    arcgis_status: Optional[str] = None
    arcgis_image_url: Optional[str] = None
    arcgis_image_url_gi: Optional[str] = None
    arcgis_image_url_lisa: Optional[str] = None
    gi_render_meta: Dict[str, Any] = Field(default_factory=dict)
    lisa_render_meta: Dict[str, Any] = Field(default_factory=dict)
    gi_z_stats: Dict[str, Any] = Field(default_factory=dict)
    lisa_i_stats: Dict[str, Any] = Field(default_factory=dict)


class CategoryDistribution(BaseModel):
    labels: List[str] = Field(default_factory=list)
    values: List[int] = Field(default_factory=list)


class DensityHistogram(BaseModel):
    bins: List[str] = Field(default_factory=list)
    counts: List[int] = Field(default_factory=list)


class H3AnalysisCharts(BaseModel):
    category_distribution: CategoryDistribution
    density_histogram: DensityHistogram


class H3MetricsResponse(BaseModel):
    grid: GridResponse
    summary: H3AnalysisSummary
    charts: H3AnalysisCharts
