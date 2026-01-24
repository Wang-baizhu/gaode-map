"""
数据库连接与初始化。
"""

from __future__ import annotations

import logging
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config import settings
from .models import Base

logger = logging.getLogger(__name__)


def _build_engine():
    """
    构建 SQLAlchemy 引擎并确保数据目录存在。
    """
    db_path = Path(settings.db_path).resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    return create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
        future=True,
    )


engine = _build_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db() -> None:
    """
    创建表结构（幂等）。
    """
    Base.metadata.create_all(bind=engine)
    logger.info("数据库初始化完成: %s", settings.db_path)
