# Testing Documentation

This directory contains unit tests, integration tests, and example transcripts for the Weather & Air Quality Planner project.

## Test Structure

```
tests/
├── __init__.py
├── test_mcp_validation.py    # Unit tests for validation functions
├── test_integration.py        # Integration tests for end-to-end flows
├── transcripts/               # Example transcripts (golden transcripts)
│   ├── example_transcript_1.md
│   ├── example_transcript_2.md
│   └── example_transcript_3.md
└── requirements.txt           # Python test dependencies
```

## Running Tests

### Prerequisites

**Important**: Activate the virtual environment first!

**Windows (PowerShell):**
```powershell
.\venv\Scripts\activate
pip install -r tests/requirements.txt
```

**Windows (Git Bash):**
```bash
source venv/Scripts/activate
pip install -r tests/requirements.txt
```

**Linux/Mac:**
```bash
source venv/bin/activate
pip install -r tests/requirements.txt
```

### Unit Tests

Run unit tests for validation functions:

```bash
pytest tests/test_mcp_validation.py -v
```

### Integration Tests

**Important**: Integration tests require the ADK server to be running.

1. Start the ADK server:
```bash
adk web start
```

2. Run integration tests:
```bash
pytest tests/test_integration.py -v -s
```

The `-s` flag shows print statements for debugging.

### Run All Tests

```bash
pytest tests/ -v
```

## Test Coverage

### Unit Tests (`test_mcp_validation.py`)

- ✅ Coordinate validation (lat/lon ranges)
- ✅ Date format validation (ISO 8601)
- ✅ Parameter validation (air quality parameters)
- ✅ String sanitization (length limits, dangerous characters)

### Integration Tests (`test_integration.py`)

- ✅ Health endpoint accessibility
- ✅ Weather query end-to-end
- ✅ Air quality query end-to-end
- ✅ Follow-up query context retention
- ✅ Error handling for invalid requests

## Example Transcripts

The `transcripts/` directory contains golden transcripts that document expected behavior for common user queries:

1. **example_transcript_1.md**: Basic weather query with follow-up
2. **example_transcript_2.md**: Air quality focus with time resolution
3. **example_transcript_3.md**: Comparison query (today vs tomorrow)

Each transcript includes:
- User messages
- Expected agent behavior
- Expected response format
- Acceptance criteria

Use these transcripts to:
- Verify agent behavior matches expectations
- Test new features
- Document expected responses
- Guide manual testing

## Logging

The MCP server logs all tool calls and errors to stderr in JSON format:

```json
{
  "tool": "get_weather",
  "args": {"location": "Kathmandu", "start": null, "end": null},
  "latency": 234,
  "status": "success"
}
```

Error logs include:
```json
{
  "tool": "get_weather",
  "args": {...},
  "error": "Error message",
  "errorCode": "LOCATION_NOT_FOUND",
  "status": "error",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

To view logs:
- Check ADK server console output
- MCP server logs are sent to stderr (captured by ADK)

## Continuous Integration

For CI/CD pipelines:

```bash
# Install dependencies
pip install -r tests/requirements.txt

# Run tests (skip integration tests if server not available)
pytest tests/test_mcp_validation.py -v

# Run integration tests (if server available)
pytest tests/test_integration.py -v || echo "Integration tests skipped - server not available"
```

## Writing New Tests

### Unit Test Example

```python
def test_my_function():
    """Test description."""
    # Arrange
    input_value = "test"
    
    # Act
    result = my_function(input_value)
    
    # Assert
    assert result == expected_value
```

### Integration Test Example

```python
@pytest.mark.asyncio
async def test_my_integration():
    """Test end-to-end flow."""
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.post(
                f"{ADK_SERVER_URL}/run",
                json=payload
            )
            assert response.status_code == 200
        except httpx.ConnectError:
            pytest.skip("ADK server not running")
```

## Troubleshooting

### Tests fail with "ADK server not running"

- Make sure ADK server is started: `adk web start`
- Check that server is running on `http://localhost:8000`
- Verify environment variables are set (API keys)

### Import errors

- Make sure you're in the project root directory
- Install test dependencies: `pip install -r tests/requirements.txt`
- Check Python version (requires 3.8+)

### Integration tests timeout

- Increase timeout in test file if needed
- Check network connectivity
- Verify API keys are valid

