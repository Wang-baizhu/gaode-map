from fastapi import APIRouter, Query

import modules.history.service as history_service
from modules.poi.schemas import HistorySaveRequest
from modules.providers.amap.utils.transform_posi import gcj02_to_wgs84, wgs84_to_gcj02
from store.history_repo import history_repo

router = APIRouter()


def _sync_history_converters() -> None:
    history_service.gcj02_to_wgs84 = gcj02_to_wgs84
    history_service.wgs84_to_gcj02 = wgs84_to_gcj02


@router.post("/api/v1/analysis/history/save")
async def save_history_manually(payload: HistorySaveRequest):
    _sync_history_converters()
    return history_service.save_history_request(payload, history_repo)


@router.get("/api/v1/analysis/history")
async def get_history_list(limit: int = Query(0, ge=0)):
    _sync_history_converters()
    return history_service.get_history_list_payload(limit, history_repo)


@router.get("/api/v1/analysis/history/{id}/pois")
async def get_history_pois(id: int):
    _sync_history_converters()
    return history_service.get_history_pois_payload(id, history_repo)


@router.get("/api/v1/analysis/history/{id}")
async def get_history_detail(id: int, include_pois: bool = Query(True)):
    _sync_history_converters()
    return history_service.get_history_detail_payload(id, include_pois, history_repo)


@router.delete("/api/v1/analysis/history/{id}")
async def delete_history(id: int):
    _sync_history_converters()
    return history_service.delete_history_record(id, history_repo)
