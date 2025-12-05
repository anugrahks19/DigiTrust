import math
import csv
import os
from typing import Dict, List, Tuple, Optional


class GeospatialUtils:
    """Geospatial utility functions for address validation"""
    
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        self.pin_centroids = {}
        self.digipin_centers = {}
        self.load_data()
    
    def load_data(self):
        """Load PIN centroids and DIGIPIN centers"""
        try:
            # Load PIN centroids
            pin_path = os.path.join(self.data_dir, "pin_centroids.csv")
            if os.path.exists(pin_path):
                with open(pin_path, 'r') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        self.pin_centroids[row['pin']] = {
                            'lat': float(row['lat']),
                            'long': float(row['long']),
                            'district': row['district'],
                            'state': row['state']
                        }
            
            # Load DIGIPIN centers from existing grid
            digipin_path = os.path.join(self.data_dir, "mock_digipin_grid.csv")
            if os.path.exists(digipin_path):
                with open(digipin_path, 'r') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        self.digipin_centers[row['digipin']] = {
                            'lat': float(row['lat']),
                            'long': float(row['long'])
                        }
        except Exception as e:
            print(f"Warning: Could not load geospatial data: {e}")
    
    def haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance between two points 
        on the earth (specified in decimal degrees)
        Returns distance in kilometers
        """
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r
    
    def get_pin_centroid(self, pin: str) -> Optional[Dict[str, float]]:
        """Get the geographic center of a PIN code"""
        return self.pin_centroids.get(pin)
    
    def get_digipin_center(self, digipin: str) -> Optional[Dict[str, float]]:
        """Get the geographic center of a DIGIPIN"""
        return self.digipin_centers.get(digipin)
    
    def calculate_pin_digipin_distance(self, pin: str, digipin: str) -> float:
        """Calculate distance between PIN centroid and DIGIPIN center in km"""
        pin_center = self.get_pin_centroid(pin)
        digipin_center = self.get_digipin_center(digipin)
        
        if not pin_center or not digipin_center:
            return -1  # Data not available
        
        return self.haversine(
            pin_center['lat'], pin_center['long'],
            digipin_center['lat'], digipin_center['long']
        )
    
    def point_in_polygon(self, point: Tuple[float, float], polygon: List[Tuple[float, float]]) -> bool:
        """
        Check if a point is inside a polygon using ray casting algorithm
        point: (lat, lon)
        polygon: list of (lat, lon) tuples
        """
        x, y = point
        n = len(polygon)
        inside = False
        
        p1x, p1y = polygon[0]
        for i in range(1, n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        
        return inside
    
    def calculate_geo_precision_score(self, address: Dict[str, str]) -> Tuple[float, Dict]:
        """
        4-level hierarchical geospatial precision scoring
        Returns score 0-100 and details
        """
        pin = address.get('pin', '')
        digipin = address.get('digipin', '')
        house_no = address.get('house_no', '')
        street = address.get('street', '')
        
        scores = {
            'level1_pin_digipin': 0.0,
            'level2_polygon': 0.0,
            'level3_house_range': 0.0,
            'level4_landmark': 0.0
        }
        details = {}
        
        # Level 1: PIN-DIGIPIN distance (30% weight)
        distance_km = self.calculate_pin_digipin_distance(pin, digipin)
        if distance_km >= 0:
            # 5km tolerance - perfect score at 0km, 0 score at 5km+
            scores['level1_pin_digipin'] = max(0, 100 - (distance_km / 5 * 100))
            details['pin_digipin_distance_km'] = round(distance_km, 2)
        else:
            scores['level1_pin_digipin'] = 50  # Default when data unavailable
            details['pin_digipin_distance_km'] = None
        
        # Level 2: Street/locality polygon intersection (25% weight)
        # Simulated: Check if street name consistency exists
        digipin_data = self.digipin_centers.get(digipin)
        if digipin_data and street:
            # Mock polygon check - in real system would use actual boundaries
            scores['level2_polygon'] = 75.0  # Assume match for demo
            details['street_polygon_match'] = True
        else:
            scores['level2_polygon'] = 50.0
            details['street_polygon_match'] = False
        
        # Level 3: House number range validation (20% weight)
        # Check if house number is reasonable
        if house_no:
            try:
                # Extract numeric part
                house_num = int(''.join(filter(str.isdigit, house_no)))
                if 1 <= house_num <= 999:
                    scores['level3_house_range'] = 80.0
                    details['house_range_valid'] = True
                else:
                    scores['level3_house_range'] = 40.0
                    details['house_range_valid'] = False
            except:
                scores['level3_house_range'] = 50.0
                details['house_range_valid'] = False
        else:
            scores['level3_house_range'] = 50.0
            details['house_range_valid'] = False
        
        # Level 4: Landmark proximity (15% weight)
        # Simulated based on DIGIPIN existence
        if digipin in self.digipin_centers:
            scores['level4_landmark'] = 70.0
            details['landmark_proximity_score'] = 70.0
        else:
            scores['level4_landmark'] = 30.0
            details['landmark_proximity_score'] = 30.0
        
        # Calculate weighted total
        total_score = (
            scores['level1_pin_digipin'] * 0.30 +
            scores['level2_polygon'] * 0.25 +
            scores['level3_house_range'] * 0.20 +
            scores['level4_landmark'] * 0.15
        )
        
        details['breakdown'] = scores
        details['method'] = 'geo_precision_4level'
        
        return round(total_score, 2), details
