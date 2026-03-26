from fastapi import APIRouter

from router.domains import (
    export_router,
    h3_router,
    history_router,
    isochrone_router,
    map_router,
    nightlight_router,
    poi_router,
    population_router,
    road_router,
    system_router,
)

router = APIRouter()
router.include_router(system_router)
router.include_router(map_router)
router.include_router(poi_router)
router.include_router(population_router)
router.include_router(nightlight_router)
router.include_router(export_router)
router.include_router(history_router)
router.include_router(h3_router)
router.include_router(road_router)
router.include_router(isochrone_router)
