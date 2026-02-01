from typing import List, Optional
from pydantic import BaseModel, Field

class PoiRequest(BaseModel):
    polygon: List[List[float]] = Field(..., description="Polygon as [[lng, lat], [lng, lat], ...]")
    keywords: str = Field(..., description="Search keywords, e.g. 'KFC|Starbucks'")
    types: str = Field(default="", description="POI Types code, optional")
    max_count: int = Field(default=1000, description="Max number of POIs to return (to prevent abuse)")
    
    # History Context
    save_history: bool = Field(default=False, description="Whether to save the result to history")
    center: Optional[List[float]] = Field(None, description="Center point [lng, lat]")
    time_min: Optional[int] = Field(None, description="Isochrone time")
    location_name: Optional[str] = Field(None, description="Name of the center location")

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
