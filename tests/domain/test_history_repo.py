from pathlib import Path
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(str(Path(__file__).resolve().parents[2]))

import store.history_repo as history_repo_module
from store.history_repo import HistoryRepo
from store.models import AnalysisHistory, Base, PoiResult


def test_get_list_extracts_only_sidebar_params_from_sqlite(monkeypatch):
    engine = create_engine("sqlite:///:memory:", future=True)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        session.add(
            AnalysisHistory(
                description="长沙步行15分钟",
                params={
                    "center": [112.9388, 28.2282],
                    "time_min": 15,
                    "keywords": "咖啡店",
                    "mode": "walking",
                    "source": "local",
                    "h3_result": {
                        "grid": {
                            "type": "FeatureCollection",
                            "features": [{"type": "Feature", "properties": {"n": i}} for i in range(64)],
                        }
                    },
                    "road_result": {
                        "roads": {
                            "type": "FeatureCollection",
                            "features": [{"type": "Feature", "properties": {"n": i}} for i in range(64)],
                        }
                    },
                },
                result_polygon=[[112.9, 28.2], [113.0, 28.3], [112.9, 28.2]],
            )
        )
        session.commit()
    finally:
        session.close()

    monkeypatch.setattr(history_repo_module, "SessionLocal", TestingSessionLocal)
    repo = HistoryRepo()

    records = repo.get_list()

    assert len(records) == 1
    assert records[0]["description"] == "长沙步行15分钟"
    assert records[0]["params"] == {
        "center": [112.9388, 28.2282],
        "time_min": 15,
        "keywords": "咖啡店",
        "mode": "walking",
        "source": "local",
    }


def test_get_list_dedupes_using_lightweight_sidebar_fields(monkeypatch):
    engine = create_engine("sqlite:///:memory:", future=True)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        session.add_all(
            [
                AnalysisHistory(
                    description="同一分析",
                    params={
                        "center": [112.9, 28.2],
                        "time_min": 15,
                        "keywords": "咖啡店",
                        "mode": "walking",
                        "source": "local",
                        "h3_result": {"grid": {"features": [{"id": 1}]}},
                    },
                ),
                AnalysisHistory(
                    description="同一分析",
                    params={
                        "center": [112.9, 28.2],
                        "time_min": 15,
                        "keywords": "咖啡店",
                        "mode": "walking",
                        "source": "local",
                        "road_result": {"roads": {"features": [{"id": 2}, {"id": 3}]}},
                    },
                ),
            ]
        )
        session.commit()
    finally:
        session.close()

    monkeypatch.setattr(history_repo_module, "SessionLocal", TestingSessionLocal)
    repo = HistoryRepo()

    records = repo.get_list()

    assert len(records) == 1
