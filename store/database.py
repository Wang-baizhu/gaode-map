"""
数据库连接与初始化。
"""

from __future__ import annotations

import logging
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

from core.config import settings
from .models import Base

logger = logging.getLogger(__name__)


def _sqlite_uri() -> str:
    return f"sqlite:///{settings.db_path}"


def _build_engine(db_uri: str | None = None):
    """
    构建 SQLAlchemy 引擎并确保数据目录存在。
    """
    effective_db_uri = db_uri or settings.sqlalchemy_database_uri
    connect_args = {}
    if "sqlite" in effective_db_uri:
        db_path = Path(settings.db_path).resolve()
        db_path.parent.mkdir(parents=True, exist_ok=True)
        connect_args = {"check_same_thread": False}

    return create_engine(
        effective_db_uri,
        connect_args=connect_args,
        future=True,
        pool_pre_ping=True,  # Auto-reconnect
        pool_recycle=3600,
    )


engine = _build_engine()
SessionLocal = sessionmaker(autoflush=False, autocommit=False, future=True)
SessionLocal.configure(bind=engine)


def _rebind_engine(next_engine) -> None:
    global engine
    engine = next_engine
    SessionLocal.configure(bind=engine)


def _fallback_to_sqlite(exc: Exception) -> None:
    sqlite_engine = _build_engine(_sqlite_uri())
    _rebind_engine(sqlite_engine)
    logger.warning(
        "外部数据库初始化失败，已回退到本地 SQLite: %s: %s",
        exc.__class__.__name__,
        exc,
    )


def init_db() -> None:
    """
    创建表结构（幂等）。
    """
    try:
        Base.metadata.create_all(bind=engine)
    except SQLAlchemyError as exc:
        current_uri = settings.sqlalchemy_database_uri
        if "sqlite" in current_uri:
            raise
        _fallback_to_sqlite(exc)
        Base.metadata.create_all(bind=engine)
    logger.info("数据库初始化完成: %s", settings.db_path)
