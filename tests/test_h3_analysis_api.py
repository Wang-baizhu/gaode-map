import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
os.environ.setdefault("AMAP_JS_API_KEY", "test-key")

from fastapi.testclient import TestClient

from main import app
from modules.gaode_service.utils.transform_posi import wgs84_to_gcj02


def _sample_wgs84_polygon():
    lat = 31.2304
    lon = 121.4737
    d = 0.01
    return [
        [lon - d, lat - d],
        [lon + d, lat - d],
        [lon + d, lat + d],
        [lon - d, lat + d],
        [lon - d, lat - d],
    ]


def _sample_gcj02_polygon():
    return [list(wgs84_to_gcj02(x, y)) for x, y in _sample_wgs84_polygon()]


def _sample_pois_gcj02():
    points_wgs84 = [
        (121.4737, 31.2304, "050000"),
        (121.4742, 31.2306, "060000"),
        (121.4740, 31.2302, "150000"),
    ]
    pois = []
    for idx, (lng, lat, type_code) in enumerate(points_wgs84):
        glng, glat = wgs84_to_gcj02(lng, lat)
        pois.append(
            {
                "id": str(idx + 1),
                "name": f"poi-{idx + 1}",
                "location": [glng, glat],
                "type": type_code,
            }
        )
    return pois


def test_h3_metrics_api_shape():
    client = TestClient(app)
    payload = {
        "polygon": _sample_gcj02_polygon(),
        "resolution": 10,
        "coord_type": "gcj02",
        "include_mode": "intersects",
        "min_overlap_ratio": 0.0,
        "pois": _sample_pois_gcj02(),
        "poi_coord_type": "gcj02",
        "neighbor_ring": 1,
    }
    resp = client.post("/api/v1/analysis/h3-metrics", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert "grid" in data and "summary" in data and "charts" in data
    assert data["grid"]["type"] == "FeatureCollection"
    assert data["summary"]["grid_count"] == len(data["grid"]["features"])


def test_h3_metrics_poi_count_consistency():
    client = TestClient(app)
    payload = {
        "polygon": _sample_gcj02_polygon(),
        "resolution": 10,
        "coord_type": "gcj02",
        "include_mode": "intersects",
        "min_overlap_ratio": 0.0,
        "pois": _sample_pois_gcj02(),
        "poi_coord_type": "gcj02",
        "neighbor_ring": 1,
    }
    resp = client.post("/api/v1/analysis/h3-metrics", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assigned = sum((f.get("properties", {}).get("poi_count") or 0) for f in data["grid"]["features"])
    assert assigned == data["summary"]["poi_count"]


def test_h3_metrics_grid_count_changes_with_threshold():
    client = TestClient(app)
    base_payload = {
        "polygon": _sample_gcj02_polygon(),
        "resolution": 10,
        "coord_type": "gcj02",
        "include_mode": "intersects",
        "pois": _sample_pois_gcj02(),
        "poi_coord_type": "gcj02",
        "neighbor_ring": 1,
    }
    loose = client.post("/api/v1/analysis/h3-metrics", json={**base_payload, "min_overlap_ratio": 0.0})
    strict = client.post("/api/v1/analysis/h3-metrics", json={**base_payload, "min_overlap_ratio": 0.4})
    assert loose.status_code == 200
    assert strict.status_code == 200
    loose_count = loose.json()["summary"]["grid_count"]
    strict_count = strict.json()["summary"]["grid_count"]
    assert strict_count <= loose_count


if __name__ == "__main__":
    test_h3_metrics_api_shape()
    test_h3_metrics_poi_count_consistency()
    test_h3_metrics_grid_count_changes_with_threshold()
    print("H3 analysis API tests passed.")
