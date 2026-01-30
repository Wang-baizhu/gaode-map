
import sys
import os
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from modules.grid_h3.core import polygon_to_hexagons, get_hexagon_boundary
from shapely.geometry import Polygon, Point

def test_grid_h3():
    print("Testing H3 Grid Logic...")
    
    # 1. Create a simple square polygon (WGS84)
    # Roughly Shanghai People's Square
    lat = 31.2304
    lon = 121.4737
    d = 0.01 # approx 1km box
    
    coords = [
        (lon-d, lat-d),
        (lon+d, lat-d),
        (lon+d, lat+d),
        (lon-d, lat+d),
        (lon-d, lat-d)
    ]
    poly = Polygon(coords)
    
    print(f"Polygon Area: {poly.area}")
    
    # 2. Convert to Hexagons (Res 9)
    res = 9
    hex_ids = polygon_to_hexagons(poly, resolution=res)
    
    print(f"Generated {len(hex_ids)} hexagons at Resolution {res}")
    
    if len(hex_ids) > 0:
        print(f"Sample Hex ID: {hex_ids[0]}")
        
        # 3. Get Boundary
        boundary = get_hexagon_boundary(hex_ids[0])
        print(f"Boundary verification (first pt): {boundary[0]}")
        print("SUCCESS: H3 Logic working.")
    else:
        print("FAILURE: No hexagons generated.")

if __name__ == "__main__":
    test_grid_h3()
