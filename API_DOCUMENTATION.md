# Weather & Air Quality Planner - API Documentation

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Quick Reference - All cURL Commands](#quick-reference---all-curl-commands)
3. [API Endpoints](#api-endpoints)
4. [Core Functions](#core-functions)
5. [MCP Server](#mcp-server)
6. [MCP Tools](#mcp-tools)
7. [External APIs](#external-apis)
8. [Examples & Use Cases](#examples--use-cases)

---

## ⚡ Quick Reference - All cURL Commands

### Health Check
```bash
# Check ADK web server health
curl http://localhost:8000/health
```

**Note:** Start the server with `adk web` command. The health endpoint may not be available by default.

### Main API Endpoints

```bash
# 1. Send message (simplified)
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{"text": "What is the weather in Kathmandu today?"}]
    }
  }'

# 2. RESTful session endpoint
curl -X POST http://localhost:8000/apps/agent/users/u_123/sessions/s_123 \
  -H "Content-Type: application/json" \
  -d '{
    "new_message": {
      "role": "user",
      "parts": [{"text": "What is the weather in Kathmandu today?"}]
    }
  }'
```

### MCP Server

```bash
# Check if MCP server process is running (Linux/Mac)
ps aux | grep "node.*index.js"

# Check if MCP server process is running (Windows)
tasklist | findstr node

# Start MCP server manually
cd mcp-server && node index.js
```

---

## 🚀 Quick Start

### What is this API?

This is a **Weather & Air Quality Planner** that uses AI to answer questions about weather and air quality for any location. It understands natural language queries and provides helpful recommendations.

### How does it work?

```
User Question → AI Agent → Weather/Air Quality APIs → Formatted Response
```

**Example:**
- **Input:** "What should I wear in Kathmandu tomorrow morning?"
- **Output:** "Tomorrow morning in Kathmandu: 21–23°C, calm winds, no rain. Air quality: Moderate (PM2.5 ≈ 42 µg/m³). Light, comfortable clothing will be perfect. 🧥"

---

## 🌐 API Endpoints

The API is accessed through **Google ADK Web** which runs on `http://localhost:8000` by default.

### Base URL
```
http://localhost:8000
```

### Health Check Endpoint

**Endpoint:** `GET /health`

**Description:** Check if the ADK web server is running and healthy.

**cURL Example:**
```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "ADK Web server is running"
  "service": "Weather & Air Quality Planner"
}
```

**Expected Status Code:** `200 OK`

**Note:** Start the server using:
```bash
adk web
```

The health endpoint may not be available by default. Use the test endpoint method below to verify the server is running.

**Alternative: Server Verification (if health endpoint not available)**

**Method 1: Check Root Endpoint**
```bash
curl http://localhost:8000/
```
**Response:** May return `404 Not Found`, but this confirms the server is running (if you get a connection error, the server is not running).

**Method 2: Test with Actual Endpoint (Recommended)**
```bash
# Send a simple test message
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "agent",
    "user_id": "test",
    "session_id": "test",
    "new_message": {
      "role": "user",
      "parts": [{"text": "test"}]
    }
  }'
```

**Expected Response:** If the server is working, you'll get a response from the agent (even if it's an error about missing location, it confirms the server is running).

**Method 3: Check Server Logs**
Check the terminal where you started the ADK server - it should show startup messages and request logs.

---

### Endpoint 1: Send Message (Simplified)

**Endpoint:** `POST /run`

**Description:** Send a message to the agent and get a response. This is the simplest way to interact with the API.

**cURL Example:**
```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "What is the weather in Kathmandu today?"
      }]
    }
  }'
```

**Request Body:**
```json
{
  "app_name": "agent",
  "user_id": "u_123",           // Unique user identifier
  "session_id": "s_123",        // Session ID for conversation history
  "new_message": {
    "role": "user",
    "parts": [{
      "text": "Your question here"
    }]
  }
}
```

**Response:**
```json
{
  "response": {
    "parts": [{
      "text": "Today in Kathmandu: 14–21 °C, moderate wind, 1 mm rain."
    }]
  }
}
```

**More cURL Examples:**

```bash
# Ask about clothing
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "What should I wear in New York tomorrow morning?"
      }]
    }
  }'

# Ask about air quality
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "Is the air quality safe in London today?"
      }]
    }
  }'

# Compare days
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "Compare today vs tomorrow for a picnic in Kathmandu"
      }]
    }
  }'
```

---

### Endpoint 3: RESTful Session Endpoint

**Endpoint:** `POST /apps/agent/users/{user_id}/sessions/{session_id}`

**Description:** Create or continue a conversation session. This endpoint maintains conversation history.

**cURL Example:**
```bash
curl -X POST http://localhost:8000/apps/agent/users/u_123/sessions/s_123 \
  -H "Content-Type: application/json" \
  -d '{
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "What is the weather in Kathmandu today?"
      }]
    }
  }'
```

**URL Parameters:**
- `user_id`: Unique identifier for the user (e.g., `u_123`)
- `session_id`: Unique identifier for the session (e.g., `s_123`)

**Request Body:**
```json
{
  "new_message": {
    "role": "user",
    "parts": [{
      "text": "Your question here"
    }]
  }
}
```

**Response:**
```json
{
  "id": "s_123",
  "response": {
    "parts": [{
      "text": "Today in Kathmandu: 14–21 °C, moderate wind, 1 mm rain."
    }]
  }
}
```

**Follow-up Conversation Example:**

```bash
# First message
curl -X POST http://localhost:8000/apps/agent/users/u_123/sessions/s_123 \
  -H "Content-Type: application/json" \
  -d '{
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "Weather in Kathmandu"
      }]
    }
  }'

# Follow-up message (uses same session_id to maintain context)
curl -X POST http://localhost:8000/apps/agent/users/u_123/sessions/s_123 \
  -H "Content-Type: application/json" \
  -d '{
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "What about tomorrow?"
      }]
    }
  }'
```

---

## 🔧 Core Components

### 1. `root_agent` - ADK Agent Instance

**What it does:** This is the main agent instance that handles all user requests. It's a Google ADK `Agent` instance that processes queries using the Gemini model and MCP tools.

**Location:** `weather_agent/agent.py`

**Definition:**
```python
root_agent = Agent(
    model="gemini-2.5-flash",
    name="weather_air_quality_agent",
    description="Weather & Air Quality Assistant using MCP tools.",
    instruction=SYSTEM_PROMPT,
)
```

**Features:**
- ✅ Uses Google Gemini 2.5 Flash model
- ✅ Automatically resolves relative dates ("today", "tomorrow", etc.)
- ✅ Calls MCP tools (`get_weather`, `get_air_quality`) as needed
- ✅ Session management handled by ADK Web
- ✅ Conversation history maintained by ADK

**How it works:**
- ADK Web routes requests to `root_agent`
- The agent uses `SYSTEM_PROMPT` for instructions
- It automatically calls MCP tools when needed
- Responses are formatted according to the system prompt

---

### 2. `MCPServer` - MCP Client Wrapper

**What it does:** Provides async wrapper methods for calling MCP tools.

**Location:** `weather_agent/agent.py`

**Methods:**
```python
async def get_weather(location: str, start: str, end: str) -> Dict[str, Any]
async def get_air_quality(location: str) -> Dict[str, Any]
```

**Example Usage:**
```python
mcp = MCPServer()
weather_data = await mcp.get_weather("Kathmandu", "2025-11-10T00:00:00", "2025-11-10T23:59:59")
aq_data = await mcp.get_air_quality("Kathmandu")
```

---

### 3. `get_current_datetime()` - Date Resolution

**What it does:** Returns the current system time in ISO format for date calculations.

**Location:** `weather_agent/agent.py`

**Function Signature:**
```python
def get_current_datetime() -> str
```

**Returns:** `str` - Current datetime in ISO format (e.g., "2025-11-10T08:13:51.464675")

**Usage:**
- Used in `SYSTEM_PROMPT` to provide current time reference
- Agent uses this to resolve relative dates automatically
- For ADK web, new sessions default to November 10, 2025 as reference date

---

### 4. `SYSTEM_PROMPT` - Agent Instructions

**What it does:** Contains the system instructions for the agent, including date handling, response format, and tool usage guidelines.

**Location:** `weather_agent/agent.py`

**Key Features:**
- Automatic date resolution for "today", "tomorrow", weekdays, etc.
- Structured response format with emojis
- Instructions to use only MCP tools (no fabricated data)
- Clear formatting rules for temperatures, wind, precipitation

---

## 🛠️ MCP Server

The MCP (Model Context Protocol) server provides tools to fetch weather and air quality data. It runs as a separate process and communicates via stdio.

### MCP Server Connection

**Server Type:** stdio-based MCP server

**Server Path:** `mcp-server/index.js`

**Start Command:**
```bash
cd mcp-server
node index.js
```

**Connection Method:** The MCP server communicates via standard input/output (stdio). It's automatically started by the Python agent when needed.

**Health Check (MCP Server):**

The MCP server doesn't expose an HTTP endpoint by default, but you can verify it's working by checking if the Node.js process is running:

```bash
# Check if MCP server process is running
ps aux | grep "node.*index.js"

# Or on Windows
tasklist | findstr node
```

**MCP Server Tools:**

The MCP server exposes the following tools:
- `get_weather` - Fetch weather forecast data
- `get_air_quality` - Fetch air quality data

**Direct MCP Server Test:**

To test the MCP server directly, you can use the Python MCP client:

```python
from agent.mcp_client import MCPClient

client = MCPClient()
# Initialize connection
client._initialize()

# List available tools
tools = client.list_tools()
print(tools)

# Call a tool
result = client.call_tool('get_weather', {'location': 'Kathmandu'})
print(result)
```

**cURL for MCP Server (if HTTP wrapper is available):**

If you have an HTTP wrapper for the MCP server, you can test it with:

```bash
# Note: This requires an HTTP wrapper to be set up
curl -X POST http://localhost:3000/mcp/tools/list \
  -H "Content-Type: application/json"

curl -X POST http://localhost:3000/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_weather",
    "arguments": {
      "location": "Kathmandu"
    }
  }'
```

---

## 🛠️ MCP Tools

MCP (Model Context Protocol) tools are used to fetch weather and air quality data.

### 1. `get_weather` - Weather Data

**What it does:** Fetches weather forecast data from Open-Meteo API.

**Location:** `mcp-server/index.js`

**Parameters:**
- `location` (string or object): Location name (e.g., "Kathmandu") or coordinates `{lat, lon}`
- `start` (string, optional): Start date in ISO 8601 format (e.g., "2025-11-06T00:00:00")
- `end` (string, optional): End date in ISO 8601 format (e.g., "2025-11-07T23:59:59")
- `units` (string, optional): 'metric' or 'imperial' (default: 'metric')

**Returns:** Dictionary with:
- `source`: 'open-meteo'
- `generated_at`: ISO timestamp
- `hourly`: List of hourly forecasts (temp, precip_mm, wind_kph)
- `daily`: List of daily forecasts (tmin, tmax, precip_mm)

**Example Response:**
```json
{
  "source": "open-meteo",
  "generated_at": "2025-11-06T03:35:14Z",
  "hourly": [
    {
      "time": "2025-11-06T00:00:00Z",
      "temp": 15.2,
      "precip_mm": 0,
      "wind_kph": 12.5
    }
  ],
  "daily": [
    {
      "date": "2025-11-06",
      "tmin": 14,
      "tmax": 21,
      "precip_mm": 1.2
    }
  ]
}
```

**How to use (via MCP):**
```python
mcp_server = MCPServer()
weather_data = await mcp_server.call_tool('get_weather', {
    'location': 'Kathmandu',
    'start': '2025-11-06T00:00:00',
    'end': '2025-11-07T23:59:59',
    'units': 'metric'
})
```

---

### 2. `get_air_quality` - Air Quality Data

**What it does:** Fetches air quality data from OpenWeatherMap API.

**Location:** `mcp-server/index.js`

**Parameters:**
- `location` (string or object): Location name (e.g., "Kathmandu") or coordinates `{lat, lon}`
- `parameter` (string, optional): Parameter to fetch ('pm25', 'pm10', 'co', 'no', 'no2', 'o3', 'so2', 'nh3') (default: 'pm25')

**Returns:** Dictionary with:
- `source`: 'openweathermap'
- `generated_at`: ISO timestamp
- `aqi`: Air Quality Index (1-5, where 1=Good, 5=Very Poor)
- `coord`: Coordinates `{lat, lon}`
- `measurements`: List of measurements (parameter, value, unit, time)

**Example Response:**
```json
{
  "source": "openweathermap",
  "generated_at": "2025-11-06T03:35:15Z",
  "aqi": 3,
  "coord": {
    "lat": 27.7172,
    "lon": 85.3240
  },
  "measurements": [
    {
      "parameter": "pm2_5",
      "value": 42.5,
      "unit": "µg/m³",
      "time": "2025-11-06T03:00:00Z"
    }
  ]
}
```

**AQI Levels:**
- 1 = Good
- 2 = Fair
- 3 = Moderate
- 4 = Poor
- 5 = Very Poor

**How to use (via MCP):**
```python
mcp_server = MCPServer()
aq_data = await mcp_server.call_tool('get_air_quality', {
    'location': 'Kathmandu',
    'parameter': 'pm25'
})
```

---

## 🌍 External APIs

### Open-Meteo API

**Purpose:** Weather forecast data

**Base URL:** `https://api.open-meteo.com/v1`

**Endpoints Used:**
- `/forecast` - Weather forecasts
- `/search` - Geocoding (location name to coordinates)

**Authentication:** None required (free API)

**cURL Example:**
```bash
# Get weather forecast
curl "https://api.open-meteo.com/v1/forecast?latitude=27.7172&longitude=85.3240&hourly=temperature_2m,precipitation,wind_speed_10m&daily=temperature_2m_min,temperature_2m_max,precipitation_sum&timezone=auto"

# Geocode location
curl "https://geocoding-api.open-meteo.com/v1/search?name=Kathmandu&count=1&language=en&format=json"
```

---

### OpenWeatherMap API

**Purpose:** Air quality data

**Base URL:** `https://api.openweathermap.org/data/2.5/air_pollution`

**Endpoints Used:**
- `/forecast` - Air quality forecasts

**Authentication:** API key required (set in `OPENWEATHER_API_KEY` environment variable)

**cURL Example:**
```bash
# Get air quality (replace YOUR_API_KEY with your actual key)
curl "https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=27.7172&lon=85.3240&appid=YOUR_API_KEY"
```

**Get API Key:**
1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Get your API key from the dashboard
3. Add it to your `.env` file: `OPENWEATHER_API_KEY=your_key_here`

---

### Google Gemini API

**Purpose:** AI model for query understanding and response generation

**Model:** `gemini-2.5-flash` (primary model used by the agent)

**Authentication:** API key required (set in `GOOGLE_API_KEY` environment variable)

**Get API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file: `GOOGLE_API_KEY=your_key_here`

**Features Used:**
- Natural language understanding
- Automatic date resolution
- Response formatting
- Tool calling (MCP tools)

---

## 📖 Examples & Use Cases

### Example 1: Simple Weather Query

**Question:** "Weather in Kathmandu"

**cURL:**
```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "Weather in Kathmandu"
      }]
    }
  }'
```

**Response:**
```
Monday, November 10, 2025 in Kathmandu: Temperatures will range from 14–21 °C, with a moderate breeze of 12 kph from the west. 1 mm of rain expected.
Air quality: Moderate (PM2.5 ≈ 42 µg/m³).
🌤️ Light layers recommended for the variable temperatures.
```

---

### Example 2: Clothing Recommendation

**Question:** "What should I wear in Kathmandu tomorrow morning?"

**cURL:**
```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "What should I wear in Kathmandu tomorrow morning?"
      }]
    }
  }'
```

**Response:**
```
Tuesday, November 11, 2025 in Kathmandu: Temperatures will range from 21–23 °C, with calm winds of 3 kph. No precipitation is expected.
Air quality: Moderate (PM2.5 ≈ 42 µg/m³).
👕 Light, comfortable clothing will be perfect. Consider a mask if you're sensitive to air pollution.
```

---

### Example 3: Air Quality Check

**Question:** "Is the air quality safe in London today?"

**cURL:**
```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "Is the air quality safe in London today?"
      }]
    }
  }'
```

**Response:**
```
Monday, November 10, 2025 in London: Air quality: Good (PM2.5 ≈ 15 µg/m³).
🌤️ Air quality is ideal for outdoor activities.
```

---

### Example 4: Day Comparison

**Question:** "Compare today vs tomorrow for a picnic in Kathmandu"

**cURL:**
```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "Compare today vs tomorrow for a picnic in Kathmandu"
      }]
    }
  }'
```

**Response:**
```
Monday, November 10, 2025 in Kathmandu: Temperatures will range from 14–21 °C, with a moderate breeze of 12 kph. No precipitation is expected.
Air quality: Poor (PM2.5 ≈ 73 µg/m³).

Tuesday, November 11, 2025 in Kathmandu: Temperatures will range from 12–20 °C, with a moderate breeze of 10 kph. No precipitation is expected.
Air quality data temporarily unavailable.

☁️ Tomorrow is slightly cooler. Consider postponing outdoor plans until air quality data is available.
```

---

### Example 5: Follow-up Query

**First Message:**
```bash
curl -X POST http://localhost:8000/apps/agent/users/u_123/sessions/s_123 \
  -H "Content-Type: application/json" \
  -d '{
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "Weather in Kathmandu"
      }]
    }
  }'
```

**Follow-up (uses same session_id):**
```bash
curl -X POST http://localhost:8000/apps/agent/users/u_123/sessions/s_123 \
  -H "Content-Type: application/json" \
  -d '{
    "new_message": {
      "role": "user",
      "parts": [{
        "text": "What about tomorrow?"
      }]
    }
  }'
```

The agent remembers "Kathmandu" from the previous message!

---

## 🔄 Data Flow

```
User Query
    ↓
ADK Web [Routing & Session Management]
    ↓
root_agent [ADK Agent Instance]
    ↓
SYSTEM_PROMPT [Instructions with get_current_datetime()]
    ↓
Gemini 2.5 Flash [Query Understanding]
    ↓
MCP Tools (get_weather, get_air_quality)
    ↓
MCPServer [Async Wrapper]
    ↓
MCP Client [Communicates with MCP Server]
    ↓
MCP Server (Node.js) [API Calls]
    ↓
External APIs (Open-Meteo, OpenWeatherMap)
    ↓
Gemini 2.5 Flash [Response Generation]
    ↓
Formatted Response to User
```

---

## ⚠️ Error Handling

All APIs include comprehensive error handling:

- **Rate Limits**: Automatic fallback to backup model
- **Network Errors**: Retry with exponential backoff (MCP server)
- **Missing Data**: Graceful degradation with helpful messages
- **Invalid Input**: Validation with clear error messages

**Example Error Response:**
```json
{
  "error": "No forecast data available for that location. Please try a different place name."
}
```

---

## 💾 Session Management

Session state is managed automatically by ADK Web:

- **Conversation History**: Maintained by ADK per session
- **Session Isolation**: Each session ID has independent state
- **Reference Date**: New ADK web sessions default to November 10, 2025

**Best Practice:** Use the same `session_id` for follow-up questions to maintain context.

**Date Handling:**
- The agent automatically resolves relative dates using `get_current_datetime()`
- For ADK web, you can set a custom reference date: "today is november 10, 2025, monday"
- The agent will use this reference date for all relative date calculations

---

## 🚀 Caching

- **API Responses**: 5-minute TTL cache (MCP server)
- **Geocoding**: Cached to avoid repeated API calls
- **Session State**: Maintained by ADK Web

---

## 📝 Notes

- All location names are geocoded dynamically (no hardcoded city lists)
- The agent automatically resolves dates - never asks for dates when you use "today", "tomorrow", etc.
- Responses use explicit dates (e.g., "Monday, November 10, 2025") instead of relative terms
- Responses include emoji recommendations (🌤️, ☔, 😷, 🏃, 👕)
- The agent understands natural language - you don't need to use specific formats
- Supports multiple languages for location names
- Date resolution uses Asia/Kathmandu timezone by default

---

## 🆘 Need Help?

If you encounter issues:

1. **Check API keys** - Make sure `GOOGLE_API_KEY` and `OPENWEATHER_API_KEY` are set in `.env`
2. **Check server** - Ensure ADK server is running on `http://localhost:8000` (start with `adk web`)
3. **Check MCP server** - Ensure Node.js is installed and MCP server can start
4. **Check session** - Use the same `session_id` for follow-up questions
5. **Check date resolution** - The agent automatically resolves dates; for custom dates, say "today is november 10, 2025, monday"
6. **Check logs** - Look for error messages in the terminal

### Quick Verification Commands

```bash
# Test ADK web server (send a test message)
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{"app_name": "agent", "user_id": "test", "session_id": "test", "new_message": {"role": "user", "parts": [{"text": "test"}]}}'

# Check if Node.js is available (required for MCP server)
node --version

# Check if MCP server file exists
ls mcp-server/index.js

# Test MCP server directly
cd mcp-server && node index.js

# Test agent directly (CLI mode)
python -m weather_agent.agent
```

For more help, see the [README.md](README.md) file.
