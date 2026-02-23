import logging
import asyncio
import aiohttp
from typing import List, Dict, Optional, Tuple
from core.config import settings
import time
import random
import math
import re
import unicodedata
import h3

from shapely.geometry import Point, Polygon, mapping
from modules.gaode_service.utils.transform_posi import gcj02_to_wgs84, wgs84_to_gcj02

logger = logging.getLogger(__name__)

AMAP_POLYGON_URL = "https://restapi.amap.com/v3/place/polygon"
AMAP_REGEO_URL = "https://restapi.amap.com/v3/geocode/regeo"
PARKING_TYPE_PREFIX = "1509"
POI_DEDUP_GRID_SIZE_M = 120.0
POI_DEDUP_DISTANCE_M = 90.0
POI_DEDUP_LOC_PRECISION = 6
POI_ENTRY_EXIT_SUFFIX_RE = re.compile(
    r"(停车场)?(出入口|入口|出口|东门|西门|南门|北门|[A-Za-z]口|[0-9]+号口)$"
)

class KeyManager:
    """Manages multiple API keys with rotation and exhaustion tracking"""
    def __init__(self, key_string: str):
        self.keys = [k.strip() for k in key_string.split(",") if k.strip()]
        self.current_index = 0
        self.exhausted_indices = set()
        self.lock = asyncio.Lock()
        logger.info(f"KeyManager initialized with {len(self.keys)} keys.")

    def get_current_key(self) -> Optional[str]:
        if len(self.exhausted_indices) >= len(self.keys):
            return None
        start_index = self.current_index
        while self.current_index in self.exhausted_indices:
            self.current_index = (self.current_index + 1) % len(self.keys)
            if self.current_index == start_index: return None
        return self.keys[self.current_index]

    async def report_limit_reached(self):
        async with self.lock:
            if len(self.exhausted_indices) >= len(self.keys): return
            logger.warning(f"Key {self.keys[self.current_index][:6]}... exhausted. Rotating.")
            self.exhausted_indices.add(self.current_index)
            self.current_index = (self.current_index + 1) % len(self.keys)
    
    def rotate(self):
        self.current_index = (self.current_index + 1) % len(self.keys)

class RateLimiter:
    """Token bucket rate limiter + Global smart backoff"""
    def __init__(self, calls_per_second=20):
        self.rate = calls_per_second
        self.tokens = calls_per_second
        self.last_update = time.monotonic()
        self.lock = asyncio.Lock()
        self._backoff_until = 0.0

    async def acquire(self):
        async with self.lock:
            # Check global backoff
            now = time.monotonic()
            if self._backoff_until > now:
                await asyncio.sleep(self._backoff_until - now)
                now = time.monotonic()

            # Refill tokens
            elapsed = now - self.last_update
            self.tokens = min(self.rate, self.tokens + elapsed * self.rate)
            self.last_update = now

            if self.tokens < 1:
                wait_time = (1 - self.tokens) / self.rate
                await asyncio.sleep(wait_time)
                self.tokens = 0
                self.last_update = time.monotonic()
            
            self.tokens -= 1

    async def trigger_backoff(self, seconds=5.0):
        """Pause all requests for `seconds`"""
        async with self.lock:
            # Only extend if not already backed off further
            target = time.monotonic() + seconds
            if target > self._backoff_until:
                self._backoff_until = target
                logger.warning(f"Global Rate Limit Triggered! Pausing all requests for {seconds}s")

# Global rate limiter to stay within AMap QPS limits across parallel requests
global_limiter = RateLimiter(calls_per_second=20)

async def fetch_pois_by_polygon(
    polygon: List[List[float]],
    keywords: str,
    types: str = "",
    max_count: int = 1000
) -> List[Dict]:
    """
    Fetch POIs using Single Polygon Search (Simplified).
    
    Strategy:
    1. Direct Polygon Search (No H3 Grid).
    2. Support Key Rotation.
    3. Pagination up to ~900 results (AMap limit).
    """
    
    # Api Key Check
    # Support multiple keys
    raw_keys = settings.amap_web_service_key
    if not raw_keys:
        raise ValueError("AMap Web Service Key is missing in settings")
    
    key_manager = KeyManager(raw_keys)

    # 1. Geometry - Validate only
    if not polygon or len(polygon) < 3:
        # Simple validation
        logger.error("Invalid polygon input")
        return []

    logger.info(
        "POI polygon input: points=%s first=%s last=%s",
        len(polygon),
        polygon[0] if polygon else None,
        polygon[-1] if polygon else None,
    )

    # 2. Execution
    async with aiohttp.ClientSession() as session:
        # Check Count First (Page 1)
        count, first_page_pois = await _fetch_amap_page_one(polygon, keywords, types, key_manager, global_limiter, session)
        logger.info(f"Polygon Search: Found {count} results total (Page 1 fetched {len(first_page_pois)}).")

        all_pois = list(first_page_pois)

        # Fetch remaining pages if needed
        if count > len(all_pois):
            remaining = await _fetch_remaining_pages(
                polygon,
                keywords,
                types,
                key_manager,
                count,
                global_limiter,
                session,
            )
            all_pois.extend(remaining)
        
    before_dedup = len(all_pois)
    all_pois = _dedupe_polygon_pois(all_pois)
    after_dedup = len(all_pois)
    logger.info(
        "Fetch Complete. Total POIs: %s (dedup removed=%s)",
        after_dedup,
        max(0, before_dedup - after_dedup),
    )
    return all_pois


def _safe_float(value: Optional[str]) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_lnglat(location: str) -> Optional[List[float]]:
    if not location:
        return None
    try:
        lng_str, lat_str = (str(location).split(",") + ["", ""])[:2]
        return [float(lng_str), float(lat_str)]
    except (TypeError, ValueError):
        return None


def _build_sample_points(
    polygon: List[List[float]],
    spacing_m: int,
    max_points: int,
) -> List[List[float]]:
    """
    Build staggered sampling points inside polygon.
    Uses an approximate hex-like lattice in GCJ02 lng/lat degrees.
    """
    poly = Polygon(polygon)
    if not poly.is_valid:
        poly = poly.buffer(0)
    if poly.is_empty:
        return []

    # Tiny polygon fallback
    if poly.area <= 1e-12:
        rp = poly.representative_point()
        return [[rp.x, rp.y]]

    minx, miny, maxx, maxy = poly.bounds
    mean_lat = (miny + maxy) / 2.0
    cos_lat = max(0.2, abs(math.cos(math.radians(mean_lat))))

    # Degree step approximation in GCJ02.
    dlat = max(1e-6, spacing_m / 111_320.0)
    dlng = max(1e-6, spacing_m / (111_320.0 * cos_lat))
    y_step = dlat * 0.8660254037844386  # sqrt(3)/2

    points: List[List[float]] = []
    y = miny
    row = 0

    while y <= maxy and len(points) < max_points:
        x = minx + (dlng * 0.5 if row % 2 else 0.0)
        while x <= maxx and len(points) < max_points:
            pt = Point(x, y)
            if poly.contains(pt) or poly.touches(pt):
                points.append([x, y])
            x += dlng
        y += y_step
        row += 1

    # Ensure at least one point exists.
    if not points:
        rp = poly.representative_point()
        points.append([rp.x, rp.y])

    # Ensure centroid-like point is included for stability.
    rp = poly.representative_point()
    rp_xy = [rp.x, rp.y]
    if len(points) < max_points:
        exists = any(abs(p[0] - rp_xy[0]) < 1e-9 and abs(p[1] - rp_xy[1]) < 1e-9 for p in points)
        if not exists:
            points.append(rp_xy)

    return points[:max_points]


def _spacing_to_h3_resolution(spacing_m: int) -> int:
    """
    Backward-compatible mapping:
    old spacing controls approximate H3 density if caller does not pass h3_resolution.
    """
    s = max(30, int(spacing_m or 250))
    if s <= 180:
        return 10
    if s <= 360:
        return 9
    if s <= 700:
        return 8
    return 7


def _h3_cell_center_gcj02(h3_index: str) -> Optional[List[float]]:
    """Convert one H3 cell center (WGS84) to GCJ02 [lng, lat]."""
    try:
        if hasattr(h3, "cell_to_latlng"):
            lat, lng = h3.cell_to_latlng(h3_index)
        elif hasattr(h3, "h3_to_geo"):
            lat, lng = h3.h3_to_geo(h3_index)
        else:
            return None
        gx, gy = wgs84_to_gcj02(float(lng), float(lat))
        return [gx, gy]
    except Exception:
        return None


def _pick_stable_subset(items: List[str], max_count: int) -> List[str]:
    """Deterministic down-sampling to keep request count bounded."""
    if max_count <= 0:
        return []
    if len(items) <= max_count:
        return items
    if max_count == 1:
        return [items[0]]

    last = len(items) - 1
    indices = {
        int(round((i * last) / (max_count - 1)))
        for i in range(max_count)
    }
    return [items[i] for i in sorted(indices)]


def _build_h3_sample_points(
    polygon: List[List[float]],
    h3_resolution: int,
    max_points: int,
) -> List[List[float]]:
    """
    Build sample points from H3 cells:
    1) polyfill (intersects) over polygon
    2) sample by each cell center in GCJ02
    """
    # Build a WGS84 polygon for H3 polyfill.
    wgs_ring: List[List[float]] = []
    for pt in polygon or []:
        if not isinstance(pt, (list, tuple)) or len(pt) < 2:
            continue
        try:
            lng = float(pt[0])
            lat = float(pt[1])
        except (TypeError, ValueError):
            continue
        wx, wy = gcj02_to_wgs84(lng, lat)
        wgs_ring.append([wx, wy])

    if len(wgs_ring) < 3:
        return []
    if wgs_ring[0] != wgs_ring[-1]:
        wgs_ring.append(wgs_ring[0])

    wgs_poly = Polygon(wgs_ring)
    if not wgs_poly.is_valid:
        wgs_poly = wgs_poly.buffer(0)
    if wgs_poly.is_empty:
        return []

    geo_json = mapping(wgs_poly)
    try:
        if hasattr(h3, "geo_to_cells"):
            cells = h3.geo_to_cells(geo_json, h3_resolution)
        else:
            cells = h3.polyfill(geo_json, h3_resolution, geo_json_conformant=True)
    except Exception:
        return []

    cell_ids = sorted(str(cid) for cid in (cells or []) if cid)
    if not cell_ids:
        return []

    selected = _pick_stable_subset(cell_ids, max_points)
    points: List[List[float]] = []
    for cid in selected:
        pt = _h3_cell_center_gcj02(cid)
        if pt:
            points.append(pt)
    return points


async def _fetch_regeo_aois(
    lng: float,
    lat: float,
    key_manager: KeyManager,
    limiter: RateLimiter,
    session: aiohttp.ClientSession,
    radius: int,
) -> List[Dict]:
    """Fetch aois from regeo endpoint for one point."""
    for _ in range(len(key_manager.keys) + 1):
        current_key = key_manager.get_current_key()
        if not current_key:
            return []

        params = {
            "key": current_key,
            "location": f"{lng:.6f},{lat:.6f}",
            "extensions": "all",
            "radius": int(radius),
            "output": "json",
        }

        for _retry in range(3):
            await limiter.acquire()
            try:
                async with session.get(AMAP_REGEO_URL, params=params, timeout=5) as resp:
                    if resp.status != 200:
                        await asyncio.sleep(0.15)
                        continue

                    data = await resp.json()
                    status = str(data.get("status") or "")
                    infocode = str(data.get("infocode") or "")

                    if status == "1":
                        key_manager.rotate()
                        return ((data.get("regeocode") or {}).get("aois") or [])

                    if infocode == "10003":
                        await limiter.trigger_backoff(1.5 + random.random())
                        continue

                    if infocode == "10044":
                        await key_manager.report_limit_reached()
                        break

                    return []
            except Exception:
                await asyncio.sleep(0.15)

    return []


async def fetch_aois_by_polygon_sampling(
    polygon: List[List[float]],
    spacing_m: int = 250,
    max_points: int = 300,
    regeo_radius: int = 1000,
    h3_resolution: Optional[int] = None,
) -> Dict:
    """
    Sample polygon area and aggregate AOIs by id.

    Notes:
    - This is a "best effort" coverage strategy, not mathematical full AOI enumeration.
    - Calls regeo once per sample point.
    """
    raw_keys = settings.amap_web_service_key
    if not raw_keys:
        raise ValueError("AMap Web Service Key is missing in settings")

    if not polygon or len(polygon) < 3:
        raise ValueError("Invalid polygon input")

    capped_points = max(1, int(max_points))
    resolution = int(h3_resolution) if h3_resolution is not None else _spacing_to_h3_resolution(spacing_m)
    resolution = max(7, min(11, resolution))

    # H3-first sampling path.
    sample_points = _build_h3_sample_points(
        polygon=polygon,
        h3_resolution=resolution,
        max_points=capped_points,
    )
    # Safety fallback to legacy lattice if H3 path yields nothing.
    if not sample_points:
        sample_points = _build_sample_points(
            polygon=polygon,
            spacing_m=max(30, int(spacing_m)),
            max_points=capped_points,
        )
    if not sample_points:
        return {"aois": [], "sample_points": 0, "total_calls": 0}

    key_manager = KeyManager(raw_keys)
    limiter = RateLimiter(calls_per_second=8)

    agg: Dict[str, Dict] = {}
    total_calls = 0

    async with aiohttp.ClientSession() as session:
        for pt in sample_points:
            lng, lat = pt
            aois = await _fetch_regeo_aois(
                lng=lng,
                lat=lat,
                key_manager=key_manager,
                limiter=limiter,
                session=session,
                radius=max(0, min(3000, int(regeo_radius))),
            )
            total_calls += 1

            for aoi in aois:
                aoi_id = str(aoi.get("id") or "").strip()
                if not aoi_id:
                    continue

                distance = _safe_float(aoi.get("distance"))
                center = _parse_lnglat(str(aoi.get("location") or ""))

                if aoi_id not in agg:
                    agg[aoi_id] = {
                        "id": aoi_id,
                        "name": str(aoi.get("name") or ""),
                        "adcode": str(aoi.get("adcode") or ""),
                        "type": str(aoi.get("type") or ""),
                        "location": center,
                        "area": _safe_float(aoi.get("area")),
                        "min_distance": distance,
                        "hit_count": 0,
                        "inside_hits": 0,
                    }

                item = agg[aoi_id]
                item["hit_count"] += 1
                if distance == 0:
                    item["inside_hits"] += 1
                if distance is not None and (
                    item.get("min_distance") is None or distance < item["min_distance"]
                ):
                    item["min_distance"] = distance
                if not item.get("location") and center:
                    item["location"] = center

    aois = sorted(
        agg.values(),
        key=lambda x: (
            -int(x.get("inside_hits") or 0),
            -int(x.get("hit_count") or 0),
            float(x.get("min_distance") or 9e15),
            str(x.get("id") or ""),
        ),
    )

    return {
        "aois": aois,
        "sample_points": len(sample_points),
        "total_calls": total_calls,
    }


async def _fetch_amap_page_one(polygon, keywords, types, key_manager, limiter, session):
    """Fetch page 1 to get total count and first batch"""
    poly_str = ";".join([f"{p[0]:.6f},{p[1]:.6f}" for p in polygon])
    
    # Retry loop for key rotation
    for key_attempt in range(len(key_manager.keys) + 1):
        current_key = key_manager.get_current_key()
        if not current_key:
             logger.error("All API keys exhausted!")
             return 0, []

        params = {
            "key": current_key, "polygon": poly_str, "keywords": keywords, "types": types,
            "offset": 25, "page": 1, "extensions": "base"
        }

        # Request loop (network retries)
        for attempt in range(3):
            await limiter.acquire()
            try:
                async with session.get(AMAP_POLYGON_URL, params=params, timeout=5) as resp:
                    if resp.status != 200:
                        logger.warning(f"HTTP {resp.status}")
                        continue
                    
                    data = await resp.json()
                    status = data.get("status")
                    
                    if status == "1":
                        count = int(data.get("count", 0))
                        pois = _normalize_pois(data.get("pois", []))
                        key_manager.rotate() # Success, rotate for load balancing
                        return count, pois
                    elif status == "0" and data.get("infocode") == "10003":
                        # QPS Limit
                        await limiter.trigger_backoff(2.0 + random.random())
                        continue # Retry same key
                    elif status == "0" and data.get("infocode") == "10044":
                        # DAILY LIMIT - Switch Key!
                        logger.warning(f"Daily limit reached for key {current_key[:6]}... Switching...")
                        await key_manager.report_limit_reached()
                        break # Break retry loop to outer key loop
                    else:
                        logger.warning(f"Key {current_key[:6]}... Error: status={status}, info={data.get('info')}, infocode={data.get('infocode')}")
                        # If invalid key (10001), maybe also switch? keeping simple for now
                        return 0, []
            except Exception as e:
                logger.warning(f"Fetch page 1 error: {e}")
                await asyncio.sleep(0.5)
        else:
            # If we exhausted attempts without switching keys (e.g. network error), return
            # But if we broke out due to 10044, we continue to next key
            pass

    return 0, []

async def _fetch_remaining_pages(
    polygon,
    keywords,
    types,
    key_manager,
    total_count,
    limiter,
    session,
):
    """Fetch pages 2..N"""
    poly_str = ";".join([f"{p[0]:.6f},{p[1]:.6f}" for p in polygon])
    all_pois = []
    page_size = 25
    max_pages = (min(total_count, 900) // page_size) + 1
    
    # Start from page 2
    for page in range(2, max_pages + 1):
        # Key Rotation Loop for EACH page
        success = False
        for key_attempt in range(len(key_manager.keys) + 1):
            current_key = key_manager.get_current_key()
            if not current_key: break

            params = {
                "key": current_key, "polygon": poly_str, "keywords": keywords, "types": types,
                "offset": page_size, "page": page, "extensions": "base"
            }
            
            # Network Attempt Loop
            for attempt in range(3):
                await limiter.acquire()
                try:
                    async with session.get(AMAP_POLYGON_URL, params=params, timeout=5) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            if data.get("status") == "1":
                                pois = _normalize_pois(data.get("pois", []))
                                key_manager.rotate()
                                if not pois: 
                                    success = True; break
                                all_pois.extend(pois)
                                success = True
                                break
                            elif data.get("infocode") == "10003":
                                await limiter.trigger_backoff(2.0)
                            elif data.get("infocode") == "10044":
                                 logger.warning(f"Daily limit (page fetch) for key {current_key[:6]}... Switching...")
                                 await key_manager.report_limit_reached()
                                 break # Break network loop, retry with new key
                except:
                    pass
            
            if success: break # Page fetched, move to next page
        
        if not success:
            logger.warning(f"Failed to fetch page {page}")
            break
            
    return all_pois

def _normalize_pois(raw_list: List[Dict]) -> List[Dict]:
    results = []
    for p in raw_list:
        try:
            loc_str = p.get("location")
            if not loc_str or isinstance(loc_str, list): continue
            lng, lat = map(float, loc_str.split(","))
            
            p_type = p.get("typecode") or p.get("type") or ""
            if isinstance(p_type, list): p_type = str(p_type[0])
            
            address = p.get("address")
            if isinstance(address, list): address = str(address[0]) if address else ""
            if address is None: address = ""
            
            # Simple lines extraction
            lines = []
            if "路" in str(address) or "线" in str(address):
                lines = [address] 
            
            results.append({
                "id": str(p.get("id", "")),
                "name": str(p.get("name", "未命名")),
                "location": [lng, lat],
                "address": str(address),
                "type": str(p_type),
                "adname": str(p.get("adname", "")),
                "lines": lines
            })
        except:
            continue
    return results


def _dedupe_polygon_pois(pois: List[Dict]) -> List[Dict]:
    """
    Two-stage dedupe for polygon POI results:
    1) exact dedupe: id or (normalized name + rounded location)
    2) semantic-spatial dedupe for parking entry/exit variants
    """
    if not pois:
        return []

    exact_seen = set()
    exact_deduped: List[Dict] = []
    for poi in pois:
        key = _build_poi_exact_key(poi)
        if key in exact_seen:
            continue
        exact_seen.add(key)
        exact_deduped.append(poi)

    cell_size_deg = POI_DEDUP_GRID_SIZE_M / 111_000.0
    parking_bucket: Dict[Tuple[int, int], List[Dict]] = {}
    kept: List[Dict] = []

    for poi in exact_deduped:
        if not _is_parking_like_poi(poi):
            kept.append(poi)
            continue

        coords = _extract_poi_location(poi)
        if not coords:
            kept.append(poi)
            continue

        canonical_name = _canonical_parking_name(str(poi.get("name") or ""))
        if not canonical_name:
            kept.append(poi)
            continue

        cell_x = int(math.floor(coords[0] / cell_size_deg))
        cell_y = int(math.floor(coords[1] / cell_size_deg))
        is_duplicate = False

        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                neighbors = parking_bucket.get((cell_x + dx, cell_y + dy), [])
                for other in neighbors:
                    if other.get("canonical_name") != canonical_name:
                        continue
                    other_coords = other.get("coords")
                    if not other_coords:
                        continue
                    if _haversine_m(coords, other_coords) <= POI_DEDUP_DISTANCE_M:
                        is_duplicate = True
                        break
                if is_duplicate:
                    break
            if is_duplicate:
                break

        if is_duplicate:
            continue

        kept.append(poi)
        parking_bucket.setdefault((cell_x, cell_y), []).append(
            {"canonical_name": canonical_name, "coords": coords}
        )

    return kept


def _build_poi_exact_key(poi: Dict) -> str:
    poi_id = str(poi.get("id") or "").strip()
    if poi_id:
        return f"id:{poi_id}"

    name = _normalize_text(str(poi.get("name") or ""))
    coords = _extract_poi_location(poi)
    if coords:
        return "name_loc:{name}|{lng:.{p}f},{lat:.{p}f}".format(
            name=name,
            lng=coords[0],
            lat=coords[1],
            p=POI_DEDUP_LOC_PRECISION,
        )
    return f"name_only:{name}"


def _normalize_text(text: str) -> str:
    value = unicodedata.normalize("NFKC", str(text or ""))
    value = re.sub(r"\s+", "", value)
    return value.strip()


def _extract_poi_location(poi: Dict) -> Optional[Tuple[float, float]]:
    raw = poi.get("location")
    if isinstance(raw, (list, tuple)) and len(raw) >= 2:
        try:
            return float(raw[0]), float(raw[1])
        except (TypeError, ValueError):
            return None
    if isinstance(raw, str):
        parts = raw.split(",")
        if len(parts) < 2:
            return None
        try:
            return float(parts[0]), float(parts[1])
        except (TypeError, ValueError):
            return None
    return None


def _is_parking_like_poi(poi: Dict) -> bool:
    raw_type = str(poi.get("type") or poi.get("typecode") or "").strip()
    type_digits = re.sub(r"\D", "", raw_type)
    if type_digits.startswith(PARKING_TYPE_PREFIX):
        return True
    name = str(poi.get("name") or "")
    return "停车" in name


def _canonical_parking_name(name: str) -> str:
    if not name:
        return ""
    value = _normalize_text(name)
    value = POI_ENTRY_EXIT_SUFFIX_RE.sub("", value)
    value = value.replace("停车场出入口", "停车场")
    value = value.replace("停车场入口", "停车场")
    value = value.replace("停车场出口", "停车场")
    return value.strip("-_")


def _haversine_m(
    a: Tuple[float, float],
    b: Tuple[float, float],
) -> float:
    lng1, lat1 = a
    lng2, lat2 = b
    lng1, lat1, lng2, lat2 = map(math.radians, (lng1, lat1, lng2, lat2))
    dlng = lng2 - lng1
    dlat = lat2 - lat1
    x = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    )
    return 2 * 6_371_000.0 * math.asin(math.sqrt(x))
