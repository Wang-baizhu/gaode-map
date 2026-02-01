import logging
import asyncio
import aiohttp
from typing import List, Dict, Optional, Tuple
from config import settings

logger = logging.getLogger(__name__)

AMAP_POLYGON_URL = "https://restapi.amap.com/v3/place/polygon"

async def fetch_pois_by_polygon(
    polygon: List[List[float]],
    keywords: str,
    types: str = "",
    max_count: int = 1000
) -> List[Dict]:
    """
    Fetch POIs within a polygon using AMap Web Service API (v3).
    Supports pagination.
    
    Args:
        polygon: List of [lng, lat] (GCJ02)
        keywords: Search text
        types: POI type codes
        max_count: Safety limit to prevent infinite loops or huge data
    """
    
    # 1. Prepare Polygon String: "lon,lat|lon,lat|..."
    # AMap limits: usually allows fairly complex polygons, but let's check length.
    # If polygon is huge, we might hit GET request URL limit. AMap suggests POST? 
    # API docs for v3 usually use GET. Let's try GET first.
    
    poly_str = "|".join([f"{p[0]:.6f},{p[1]:.6f}" for p in polygon])
    
    # Api Key
    key = settings.amap_web_service_key
    if not key:
        raise ValueError("AMap Web Service Key is missing in settings")

    all_pois = []
    page = 1
    page_size = 25 # AMap limit
    
    async with aiohttp.ClientSession() as session:
        while True:
            params = {
                "key": key,
                "polygon": poly_str,
                "keywords": keywords,
                "types": types,
                "offset": page_size,
                "page": page,
                "extensions": "all" # Request full info to ensure address/lines are present
            }
            
            try:
                # logger.info(f"Fetching POIs Page {page}...")
                async with session.get(AMAP_POLYGON_URL, params=params, timeout=10) as resp:
                    if resp.status != 200:
                        logger.error(f"AMap Request Failed: {resp.status}")
                        break
                    
                    data = await resp.json()
                    logger.info(f"AMap Response (Page {page}): Status={data.get('status')}, Count={data.get('count')}, Pois={len(data.get('pois', []))}")
                    
                    if data.get("status") != "1":
                        logger.warning(f"AMap API Error: {data.get('info')} - {data.get('infocode')}")
                        break
                        
                    pois = data.get("pois", [])
                    if not pois:
                        break
                        
                    all_pois.extend(pois)
                    
                    # Manual breaking if valid count reached or max_limit
                    if len(all_pois) >= max_count:
                        all_pois = all_pois[:max_count]
                        break
                    
                    # AMap max page limit is usually 100 pages * 20 records = 2000 
                    # Checking if we got full page
                    if len(pois) < page_size:
                        break
                        
                    page += 1
                    
            except Exception as e:
                logger.error(f"Error fetching POIs page {page}: {e}")
                break
                
    # Normalize result
    results = []
    for p in all_pois:
        try:
            # 1. Location
            loc_str = p.get("location")
            if not loc_str or isinstance(loc_str, list):
                continue
            lng, lat = map(float, loc_str.split(","))
            
            # 2. Address (Handle [""] or [] cases)
            address = p.get("address")
            if isinstance(address, list):
                if address: 
                    address = str(address[0])
                else: 
                    address = ""
            elif address is None:
                address = ""
            else:
                address = str(address)

            # 3. Type (Prefer 'typecode', fallback to 'type')
            p_type = p.get("typecode")
            if not p_type or isinstance(p_type, list):
                 # Fallback to type field which might be text but sometimes code
                 p_type = p.get("type")

            if isinstance(p_type, list):
                p_type = str(p_type[0]) if p_type else ""
            elif p_type is None:
                p_type = ""
            else:
                p_type = str(p_type)

            # 4. Adname
            adname = p.get("adname")
            if isinstance(adname, list):
                 adname = str(adname[0]) if adname else ""
            elif adname is None:
                 adname = ""
            else:
                 adname = str(adname)

            # 5. Handle Bus Lines (often trapped in address field for transport POIs)
            lines = []
            
            # Helper to detect if strict bus patterns exist (e.g. "112路", "隧道八线")
            import re
            def is_likely_route(text):
                # Matches "112路", "112区间", "隧道x线", etc.
                if re.search(r'\d+路|专线|[A-Z0-9]+线', text): return True
                return False

            is_bus_explicit = p_type.startswith("1507") or "公交" in p_type or "公交" in p.get("name", "")
            is_subway = p_type.startswith("1505") or "地铁" in p_type or "轨交" in p_type
            is_transport_generic = p_type.startswith("15") or "交通" in p_type

            if address:
                 should_parse = False
                 
                 # Case A: Explicit Bus Station/Subway -> Trust '路'/'线' keywords more
                 if is_bus_explicit:
                     if "路" in address or "线" in address or "班" in address: should_parse = True
                 elif is_subway:
                     if "线" in address: should_parse = True
                 
                 # Case B: Generic Transport -> Be careful, avoid "Road" addresses
                 elif is_transport_generic:
                     # Only parse if it strictly looks like a route list
                     if is_likely_route(address) and (";" in address or "," in address or "路" in address):
                         should_parse = True
                     # Special case: single bus route "129路" in generic transport
                     if "路" in address and len(address) < 10 and re.search(r'\d+路', address):
                         should_parse = True

                 if should_parse:
                      # Normalize separators
                      normalized_addr = address.replace(";", ",").replace("；", ",")
                      extracted = [l.strip() for l in normalized_addr.split(",") if l.strip()]
                      
                      # Filter out things that look like pure addresses even in split results?
                      # For now just trust the flag
                      lines = extracted
                      
                      if lines:
                          address = "" # Only clear address if we successfully extracted lines


            results.append({
                "id": str(p.get("id", "")),
                "name": str(p.get("name", "未命名")),
                "location": [lng, lat],
                "address": address,
                "type": p_type,
                "adname": adname,
                "lines": lines
            })
        except Exception as e:
            logger.warning(f"Skipping malformed POI record: {p.get('id')} - {e}")
            continue
            
    # Post-processing: Strict Geometric Filtering
    from shapely.geometry import Point, Polygon
    
    try:
        # Construct Shapely Polygon from the input list
        # polygon input is [[lng, lat], ...]
        if polygon and len(polygon) >= 3:
            strict_poly = Polygon(polygon)
            
            # Filter results
            strict_results = []
            for item in results:
                # item['location'] is [lng, lat]
                pt = Point(item['location'])
                if strict_poly.contains(pt) or strict_poly.touches(pt):
                     strict_results.append(item)
                else:
                     logger.debug(f"Filtered out POI outside boundary: {item['name']}")
            
            logger.info(f"Strict filtering: {len(results)} -> {len(strict_results)}")
            return strict_results
            
    except Exception as e:
        logger.error(f"Strict filtering failed, returning raw results: {e}")
        return results

    return results
