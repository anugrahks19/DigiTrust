import re
import csv
import os
from typing import Dict, List, Set, Tuple


class LinguisticValidator:
    """Validates addresses using India-specific linguistic and cultural patterns"""
    
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        self.landmarks_by_digipin = {}
        self.load_landmarks()
        
        # Common Indian address patterns
        self.proximity_patterns = [
            r'near\s+(\w+\s+\w+)',
            r'opp(?:osite)?\s+(\w+\s+\w+)',
            r'behind\s+(\w+\s+\w+)',
            r'next\s+to\s+(\w+\s+\w+)',
            r'beside\s+(\w+\s+\w+)',
        ]
        
        self.landmark_types = {
            'temple': ['temple', 'mandir', 'kovil', 'devasthanam', 'shrine'],
            'mosque': ['mosque', 'masjid', 'dargah'],
            'church': ['church', 'chapel', 'cathedral'],
            'school': ['school', 'vidyalaya', 'high school', 'primary school'],
            'college': ['college', 'university', 'institute'],
            'hospital': ['hospital', 'clinic', 'medical', 'dispensary'],
            'shop': ['shop', 'store', 'market', 'bazaar', 'stall'],
            'bank': ['bank', 'atm'],
            'post_office': ['post office', 'post', 'po'],
        }
    
    def load_landmarks(self):
        """Load landmark data for each DIGIPIN"""
        try:
            landmarks_path = os.path.join(self.data_dir, "landmarks.csv")
            if os.path.exists(landmarks_path):
                with open(landmarks_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        digipin = row['digipin']
                        if digipin not in self.landmarks_by_digipin:
                            self.landmarks_by_digipin[digipin] = []
                        
                        self.landmarks_by_digipin[digipin].append({
                            'type': row['landmark_type'],
                            'name': row['landmark_name'].lower(),
                            'lat': float(row['lat']),
                            'long': float(row['long'])
                        })
        except Exception as e:
            print(f"Warning: Could not load landmarks data: {e}")
    
    def normalize_address(self, address: Dict[str, str]) -> str:
        """Combine address fields into normalized text"""
        parts = [
            address.get('house_no', ''),
            address.get('street', ''),
            address.get('locality', ''),
            address.get('city', ''),
            address.get('district', ''),
            address.get('state', ''),
        ]
        return ' '.join(filter(None, parts)).lower()
    
    def extract_landmarks(self, address_text: str) -> List[Tuple[str, str]]:
        """
        Extract landmark references from address text
        Returns list of (landmark_type, landmark_name) tuples
        """
        found_landmarks = []
        address_lower = address_text.lower()
        
        for landmark_type, keywords in self.landmark_types.items():
            for keyword in keywords:
                if keyword in address_lower:
                    # Try to extract the full landmark name using proximity patterns
                    for pattern in self.proximity_patterns:
                        matches = re.finditer(pattern, address_lower)
                        for match in matches:
                            if keyword in match.group(0):
                                found_landmarks.append((landmark_type, match.group(1)))
                    
                    # Also check if keyword standalone
                    if any(keyword in word for word in address_lower.split()):
                        found_landmarks.append((landmark_type, keyword))
        
        return found_landmarks
    
    def match_cultural_references(self, address_text: str, digipin: str) -> Tuple[int, List[str]]:
        """
        Match cultural references in address against known landmarks in DIGIPIN
        Returns (match_count, matched_landmarks)
        """
        landmarks_in_digipin = self.landmarks_by_digipin.get(digipin, [])
        if not landmarks_in_digipin:
            return 0, []
        
        address_lower = address_text.lower()
        matched = []
        
        for landmark in landmarks_in_digipin:
            landmark_name = landmark['name']
            landmark_type = landmark['type']
            
            # Check if landmark name appears in address
            if landmark_name in address_lower:
                matched.append(f"{landmark_type}:{landmark_name}")
                continue
            
            # Check for partial matches (e.g., "lakshmi temple" matches "sri lakshmi temple")
            name_parts = landmark_name.split()
            if any(part in address_lower and len(part) > 3 for part in name_parts):
                matched.append(f"{landmark_type}:{landmark_name}")
        
        return len(matched), matched
    
    def calculate_linguistic_score(self, address: Dict[str, str]) -> Tuple[float, Dict]:
        """
        Calculate linguistic consistency score based on Indian address patterns
        Returns score 0-100 and details
        """
        digipin = address.get('digipin', '')
        address_text = self.normalize_address(address)
        
        score_components = {
            'landmark_references': 0,
            'proximity_patterns': 0,
            'cultural_match': 0
        }
        
        details = {
            'method': 'linguistic_validation',
            'found_landmarks': [],
            'matched_landmarks': [],
            'proximity_patterns_found': 0
        }
        
        # Extract landmarks mentioned in address
        found_landmarks = self.extract_landmarks(address_text)
        details['found_landmarks'] = [f"{t}:{n}" for t, n in found_landmarks]
        
        if found_landmarks:
            score_components['landmark_references'] = min(50, len(found_landmarks) * 25)
        
        # Count proximity patterns
        proximity_count = sum(
            len(re.findall(pattern, address_text))
            for pattern in self.proximity_patterns
        )
        details['proximity_patterns_found'] = proximity_count
        
        if proximity_count > 0:
            score_components['proximity_patterns'] = min(30, proximity_count * 15)
        
        # Match against known landmarks in DIGIPIN
        match_count, matched_landmarks = self.match_cultural_references(address_text, digipin)
        details['matched_landmarks'] = matched_landmarks
        
        if match_count > 0:
            score_components['cultural_match'] = min(50, match_count * 25)
        
        # Calculate total score
        total_score = sum(score_components.values())
        
        details['breakdown'] = score_components
        details['landmark_match_count'] = match_count
        
        return min(100, total_score), details
