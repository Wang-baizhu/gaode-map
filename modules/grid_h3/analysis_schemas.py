from typing import List, Literal, Optional
from pydantic import BaseModel, Field

from .schemas import GridResponse


class PoiLike(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    location: List[float] = Field(..., min_length=2, max_length=2, description="[lng, lat]")
    type: Optional[str] = None


class H3MetricsRequest(BaseModel):
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
    moran_permutations: int = Field(
        4999,
        ge=0,
        le=5000,
        description="Permutation count for Moran significance test (0 disables p-value)",
    )
    significance_alpha: float = Field(
        0.05,
        ge=0.001,
        le=0.2,
        description="Significance threshold for Moran p-value",
    )
    moran_seed: Optional[int] = Field(
        42,
        description="Random seed for Moran permutation test",
    )
    significance_fdr: bool = Field(
        False,
        description="Whether to use Benjamini-Hochberg FDR correction for local significance",
    )


class H3AnalysisSummary(BaseModel):
    grid_count: int = Field(0, ge=0)
    poi_count: int = Field(0, ge=0)
    avg_density_poi_per_km2: float = 0.0
    avg_local_entropy: float = 0.0
    global_moran_i_density: Optional[float] = None
    global_moran_z_score: Optional[float] = None
    global_moran_p_value: Optional[float] = None
    global_moran_significant: Optional[bool] = None
    significant_cell_count: int = Field(0, ge=0)
    hotspot_cell_count: int = Field(0, ge=0)
    coldspot_cell_count: int = Field(0, ge=0)


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
