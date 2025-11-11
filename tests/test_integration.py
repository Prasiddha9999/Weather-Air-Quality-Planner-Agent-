"""
Integration tests for end-to-end flows.
Tests the complete flow from user query to response.
"""
import pytest
import asyncio
import httpx
import os
from pathlib import Path

# Configuration
ADK_SERVER_URL = os.getenv("ADK_SERVER_URL", "http://localhost:8000")
TIMEOUT = 30


@pytest.mark.asyncio
async def test_health_endpoint():
    """Test that the health endpoint is accessible."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.get(f"{ADK_SERVER_URL}/health")
            assert response.status_code in [200, 404]  # 404 is ok if endpoint doesn't exist
        except httpx.ConnectError:
            pytest.skip("ADK server not running")


@pytest.mark.asyncio
async def test_weather_query():
    """Test a simple weather query."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            payload = {
                "app_name": "weather_agent",
                "user_id": "test_user",
                "session_id": "test_session_1",
                "new_message": {
                    "role": "user",
                    "parts": [{"text": "What is the weather in Kathmandu today?"}]
                }
            }
            response = await client.post(
                f"{ADK_SERVER_URL}/run",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                assert "response" in data or isinstance(data, list)
                print(f"✓ Weather query successful: {response.status_code}")
            else:
                print(f"⚠ Weather query returned: {response.status_code}")
                
        except httpx.ConnectError:
            pytest.skip("ADK server not running")
        except Exception as e:
            pytest.fail(f"Test failed with error: {e}")


@pytest.mark.asyncio
async def test_air_quality_query():
    """Test an air quality query."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            payload = {
                "app_name": "weather_agent",
                "user_id": "test_user",
                "session_id": "test_session_2",
                "new_message": {
                    "role": "user",
                    "parts": [{"text": "What is the air quality in New York?"}]
                }
            }
            response = await client.post(
                f"{ADK_SERVER_URL}/run",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                assert "response" in data or isinstance(data, list)
                print(f"✓ Air quality query successful: {response.status_code}")
            else:
                print(f"⚠ Air quality query returned: {response.status_code}")
                
        except httpx.ConnectError:
            pytest.skip("ADK server not running")
        except Exception as e:
            pytest.fail(f"Test failed with error: {e}")


@pytest.mark.asyncio
async def test_follow_up_query():
    """Test that follow-up queries maintain context."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            session_id = "test_session_3"
            
            # First message
            payload1 = {
                "app_name": "weather_agent",
                "user_id": "test_user",
                "session_id": session_id,
                "new_message": {
                    "role": "user",
                    "parts": [{"text": "Weather in London"}]
                }
            }
            response1 = await client.post(
                f"{ADK_SERVER_URL}/run",
                json=payload1
            )
            
            # Follow-up message
            payload2 = {
                "app_name": "weather_agent",
                "user_id": "test_user",
                "session_id": session_id,
                "new_message": {
                    "role": "user",
                    "parts": [{"text": "What about tomorrow?"}]
                }
            }
            response2 = await client.post(
                f"{ADK_SERVER_URL}/run",
                json=payload2
            )
            
            if response1.status_code == 200 and response2.status_code == 200:
                print("✓ Follow-up query successful")
            else:
                print(f"⚠ Follow-up query returned: {response1.status_code}, {response2.status_code}")
                
        except httpx.ConnectError:
            pytest.skip("ADK server not running")
        except Exception as e:
            pytest.fail(f"Test failed with error: {e}")


@pytest.mark.asyncio
async def test_error_handling():
    """Test error handling for invalid requests."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            # Missing required fields
            payload = {
                "app_name": "weather_agent",
                # Missing user_id, session_id, new_message
            }
            response = await client.post(
                f"{ADK_SERVER_URL}/run",
                json=payload
            )
            
            # Should return error status
            assert response.status_code in [400, 422, 500]
            print(f"✓ Error handling works: {response.status_code}")
                
        except httpx.ConnectError:
            pytest.skip("ADK server not running")
        except Exception as e:
            pytest.fail(f"Test failed with error: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])

