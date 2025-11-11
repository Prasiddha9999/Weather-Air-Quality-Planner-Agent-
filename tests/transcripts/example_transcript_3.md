# Example Transcript 3: Comparison Query

**Date**: 2025-01-15  
**User**: test_user  
**Session**: session_003

---

## Conversation Flow

### Message 1
**User**: Compare today vs tomorrow for a picnic in Paris

**Expected Agent Behavior**:
- Calls `get_weather` tool for Paris for today
- Calls `get_weather` tool for Paris for tomorrow
- Calls `get_air_quality` tool for Paris (both days)
- Compares conditions for picnic suitability
- Provides recommendation

**Expected Response Format**:
```
[Today's Date] in Paris: [weather summary]
Air quality: [category] (PM2.5 ≈ [value] µg/m³).

[Tomorrow's Date] in Paris: [weather summary]
Air quality: [category] (PM2.5 ≈ [value] µg/m³).

[emoji] [picnic recommendation comparing both days]

Sources: Open-Meteo API, OpenWeatherMap API
```

**Acceptance Criteria**:
- ✅ Both days' weather provided
- ✅ Clear comparison made
- ✅ Picnic-specific recommendation
- ✅ Both dates explicitly stated
- ✅ Sources cited

---

## Notes

- This transcript tests multi-day queries and comparisons
- Should handle activity-specific recommendations
- Comparison should be clear and actionable

