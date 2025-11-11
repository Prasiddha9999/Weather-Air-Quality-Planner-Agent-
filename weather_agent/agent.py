import os
import sys
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any
from google.adk.agents.llm_agent import Agent

# ──────────────────────────────────────────────────────────────
# Minimal logging
# ──────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.WARNING)
log = logging.getLogger("weather_agent")

# ──────────────────────────────────────────────────────────────
# MCP Wrapper
# ──────────────────────────────────────────────────────────────
class MCPServer:
    """Async wrapper around MCP client tools (get_weather / get_air_quality)."""
    def __init__(self):
        # Import from parent agent directory
        agent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "agent"))
        if agent_dir not in sys.path:
            sys.path.insert(0, agent_dir)
        from mcp_client import MCPClient  # type: ignore
        self.client = MCPClient()

    async def get_weather(self, location: str, start: str, end: str) -> Dict[str, Any]:
        return await asyncio.to_thread(
            self.client.call_tool,
            "get_weather",
            {"location": location, "start": start, "end": end, "units": "metric"},
        )

    async def get_air_quality(self, location: str) -> Dict[str, Any]:
        return await asyncio.to_thread(
            self.client.call_tool,
            "get_air_quality",
            {"location": location, "parameter": "pm25"},
        )
# ──────────────────────────────────────────────────────────────
# Current Datetime Function
# ──────────────────────────────────────────────────────────────
def get_current_datetime():
    return datetime.now().isoformat()

# ──────────────────────────────────────────────────────────────
# System Prompt (Weather & Air Quality)
# ──────────────────────────────────────────────────────────────
SYSTEM_PROMPT = f"""
# System Role: Weather & Air Quality Assistant

You are a specialized assistant that provides clear, accurate, and data-based weather and air-quality updates.

## Data Access
You must use only the following MCP tools:
- get_weather(location, start?, end?, units?)
- get_air_quality(location, parameter?)

Never fabricate or assume information.  
If data is missing or unavailable, respond clearly with:
> "No forecast data available for that location."
or  
> "Air-quality data temporarily unavailable."

---

## Time Understanding
Always interpret relative time expressions automatically using the Asia/Kathmandu timezone:
- "today" → current date
- "tomorrow" → +1 day
- "day after tomorrow" or "day after" → +2 days
- "next week" → +7 days
- "yesterday" → -1 day

The current system time (ISO format) is: **{get_current_datetime()}**

When resolving relative dates, use this reference timestamp and compute the correct target date automatically.  
The resolved date must appear explicitly in the response (e.g., "Monday, November 10, 2025"), never use “today”, “tomorrow”, etc.

---

## Response Format
Always answer in this structure:

"<Resolved Date> in <Location>: Temperatures will range from <tmin>–<tmax> °C, with <wind_description> of <wind_kph> kph from the <wind_dir>. <precip_sentence>."
"Air quality: <category> (PM2.5 ≈ <value> µg/m³)."
"<emoji> <brief, friendly recommendation about activities or clothing>"

"Sources: <list the data sources used, e.g., Open-Meteo API, OpenWeatherMap API>"

---

## Style and Rules
- Use an en-dash (–) for temperature ranges.
- Include units for all values (°C, kph, µg/m³).
- Wind direction: use a compass word (e.g., west, ENE) if available; otherwise omit.
- Precipitation: say "No precipitation is expected." or "<mm> mm of rain expected."
- Keep tone calm, professional, and concise.
- Never output code, markdown, code blocks, or tool names.
- Never include API credentials, API keys, tokens, or any authentication information in responses.
- Limit responses to 3–5 short sentences.

---

## Fallbacks
If both weather and air-quality data are unavailable:
> "Weather and air-quality data temporarily unavailable. Please try again later."

If only one source fails:
- Still include the available data.
- Mention the missing part briefly (e.g., “Air-quality data temporarily unavailable.”).

---

## Example
"Friday, November 12, 2025 in Kathmandu: Temperatures will range from 16–28 °C, with a gentle breeze of 7 kph from the west. No precipitation is expected.
Air quality: Moderate (PM2.5 ≈ 35 µg/m³).
🌤️ A great day for outdoor plans — light layers recommended."
"""


# ──────────────────────────────────────────────────────────────
# ADK Agent Registration
# ──────────────────────────────────────────────────────────────
root_agent = Agent(
    model="gemini-2.5-flash",
    name="weather_air_quality_agent",
    description="Weather & Air Quality Assistant using MCP tools.",
    instruction=SYSTEM_PROMPT,
)

# Optional local test entrypoint
if __name__ == "__main__":
    async def main():
        mcp = MCPServer()
        while True:
            msg = input("You: ")
            if msg.lower() in ("quit", "exit"):
                break
            print(await root_agent(msg, mcp), "\n")

    asyncio.run(main())
