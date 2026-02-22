from typing import List, Optional
from pydantic import BaseModel, Field

class PoiRequest(BaseModel):
    polygon: List[List[float]] = Field(..., description="Polygon (GCJ02) as [[lng, lat], [lng, lat], ...]")
    keywords: str = Field(..., description="Search keywords, e.g. 'KFC|Starbucks'")
    types: str = Field(default="", description="POI Types code, optional")
    max_count: int = Field(default=1000, description="Max number of POIs to return (to prevent abuse)")
    
    # History Context
    save_history: bool = Field(default=False, description="Whether to save the result to history")
    center: Optional[List[float]] = Field(None, description="Center point (GCJ02) [lng, lat]")
    time_min: Optional[int] = Field(None, description="Isochrone time")
    location_name: Optional[str] = Field(None, description="Name of the center location")
    mode: Optional[str] = Field("walking", description="Transport mode: walking, cycling, driving")

class PoiPoint(BaseModel):
    id: str
    name: str
    location: List[float] = Field(..., description="[lng, lat]")
    address: Optional[str] = None
    type: Optional[str] = None
    adname: Optional[str] = None
    lines: Optional[List[str]] = []

class PoiResponse(BaseModel):
    pois: List[PoiPoint]
    count: int


class AoiSampleRequest(BaseModel):
    polygon: List[List[float]] = Field(..., description="Polygon (GCJ02) as [[lng, lat], [lng, lat], ...]")
    spacing_m: int = Field(default=250, ge=30, le=2000, description="Deprecated fallback: approximate sampling spacing in meters")
    h3_resolution: Optional[int] = Field(default=None, ge=7, le=11, description="H3 resolution for AOI sampling; defaults to spacing-based mapping (250m ≈ res=9)")
    max_points: int = Field(default=300, ge=1, le=5000, description="Maximum sampling points")
    regeo_radius: int = Field(default=1000, ge=0, le=3000, description="Regeo radius in meters")


class AoiItem(BaseModel):
    id: str
    name: Optional[str] = None
    adcode: Optional[str] = None
    type: Optional[str] = None
    location: Optional[List[float]] = Field(default=None, description="[lng, lat]")
    area: Optional[float] = None
    min_distance: Optional[float] = None
    hit_count: int = 0
    inside_hits: int = 0


class AoiSampleResponse(BaseModel):
    aois: List[AoiItem]
    sample_points: int
    total_calls: int


class HistorySaveRequest(BaseModel):
    center: List[float] = Field(..., description="Center [lng, lat] (GCJ02)")
    polygon: list = Field(..., description="Polygon coordinates (GCJ02)") # Relaxed type to handle MultiPolygon if needed
    pois: List[dict] = Field(..., description="List of POI objects")
    keywords: str = Field(default="")
    mode: str = Field(default="walking")
    time_min: int = Field(default=15)
    location_name: Optional[str] = Field(None, description="Location name or coordinates for title")
