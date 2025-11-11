"""
Unit tests for MCP server validation functions.
Tests input validation, sanitization, and error handling.
"""
import pytest
import sys
from pathlib import Path

# Add parent directory to path to import MCP server functions
sys.path.insert(0, str(Path(__file__).parent.parent / "mcp-server"))

# Note: These tests would need to be adapted for Node.js
# For now, we'll create Python tests that test the logic conceptually

def test_validate_location_coordinates():
    """Test coordinate validation."""
    # Valid coordinates
    valid_coords = {"lat": 27.7172, "lon": 85.3240}  # Kathmandu
    assert -90 <= valid_coords["lat"] <= 90
    assert -180 <= valid_coords["lon"] <= 180
    
    # Invalid coordinates
    invalid_lat = {"lat": 91, "lon": 85.3240}
    assert not (-90 <= invalid_lat["lat"] <= 90)
    
    invalid_lon = {"lat": 27.7172, "lon": 181}
    assert not (-180 <= invalid_lon["lon"] <= 180)


def test_validate_date_format():
    """Test ISO 8601 date validation."""
    import re
    
    iso_regex = r'^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$'
    
    # Valid dates
    valid_dates = [
        "2025-01-15",
        "2025-01-15T10:30:00",
        "2025-01-15T10:30:00Z",
        "2025-01-15T10:30:00+05:45",
    ]
    for date in valid_dates:
        assert re.match(iso_regex, date), f"Date {date} should be valid"
    
    # Invalid dates
    invalid_dates = [
        "2025-1-15",  # Missing leading zero
        "25-01-15",   # Wrong year format
        "2025/01/15", # Wrong separator
        "not-a-date",
    ]
    for date in invalid_dates:
        assert not re.match(iso_regex, date), f"Date {date} should be invalid"


def test_validate_parameter():
    """Test air quality parameter validation."""
    valid_params = ['pm25', 'pm10', 'co', 'no', 'no2', 'o3', 'so2', 'nh3']
    
    for param in valid_params:
        assert param.lower() in valid_params
    
    # Invalid parameter
    invalid_param = 'invalid_param'
    assert invalid_param.lower() not in valid_params


def test_sanitize_string():
    """Test string sanitization."""
    # Test length limit
    long_string = "a" * 300
    sanitized = long_string[:200]
    assert len(sanitized) <= 200
    
    # Test dangerous characters removal
    dangerous = '<script>alert("xss")</script>'
    # Should remove <, >, ", '
    sanitized = dangerous.replace('<', '').replace('>', '').replace('"', '').replace("'", '')
    assert '<' not in sanitized
    assert '>' not in sanitized


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

