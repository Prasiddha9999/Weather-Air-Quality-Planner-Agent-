# Logging Documentation

## Overview

The Weather & Air Quality Planner implements comprehensive logging for observability, debugging, and monitoring.

## Log Format

All logs are output in JSON format to stderr (captured by ADK) for easy parsing and analysis.

## Log Types

### 1. Tool Call Success Logs

When a tool is successfully called:

```json
{
  "tool": "get_weather",
  "args": {
    "location": "Kathmandu",
    "start": null,
    "end": null,
    "units": "metric"
  },
  "latency": 234,
  "status": "success"
}
```

**Fields:**
- `tool`: Name of the MCP tool called
- `args`: Arguments passed to the tool
- `latency`: Response time in milliseconds
- `status`: "success"

### 2. Tool Call Error Logs

When a tool call fails:

```json
{
  "tool": "get_weather",
  "args": {
    "location": "InvalidLocation123",
    "start": null,
    "end": null
  },
  "error": "Location \"InvalidLocation123\" not found...",
  "errorCode": "LOCATION_NOT_FOUND",
  "status": "error",
  "timestamp": "2025-01-15T10:30:00.123Z"
}
```

**Fields:**
- `tool`: Name of the MCP tool that failed
- `args`: Arguments that caused the error
- `error`: Error message
- `errorCode`: Error code (e.g., "LOCATION_NOT_FOUND", "API_RATE_LIMIT", "NETWORK_ERROR")
- `status`: "error"
- `timestamp`: ISO 8601 timestamp

### 3. Air Quality Specific Logs

Air quality tool calls include additional information:

```json
{
  "tool": "get_air_quality",
  "args": {
    "location": "New York",
    "parameter": "pm25"
  },
  "latency": 456,
  "status": "success",
  "aqi": 2
}
```

**Additional Fields:**
- `aqi`: Air Quality Index value (1-5)

## Viewing Logs

### During Development

Logs are automatically displayed in the ADK server console:

```bash
adk web start
```

### Filtering Logs

Since logs are in JSON format, you can use tools like `jq` to filter:

```bash
# Filter for errors only
adk web start 2>&1 | jq 'select(.status == "error")'

# Filter for specific tool
adk web start 2>&1 | jq 'select(.tool == "get_weather")'

# Filter for slow requests (>500ms)
adk web start 2>&1 | jq 'select(.latency > 500)'
```

### Logging to File

Redirect stderr to a file:

```bash
adk web start 2> logs/mcp-server.log
```

## Log Analysis

### Common Error Codes

- `LOCATION_NOT_FOUND`: Location could not be geocoded
- `API_RATE_LIMIT`: Rate limit exceeded (429 response)
- `NETWORK_ERROR`: Network request failed
- `TOOL_EXECUTION_ERROR`: General tool execution error
- `INVALID_PARAMS`: Invalid input parameters

### Performance Monitoring

Monitor latency to identify slow API calls:

```bash
# Average latency per tool
adk web start 2>&1 | jq -s 'group_by(.tool) | map({tool: .[0].tool, avg_latency: (map(.latency) | add / length)})'
```

### Error Rate Tracking

Track error rates over time:

```bash
# Count errors by type
adk web start 2>&1 | jq -s 'group_by(.errorCode) | map({errorCode: .[0].errorCode, count: length})'
```

## Best Practices

1. **Monitor Latency**: Track average latency to identify performance issues
2. **Error Alerting**: Set up alerts for high error rates
3. **Log Retention**: Keep logs for at least 7 days for debugging
4. **Privacy**: Logs do not contain user messages or API keys
5. **Structured Format**: JSON format enables easy parsing and analysis

## Integration with Monitoring Tools

The JSON log format is compatible with:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk**
- **Datadog**
- **CloudWatch Logs**
- **Grafana Loki**

Example Logstash configuration:

```ruby
filter {
  if [message] =~ /^{/ {
    json {
      source => "message"
    }
  }
}
```

## Example Log Output

```
{"tool":"get_weather","args":{"location":"Kathmandu","start":null,"end":null,"units":"metric"},"latency":234,"status":"success"}
{"tool":"get_air_quality","args":{"location":"Kathmandu","parameter":"pm25"},"latency":456,"status":"success","aqi":2}
{"tool":"get_weather","args":{"location":"InvalidLocation","start":null,"end":null},"error":"Location \"InvalidLocation\" not found...","errorCode":"LOCATION_NOT_FOUND","status":"error","timestamp":"2025-01-15T10:30:00.123Z"}
```

