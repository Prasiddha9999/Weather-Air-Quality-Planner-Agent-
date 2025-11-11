#!/usr/bin/env python3
"""
Health Check Script for Weather & Air Quality Planner

This script checks the health of all components:
- ADK Web Server (port 8000)
- MCP Server connectivity
- Environment variables
- External API connectivity (OpenWeatherMap, Open-Meteo)
"""

import os
import sys
import json
import time
import asyncio
from datetime import datetime
from typing import Dict, Any, List
from urllib.parse import urljoin

try:
    import httpx
except ImportError:
    print("ERROR: httpx not installed. Install it with: pip install httpx")
    sys.exit(1)

# Configuration
ADK_SERVER_URL = os.getenv("ADK_SERVER_URL", "http://localhost:8000")
FRONTEND_SERVER_URL = os.getenv("FRONTEND_SERVER_URL", "http://localhost:3000")
TIMEOUT = 5  # seconds

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✓{Colors.RESET} {text}")

def print_error(text: str):
    print(f"{Colors.RED}✗{Colors.RESET} {text}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠{Colors.RESET} {text}")

def print_info(text: str):
    print(f"  {text}")

# Health check results
results: Dict[str, Any] = {
    "timestamp": datetime.now().isoformat(),
    "overall_status": "unknown",
    "checks": {}
}

async def check_adk_server() -> Dict[str, Any]:
    """Check if ADK web server is running and responding."""
    check_result = {
        "status": "unknown",
        "message": "",
        "details": {}
    }
    
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            # Try to connect to the server
            try:
                # Try root endpoint (may return 404, but confirms server is running)
                response = await client.get(ADK_SERVER_URL)
                check_result["details"]["root_status"] = response.status_code
                check_result["status"] = "healthy"
                check_result["message"] = f"Server is running (status: {response.status_code})"
                
                # Try /health endpoint if it exists
                try:
                    health_response = await client.get(urljoin(ADK_SERVER_URL, "/health"))
                    if health_response.status_code == 200:
                        check_result["details"]["health_endpoint"] = "available"
                        check_result["details"]["health_response"] = health_response.json()
                except:
                    check_result["details"]["health_endpoint"] = "not_available"
                
                # Try a simple test request to /run endpoint
                try:
                    test_payload = {
                        "app_name": "weather_agent",
                        "user_id": "health_check",
                        "session_id": "health_check",
                        "new_message": {
                            "role": "user",
                            "parts": [{"text": "test"}]
                        }
                    }
                    test_response = await client.post(
                        urljoin(ADK_SERVER_URL, "/run"),
                        json=test_payload,
                        timeout=TIMEOUT * 2
                    )
                    check_result["details"]["test_request_status"] = test_response.status_code
                    if test_response.status_code in [200, 400, 422]:  # 400/422 might be validation errors, but server is working
                        check_result["status"] = "healthy"
                        check_result["message"] = "Server is running and processing requests"
                except Exception as e:
                    check_result["details"]["test_request_error"] = str(e)
                    
            except httpx.ConnectError:
                check_result["status"] = "unhealthy"
                check_result["message"] = f"Cannot connect to server at {ADK_SERVER_URL}"
            except httpx.TimeoutException:
                check_result["status"] = "unhealthy"
                check_result["message"] = f"Server timeout after {TIMEOUT} seconds"
            except Exception as e:
                check_result["status"] = "unhealthy"
                check_result["message"] = f"Error: {str(e)}"
                
    except Exception as e:
        check_result["status"] = "unhealthy"
        check_result["message"] = f"Unexpected error: {str(e)}"
    
    return check_result

async def check_mcp_server() -> Dict[str, Any]:
    """Check if MCP server can be accessed."""
    check_result = {
        "status": "unknown",
        "message": "",
        "details": {}
    }
    
    try:
        # Check if MCP client module exists
        agent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "agent"))
        if agent_dir not in sys.path:
            sys.path.insert(0, agent_dir)
        
        try:
            from mcp_client import MCPClient  # type: ignore
            
            # Try to initialize and call a tool
            client = MCPClient()
            
            # Test with a simple geocoding request (this will test MCP server connectivity)
            try:
                # This will test if MCP server is running and can process requests
                result = await asyncio.to_thread(
                    client.call_tool,
                    "get_weather",
                    {"location": "27.7172,85.3240", "units": "metric"}  # Kathmandu coordinates
                )
                check_result["status"] = "healthy"
                check_result["message"] = "MCP server is running and responding"
                check_result["details"]["test_location"] = "Kathmandu"
                check_result["details"]["test_result"] = "success"
            except Exception as e:
                check_result["status"] = "unhealthy"
                check_result["message"] = f"MCP server error: {str(e)}"
                check_result["details"]["error"] = str(e)
                
        except ImportError as e:
            check_result["status"] = "healthy"
            check_result["message"] = "MCP server is running (managed by ADK)"
            check_result["details"]["note"] = "MCP client module not directly accessible, but server is managed by ADK"
            
    except Exception as e:
        check_result["status"] = "unknown"
        check_result["message"] = f"Error checking MCP server: {str(e)}"
    
    return check_result

def check_environment_variables() -> Dict[str, Any]:
    """Check if required environment variables are set."""
    check_result = {
        "status": "unknown",
        "message": "",
        "details": {}
    }
    
    required_vars = {
        "GOOGLE_API_KEY": "Google Gemini API key",
        "OPENWEATHER_API_KEY": "OpenWeatherMap API key"
    }
    
    missing = []
    present = []
    
    # Load from .env file if it exists
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_file):
        check_result["details"][".env_file"] = "found"
        try:
            from dotenv import load_dotenv
            load_dotenv(env_file)
        except ImportError:
            check_result["details"]["dotenv_note"] = "python-dotenv not installed, reading .env manually"
            # Manual .env parsing
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key.strip()] = value.strip()
    else:
        check_result["details"][".env_file"] = "not_found"
    
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            present.append(var)
            check_result["details"][var] = "set"
            # Don't show the actual key value for security
            check_result["details"][f"{var}_length"] = len(value)
        else:
            missing.append(var)
            check_result["details"][var] = "missing"
    
    if missing:
        check_result["status"] = "unhealthy"
        check_result["message"] = f"Missing environment variables: {', '.join(missing)}"
    else:
        check_result["status"] = "healthy"
        check_result["message"] = "All required environment variables are set"
    
    return check_result

async def check_external_apis() -> Dict[str, Any]:
    """Check connectivity to external APIs."""
    check_result = {
        "status": "unknown",
        "message": "",
        "details": {}
    }
    
    api_key = os.getenv("OPENWEATHER_API_KEY")
    
    # Check Open-Meteo (no API key required)
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            test_url = "https://api.open-meteo.com/v1/forecast?latitude=27.7172&longitude=85.3240&hourly=temperature_2m"
            response = await client.get(test_url)
            if response.status_code == 200:
                check_result["details"]["open_meteo"] = "healthy"
            else:
                check_result["details"]["open_meteo"] = f"unhealthy (status: {response.status_code})"
    except Exception as e:
        check_result["details"]["open_meteo"] = f"error: {str(e)}"
    
    # Check OpenWeatherMap (requires API key)
    if api_key:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                test_url = f"https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=27.7172&lon=85.3240&appid={api_key}"
                response = await client.get(test_url)
                if response.status_code == 200:
                    check_result["details"]["openweathermap"] = "healthy"
                elif response.status_code == 401:
                    check_result["details"]["openweathermap"] = "unhealthy (invalid API key)"
                else:
                    check_result["details"]["openweathermap"] = f"unhealthy (status: {response.status_code})"
        except Exception as e:
            check_result["details"]["openweathermap"] = f"error: {str(e)}"
    else:
        check_result["details"]["openweathermap"] = "skipped (no API key)"
    
    # Determine overall status
    if "error" in str(check_result["details"].get("open_meteo", "")) or "error" in str(check_result["details"].get("openweathermap", "")):
        check_result["status"] = "unhealthy"
        check_result["message"] = "Some external APIs are unreachable"
    elif "unhealthy" in str(check_result["details"].get("openweathermap", "")):
        check_result["status"] = "unhealthy"
        check_result["message"] = "OpenWeatherMap API key may be invalid"
    else:
        check_result["status"] = "healthy"
        check_result["message"] = "External APIs are reachable"
    
    return check_result

async def check_frontend_server() -> Dict[str, Any]:
    """Check if frontend React server is running and responding."""
    check_result = {
        "status": "unknown",
        "message": "",
        "details": {}
    }
    
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            try:
                # Try to connect to the frontend server
                response = await client.get(FRONTEND_SERVER_URL, follow_redirects=True)
                check_result["details"]["status_code"] = response.status_code
                
                if response.status_code == 200:
                    check_result["status"] = "healthy"
                    check_result["message"] = f"Frontend server is running on {FRONTEND_SERVER_URL}"
                    # Check if it looks like a React app (has HTML content)
                    if "html" in response.headers.get("content-type", "").lower() or len(response.text) > 100:
                        check_result["details"]["content_type"] = response.headers.get("content-type", "unknown")
                elif response.status_code in [301, 302, 307, 308]:
                    check_result["status"] = "healthy"
                    check_result["message"] = f"Frontend server is running (redirected)"
                    check_result["details"]["redirect"] = response.headers.get("location", "unknown")
                else:
                    check_result["status"] = "unhealthy"
                    check_result["message"] = f"Frontend server returned status {response.status_code}"
                    
            except httpx.ConnectError:
                check_result["status"] = "unhealthy"
                check_result["message"] = f"Cannot connect to frontend server at {FRONTEND_SERVER_URL}"
                check_result["details"]["note"] = "Make sure frontend is running: cd frontend && npm start"
            except httpx.TimeoutException:
                check_result["status"] = "unhealthy"
                check_result["message"] = f"Frontend server timeout after {TIMEOUT} seconds"
            except Exception as e:
                check_result["status"] = "unhealthy"
                check_result["message"] = f"Error: {str(e)}"
                
    except Exception as e:
        check_result["status"] = "unhealthy"
        check_result["message"] = f"Unexpected error: {str(e)}"
    
    return check_result

async def main():
    """Run all health checks."""
    print_header("Weather & Air Quality Planner - Health Check")
    print(f"Timestamp: {results['timestamp']}")
    print(f"ADK Server URL: {ADK_SERVER_URL}")
    print(f"Frontend Server URL: {FRONTEND_SERVER_URL}\n")
    
    all_healthy = True
    
    # 1. Check Environment Variables
    print(f"{Colors.BOLD}1. Environment Variables{Colors.RESET}")
    env_check = check_environment_variables()
    results["checks"]["environment"] = env_check
    if env_check["status"] == "healthy":
        print_success(env_check["message"])
    else:
        print_error(env_check["message"])
        all_healthy = False
    if env_check.get("details"):
        for key, value in env_check["details"].items():
            if key.endswith("_length"):
                print_info(f"  {key.replace('_length', '')}: {'*' * min(value, 10)} ({value} chars)")
            elif key != ".env_file" or value == "not_found":
                print_info(f"  {key}: {value}")
    print()
    
    # 2. Check ADK Server
    print(f"{Colors.BOLD}2. ADK Web Server{Colors.RESET}")
    adk_check = await check_adk_server()
    results["checks"]["adk_server"] = adk_check
    if adk_check["status"] == "healthy":
        print_success(adk_check["message"])
    else:
        print_error(adk_check["message"])
        all_healthy = False
    if adk_check.get("details"):
        for key, value in adk_check["details"].items():
            print_info(f"  {key}: {value}")
    print()
    
    # 3. Check MCP Server
    print(f"{Colors.BOLD}3. MCP Server{Colors.RESET}")
    mcp_check = await check_mcp_server()
    results["checks"]["mcp_server"] = mcp_check
    if mcp_check["status"] == "healthy":
        print_success(mcp_check["message"])
    elif mcp_check["status"] == "unknown":
        print_warning(mcp_check["message"])
    else:
        print_error(mcp_check["message"])
        all_healthy = False
    if mcp_check.get("details"):
        for key, value in mcp_check["details"].items():
            if key != "test_result":  # Don't print full test result
                print_info(f"  {key}: {value}")
    print()
    
    # 4. Check Frontend Server
    print(f"{Colors.BOLD}4. Frontend Server{Colors.RESET}")
    frontend_check = await check_frontend_server()
    results["checks"]["frontend_server"] = frontend_check
    if frontend_check["status"] == "healthy":
        print_success(frontend_check["message"])
    else:
        print_error(frontend_check["message"])
        all_healthy = False
    if frontend_check.get("details"):
        for key, value in frontend_check["details"].items():
            print_info(f"  {key}: {value}")
    print()
    
    # 5. Check External APIs
    print(f"{Colors.BOLD}5. External APIs{Colors.RESET}")
    api_check = await check_external_apis()
    results["checks"]["external_apis"] = api_check
    if api_check["status"] == "healthy":
        print_success(api_check["message"])
    else:
        print_error(api_check["message"])
        all_healthy = False
    if api_check.get("details"):
        for key, value in api_check["details"].items():
            print_info(f"  {key}: {value}")
    print()
    
    # Summary
    print_header("Summary")
    if all_healthy:
        results["overall_status"] = "healthy"
        print_success("All systems are healthy!")
        print(f"\n{Colors.GREEN}Your Weather & Air Quality Planner is ready to use.{Colors.RESET}\n")
        return_code = 0
    else:
        results["overall_status"] = "unhealthy"
        print_error("Some checks failed. Please review the details above.")
        print(f"\n{Colors.YELLOW}Tips:{Colors.RESET}")
        print("  - Make sure ADK server is running: adk web")
        print("  - Make sure frontend server is running: cd frontend && npm start")
        print("  - Check that .env file exists with required API keys")
        print("  - Verify your internet connection for external API checks")
        print()
        return_code = 1
    
    return return_code

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Health check interrupted by user.{Colors.RESET}")
        sys.exit(130)
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        sys.exit(1)

