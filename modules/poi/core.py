import logging
import asyncio
import aiohttp
from typing import List, Dict, Optional
from core.config import settings
import time
import random

logger = logging.getLogger(__name__)

AMAP_POLYGON_URL = "https://restapi.amap.com/v3/place/polygon"

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
        
    logger.info(f"Fetch Complete. Total POIs: {len(all_pois)}")
    
    # 3. No Strict Filtering needed (API handles it mostly, and we trust it for simple use case)
    # Removing Shapely dependency for speed and simplicity in this mode
    return all_pois


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
