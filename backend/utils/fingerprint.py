import hashlib
import re
from typing import Dict


def normalize_for_fingerprint(address: Dict[str, str]) -> str:
    """
    Normalize address for consistent fingerprinting
    Removes variability while keeping essential identity
    """
    def clean_text(text: str) -> str:
        if not text:
            return ''
        # Convert to lowercase
        text = text.lower()
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Remove special characters except hyphens and slashes
        text = re.sub(r'[^\w\s\-/]', '', text)
        return text
    
    # Normalize each component
    normalized_parts = [
        clean_text(address.get('house_no', '')),
        clean_text(address.get('street', '')),
        clean_text(address.get('locality', '')),
        clean_text(address.get('city', '')),
        clean_text(address.get('district', '')),
        clean_text(address.get('state', '')),
        clean_text(address.get('pin', '')),
        clean_text(address.get('digipin', '')),
    ]
    
    # Join with delimiter
    return '||'.join(filter(None, normalized_parts))


def generate_fingerprint(address: Dict[str, str]) -> str:
    """
    Generate a stable 64-character SHA256 hash for an address
    This fingerprint can be used to track the same address over time
    """
    normalized = normalize_for_fingerprint(address)
    
    # Generate SHA256 hash
    hash_object = hashlib.sha256(normalized.encode('utf-8'))
    fingerprint = hash_object.hexdigest()
    
    return fingerprint


def compare_fingerprints(fp1: str, fp2: str) -> float:
    """
    Compare two fingerprints for similarity
    Returns 1.0 for exact match, 0.0 for no match
    """
    if fp1 == fp2:
        return 1.0
    
    # For fingerprints, it's binary - either exact match or not
    # In a more sophisticated system, you could compare the original
    # normalized addresses for fuzzy matching
    return 0.0


def extract_fingerprint_components(address: Dict[str, str]) -> Dict[str, str]:
    """
    Extract the normalized components used in fingerprint generation
    Useful for debugging and display
    """
    return {
        'house_no': address.get('house_no', '').lower().strip(),
        'street': address.get('street', '').lower().strip(),
        'locality': address.get('locality', '').lower().strip(),
        'city': address.get('city', '').lower().strip(),
        'district': address.get('district', '').lower().strip(),
        'state': address.get('state', '').lower().strip(),
        'pin': address.get('pin', '').lower().strip(),
        'digipin': address.get('digipin', '').lower().strip(),
    }
