import csv
import os
from typing import Dict, List, Tuple, Any
from datetime import datetime, timedelta
from difflib import SequenceMatcher
import json
from utils.geospatial import GeospatialUtils
from utils.linguistic_patterns import LinguisticValidator


class EvidenceAggregator:
    """DHRUVAx Real-World Evidence Aggregation Layer"""
    
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(__file__), "data")
        self.digipin_data = []
        self.delivery_data = []
        self.iot_data = []
        
        # Initialize utility modules
        self.geo_utils = GeospatialUtils()
        self.linguistic_validator = LinguisticValidator()
        
        self.load_mock_data()
    
    def load_mock_data(self):
        """Load mock datasets from CSV files"""
        try:
            digipin_path = os.path.join(self.data_dir, "mock_digipin_grid.csv")
            if os.path.exists(digipin_path):
                with open(digipin_path, 'r') as f:
                    reader = csv.DictReader(f)
                    self.digipin_data = list(reader)
            
            delivery_path = os.path.join(self.data_dir, "mock_delivery_logs.csv")
            if os.path.exists(delivery_path):
                with open(delivery_path, 'r') as f:
                    reader = csv.DictReader(f)
                    self.delivery_data = list(reader)
            
            iot_path = os.path.join(self.data_dir, "mock_iot_pings.csv")
            if os.path.exists(iot_path):
                with open(iot_path, 'r') as f:
                    reader = csv.DictReader(f)
                    self.iot_data = list(reader)
        except Exception as e:
            print(f"Warning: Could not load mock data: {e}")
    
    def get_geo_evidence(self, address: Dict[str, str]) -> Tuple[float, Dict[str, Any]]:
        """
        Geographic matching: DIGIPIN lookup and reverse geocode similarity
        Returns score 0-100 and details
        """
        digipin = address.get("digipin", "")
        locality = address.get("locality", "").lower()
        city = address.get("city", "").lower()
        pin = address.get("pin", "")
        
        details = {"method": "digipin_fuzzy_match", "matched": False}
        
        if not self.digipin_data:
            return 50.0, {"method": "no_data", "message": "Mock data not loaded"}
        
        # DEMO OVERRIDE: High Score Address
        if digipin == "BG-5600-38-IN":
            return 100.0, {
                "method": "demo_override",
                "matched": True,
                "grid_locality": "Indira Nagar",
                "grid_city": "Bangalore",
                "grid_pin": "560038",
                "locality_similarity": 100.0,
                "score_breakdown": {"locality": 40, "city": 30, "pin": 30}
            }
        # DEMO OVERRIDE: Medium Score Address
        if digipin == "ND-2013-01-S4":
            return 80.0, {
                "method": "demo_override",
                "matched": True,
                "grid_locality": "Sector 4",
                "grid_city": "Noida",
                "grid_pin": "201301",
                "locality_similarity": 100.0,
                "score_breakdown": {"locality": 40, "city": 30, "pin": 10}
            }

        # Look up DIGIPIN in grid
        grid_match = None
        for row in self.digipin_data:
            if row.get('digipin') == digipin:
                grid_match = row
                break
        
        if grid_match:
            grid_locality = str(grid_match.get('locality', '')).lower()
            grid_city = str(grid_match.get('city', '')).lower()
            grid_pin = str(grid_match.get('pin', ''))
            
            # Calculate similarity
            locality_sim = SequenceMatcher(None, locality, grid_locality).ratio()
            city_match = 1.0 if city == grid_city else 0.3
            pin_match = 1.0 if pin == grid_pin else 0.0
            
            # Weighted combination
            score = (locality_sim * 40 + city_match * 30 + pin_match * 30)
            
            details = {
                "method": "digipin_matched",
                "matched": True,
                "grid_locality": grid_match.get('locality'),
                "grid_city": grid_match.get('city'),
                "grid_pin": grid_match.get('pin'),
                "locality_similarity": round(locality_sim * 100, 2),
                "score_breakdown": {
                    "locality": round(locality_sim * 40, 2),
                    "city": round(city_match * 30, 2),
                    "pin": round(pin_match * 30, 2)
                }
            }
            
            return score, details
        else:
            # DIGIPIN not found
            return 20.0, {"method": "digipin_not_found", "digipin": digipin}
    
    def get_temporal_evidence(self, address: Dict[str, str]) -> Tuple[float, Dict[str, Any]]:
        """
        Temporal/Delivery history: Recent deliveries at this address
        Returns score 0-100 and details
        """
        if not self.delivery_data:
            return 0.0, {"method": "no_data", "message": "No delivery logs"}
        
        digipin = address.get("digipin", "")

        # DEMO OVERRIDE
        if digipin == "BG-5600-38-IN":
            return 100.0, {
                "method": "demo_override",
                "total_deliveries": 12,
                "deliveries_30_days": 4,
                "deliveries_90_days": 8,
                "most_recent": (datetime.now() - timedelta(days=2)).isoformat()
            }
        if digipin == "ND-2013-01-S4":
            return 50.0, {
                "method": "demo_override",
                "total_deliveries": 3,
                "deliveries_30_days": 0,
                "deliveries_90_days": 2,
                "most_recent": (datetime.now() - timedelta(days=45)).isoformat()
            }
        
        # Find deliveries for this DIGIPIN
        deliveries = [d for d in self.delivery_data if d.get('digipin') == digipin]
        
        if not deliveries:
            return 0.0, {"method": "no_deliveries", "digipin": digipin}
        
        # Count recent deliveries
        now = datetime.now()
        count_30 = 0
        count_90 = 0
        dates = []
        
        for delivery in deliveries:
            try:
                delivery_date = datetime.fromisoformat(delivery['delivery_date'])
                dates.append(delivery_date)
                days_ago = (now - delivery_date).days
                if days_ago <= 30:
                    count_30 += 1
                if days_ago <= 90:
                    count_90 += 1
            except:
                continue
        
        # Scoring
        if count_30 >= 3:
            score = 100.0
        elif count_30 >= 1:
            score = 70.0
        elif count_90 >= 2:
            score = 50.0
        elif count_90 >= 1:
            score = 30.0
        else:
            score = 10.0
        
        details = {
            "method": "delivery_history",
            "total_deliveries": len(deliveries),
            "deliveries_30_days": count_30,
            "deliveries_90_days": count_90,
            "most_recent": max(dates).isoformat() if dates else None
        }
        
        return score, details
    
    def get_iot_evidence(self, address: Dict[str, str]) -> Tuple[float, Dict[str, Any]]:
        """
        IoT ping evidence: Recent device pings from this location
        Returns score 0-100 and details
        """
        if not self.iot_data:
            return 0.0, {"method": "no_data", "message": "No IoT ping logs"}
        
        digipin = address.get("digipin", "")

        # DEMO OVERRIDE
        if digipin == "BG-5600-38-IN":
            return 100.0, {
                "method": "demo_override",
                "last_ping": datetime.now().isoformat(),
                "days_since_ping": 0,
                "recency": "very_recent",
                "ping_count": 150
            }
        if digipin == "ND-2013-01-S4":
            return 30.0, {
                "method": "demo_override",
                "last_ping": (datetime.now() - timedelta(days=40)).isoformat(),
                "days_since_ping": 40,
                "recency": "old",
                "ping_count": 5
            }
        
        # Find pings for this DIGIPIN
        pings = [p for p in self.iot_data if p.get('digipin') == digipin]
        
        if not pings:
            return 0.0, {"method": "no_pings", "digipin": digipin}
        
        # Check recency of last ping
        ping_dates = []
        for ping in pings:
            try:
                ping_date = datetime.fromisoformat(ping['last_ping'])
                ping_dates.append(ping_date)
            except:
                continue
        
        if not ping_dates:
            return 0.0, {"method": "no_valid_pings"}
        
        last_ping = max(ping_dates)
        days_since_ping = (datetime.now() - last_ping).days
        
        if days_since_ping <= 7:
            score = 100.0
            recency = "very_recent"
        elif days_since_ping <= 30:
            score = 60.0
            recency = "recent"
        elif days_since_ping <= 90:
            score = 30.0
            recency = "old"
        else:
            score = 10.0
            recency = "very_old"
        
        details = {
            "method": "iot_ping",
            "last_ping": last_ping.isoformat(),
            "days_since_ping": days_since_ping,
            "recency": recency,
            "ping_count": len(pings)
        }
        
        return score, details
    
    def get_documentary_evidence(self, address: Dict[str, str]) -> Tuple[float, Dict[str, Any]]:
        """
        Documentary match: Simulated property tax / KYC document check
        Returns score 0-100 and details
        """
        # For demo: simple heuristic based on PIN and city
        # In real system, this would query government databases
        
        pin = address.get("pin", "")
        city = address.get("city", "").lower()
        
        # Simulate: certain cities/PINs have documentary records
        high_coverage_cities = ["thrissur", "delhi", "mumbai", "bangalore", "chennai", "hyderabad"]
        
        if city in high_coverage_cities and len(pin) == 6:
            # Simulate 80% match for major cities
            return 80.0, {
                "method": "property_tax_match",
                "matched": True,
                "source": "mock_property_registry",
                "city": city
            }
        elif len(pin) == 6:
            # Partial match for other areas
            return 40.0, {
                "method": "partial_kyc_match",
                "matched": False,
                "message": "Limited documentary coverage"
            }
        else:
            return 0.0, {
                "method": "no_match",
                "matched": False
            }
    
    def get_crowd_evidence(self, address: Dict[str, str]) -> Tuple[float, Dict[str, Any]]:
        """
        Crowd/Community validation: Simulated community confirmations
        Returns score 0-100 and details
        """
        # For demo: simulate based on locality name length and DIGIPIN
        # In real system: query community validator confirmations
        
        digipin = address.get("digipin", "")
        locality = address.get("locality", "")

        # DEMO OVERRIDE
        if digipin == "BG-5600-38-IN":
            return 100.0, {
                "method": "demo_override",
                "confirmations": 5,
                "validators": ["postman", "kirana_store", "delivery_agent"]
            }
        
        # Simple simulation: hash DIGIPIN to get consistent random behavior
        hash_val = sum(ord(c) for c in digipin) % 100
        
        if hash_val < 30:
            confirmations = 0
            score = 0.0
        elif hash_val < 60:
            confirmations = 1
            score = 40.0
        elif hash_val < 85:
            confirmations = 2
            score = 70.0
        else:
            confirmations = 3
            score = 100.0
        
        details = {
            "method": "crowd_validation",
            "confirmations": confirmations,
            "validators": ["postman", "kirana_store", "neighbor"][:confirmations]
        }
        
        return score, details
    
    def get_history_evidence(self, address: Dict[str, str], db) -> Tuple[float, Dict[str, Any]]:
        """
        Historical validation: Check if this address was validated before
        Returns score 0-100 and details
        """
        # This would query the validation_results table
        # For now, return 0 (implement when DB queries are integrated)
        
        return 0.0, {
            "method": "validation_history",
            "prior_validations": 0,
            "message": "No prior validation history"
        }
    
    def get_geo_precision_evidence(self, address: Dict[str, str]) -> Tuple[float, Dict[str, Any]]:
        """
        Advanced geospatial precision scoring with 4-level hierarchy
        Returns score 0-100 and details
        """
        return self.geo_utils.calculate_geo_precision_score(address)
    
    def get_linguistic_evidence(self, address: Dict[str, str]) -> Tuple[float, Dict[str, Any]]:
        """
        Linguistic and cultural pattern validation for India-specific addresses
        Returns score 0-100 and details
        """
        return self.linguistic_validator.calculate_linguistic_score(address)
    
    def get_temporal_decay_evidence(self, address: Dict[str, str]) -> Tuple[float, Dict[str, Any]]:
        """
        Enhanced temporal evidence with decay function and fraud pattern detection
        Returns score 0-100 and details
        """
        if not self.delivery_data:
            return 0.0, {"method": "no_data", "message": "No delivery logs"}
        
        digipin = address.get("digipin", "")
        deliveries = [d for d in self.delivery_data if d.get('digipin') == digipin]
        
        if not deliveries:
            return 0.0, {"method": "no_deliveries", "digipin": digipin}
        
        now = datetime.now()
        delivery_dates = []
        
        for delivery in deliveries:
            try:
                delivery_date = datetime.fromisoformat(delivery['delivery_date'])
                delivery_dates.append(delivery_date)
            except:
                continue
        
        if not delivery_dates:
            return 0.0, {"method": "no_valid_deliveries"}
        
        # Sort by date
        delivery_dates.sort(reverse=True)
        
        # Calculate temporal decay score
        score = 0
        for delivery_date in delivery_dates:
            age_days = (now - delivery_date).days
            # Exponential decay: 0.9^age_days
            decay_factor = 0.9 ** age_days
            score += 20 * decay_factor
        
        score = min(100, score)
        
        # Fraud pattern detection - suspicious velocity
        fraud_score = 0
        suspicious_patterns = []
        
        # Check for too many deliveries in short time (fraud indicator)
        recent_7_days = [d for d in delivery_dates if (now - d).days <= 7]
        if len(recent_7_days) >= 10:
            fraud_score = -30
            suspicious_patterns.append("excessive_velocity_7d")
        
        recent_1_day = [d for d in delivery_dates if (now - d).days <= 1]
        if len(recent_1_day) >= 5:
            fraud_score = -40
            suspicious_patterns.append("suspicious_velocity_1d")
        
        details = {
            "method": "temporal_decay",
            "total_deliveries": len(delivery_dates),
            "most_recent": delivery_dates[0].isoformat() if delivery_dates else None,
            "decay_score": round(score, 2),
            "fraud_adjustment": fraud_score,
            "suspicious_patterns": suspicious_patterns,
            "velocity_7d": len(recent_7_days),
            "velocity_1d": len(recent_1_day)
        }
        
        final_score = max(0, score + fraud_score)
        return round(final_score, 2), details
    
    def calculate_evidence_agreement(self, evidence_scores: Dict[str, float]) -> Tuple[float, Dict[str, Any]]:
        """
        Calculate cross-corpus validation - how well do different evidence sources agree?
        Returns bonus score 0-100 and details
        """
        # Get scores for each evidence type
        geo = evidence_scores.get('geo', 0)
        temporal = evidence_scores.get('temporal', 0)
        iot = evidence_scores.get('iot', 0)
        doc = evidence_scores.get('doc', 0)
        crowd = evidence_scores.get('crowd', 0)
        
        scores_list = [geo, temporal, iot, doc, crowd]
        
        # Calculate variance - low variance means high agreement
        avg_score = sum(scores_list) / len(scores_list)
        variance = sum((s - avg_score) ** 2 for s in scores_list) / len(scores_list)
        std_dev = variance ** 0.5
        
        # Agreement score: lower std dev = higher agreement
        # Perfect agreement (std_dev = 0) -> 100 points
        # High disagreement (std_dev > 40) -> 0 points
        agreement_score = max(0, 100 - (std_dev * 2.5))
        
        # Count high-confidence signals (score >= 70)
        high_confidence_count = sum(1 for s in scores_list if s >= 70)
        
        # Boost if multiple sources strongly agree
        if high_confidence_count >= 4:
            agreement_score = min(100, agreement_score + 20)
        elif high_confidence_count >= 3:
            agreement_score = min(100, agreement_score + 10)
        
        details = {
            "method": "cross_corpus_validation",
            "average_score": round(avg_score, 2),
            "std_deviation": round(std_dev, 2),
            "agreement_score": round(agreement_score, 2),
            "high_confidence_sources": high_confidence_count,
            "score_distribution": {
                "geo": geo,
                "temporal": temporal,
                "iot": iot,
                "doc": doc,
                "crowd": crowd
            }
        }
        
        return round(agreement_score, 2), details
