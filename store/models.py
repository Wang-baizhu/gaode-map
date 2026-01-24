"""
ORM 模型定义。
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class MapData(Base):
    __tablename__ = "map_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    data = Column(JSON, nullable=False)
    center = Column(JSON, nullable=False)
    center_fingerprint = Column(Text, nullable=False, index=True)
    search_type = Column(String(20), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)


class PolygonData(Base):
    __tablename__ = "polygon_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    coordinates = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class MapPolygonLink(Base):
    __tablename__ = "map_polygon_links"

    id = Column(Integer, primary_key=True, autoincrement=True)
    map_id = Column(Integer, ForeignKey("map_data.id"), nullable=False, index=True)
    polygon_id = Column(Integer, ForeignKey("polygon_data.id"), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("map_id", "polygon_id", name="uq_map_polygon"),
    )
