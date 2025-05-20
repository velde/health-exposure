import h3
from typing import Tuple, Optional

def validate_coordinates(lat: float, lon: float) -> Tuple[bool, Optional[str]]:
    """
    Validate latitude and longitude values.
    Returns (is_valid: bool, error_message: Optional[str])
    """
    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
        return False, "Latitude and longitude must be numbers"
        
    if lat < -90 or lat > 90:
        return False, "Latitude must be between -90 and 90"
        
    if lon < -180 or lon > 180:
        return False, "Longitude must be between -180 and 180"
        
    return True, None

def validate_h3_cell(h3_cell: str) -> Tuple[bool, Optional[str]]:
    """
    Validate H3 cell format and resolution.
    Returns (is_valid: bool, error_message: Optional[str])
    """
    if not isinstance(h3_cell, str):
        return False, "H3 cell must be a string"
        
    if not h3.is_valid_cell(h3_cell):
        return False, "Invalid H3 cell format"
        
    resolution = h3.get_resolution(h3_cell)
    if resolution != 6:
        return False, "H3 cell must be resolution 6"
        
    return True, None

def validate_user_tier(user_tier: str) -> Tuple[bool, Optional[str]]:
    """
    Validate user tier value.
    Returns (is_valid: bool, error_message: Optional[str])
    """
    valid_tiers = {'free', 'premium'}
    if user_tier.lower() not in valid_tiers:
        return False, f"User tier must be one of: {', '.join(valid_tiers)}"
    return True, None

def validate_headers(headers: dict) -> Tuple[bool, Optional[str]]:
    """
    Validate required headers.
    Returns (is_valid: bool, error_message: Optional[str])
    """
    if not headers:
        return False, "Headers are required"
    return True, None 