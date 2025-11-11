# Weather & Air Quality Planner - API Documentation

## Base URL

```
http://localhost:8000
```

**Note:** Start the server with `adk web` before making API calls.

---

## Main API Endpoints

### 1. Send Message

**Endpoint:** `POST /run`

Send a message to the agent and get a response.

**cURL Example:**
```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "weather_agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{"text": "What is the weather in Kathmandu today?"}]
    }
  }'
```

**Request Body:**
```json
{
  "app_name": "agent",
  "user_id": "u_123",
  "session_id": "s_123",
  "new_message": {
    "role": "user",
    "parts": [{"text": "Your question here"}]
  }
}
```

**Response:**
```json
{
  "response": {
    "parts": [{
      "text": "Today in Kathmandu: 14–21 °C, moderate wind, 1 mm rain. Air quality: Moderate (PM2.5 ≈ 42 µg/m³)."
    }]
  }
}
```

---

### 2. RESTful Session Endpoint

**Endpoint:** `POST /apps/weather_agent/users/{user_id}/sessions/{session_id}`

Alternative endpoint for sending messages (maintains conversation history).

**cURL Example:**
```bash
curl -X POST http://localhost:8000/apps/weather_agent/users/u_123/sessions/s_123 \
  -H "Content-Type: application/json" \
  -d '{
    "new_message": {
      "role": "user",
      "parts": [{"text": "What about tomorrow?"}]
    }
  }'
```

**Request Body:**
```json
{
  "new_message": {
    "role": "user",
    "parts": [{"text": "Your question here"}]
  }
}
```

---

## Example Queries

### Weather Queries
```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "weather_agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{"text": "Weather in Kathmandu"}]
    }
  }'
```

### Air Quality Queries
```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "weather_agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{"text": "Is the air quality safe in London today?"}]
    }
  }'
```

### Clothing Recommendations
```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "weather_agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{"text": "What should I wear in Paris tomorrow morning?"}]
    }
  }'
```

### Activity Planning
```bash
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "weather_agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{"text": "Is it safe to run at 6am Sunday in Kathmandu?"}]
    }
  }'
```

### Follow-up Queries (Same Session)
```bash
# First message
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "weather_agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{"text": "Weather in Kathmandu"}]
    }
  }'

# Follow-up (uses same session_id to maintain context)
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "weather_agent",
    "user_id": "u_123",
    "session_id": "s_123",
    "new_message": {
      "role": "user",
      "parts": [{"text": "What about tomorrow?"}]
    }
  }'
```

---

## Health Check

**Option 1: Use Health Check Script (Recommended)**
```bash
python health.py
```

**Option 2: Test Server with cURL**
```bash
# Test if server is running
curl http://localhost:8000/

# Or test with a simple request
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "weather_agent",
    "user_id": "test",
    "session_id": "test",
    "new_message": {
      "role": "user",
      "parts": [{"text": "test"}]
    }
  }'
```

---

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `app_name` | string | Yes | Always use `"weather_agent"` |
| `user_id` | string | Yes | Unique identifier for the user |
| `session_id` | string | Yes | Session ID for conversation history (use same ID to maintain context) |
| `new_message.role` | string | Yes | Always use `"user"` |
| `new_message.parts[].text` | string | Yes | Your question or message |

---

## Response Format

```json
{
  "response": {
    "parts": [{
      "text": "Agent's response text here"
    }]
  }
}
```

---

## Notes

- **Session Management**: Use the same `session_id` to maintain conversation context
- **User ID**: Can be any unique identifier (e.g., `"u_123"`, `"user_abc"`)
- **Natural Language**: The agent understands natural language queries about weather and air quality
- **Date Resolution**: Automatically resolves "today", "tomorrow", weekdays, etc.

---

## Troubleshooting

**Server not responding:**
- Make sure server is running: `adk web`
- Check if port 8000 is available
- Run `python health.py` to diagnose issues

**Invalid request:**
- Ensure `Content-Type: application/json` header is set
- Verify JSON format is correct
- Check that all required fields are present
