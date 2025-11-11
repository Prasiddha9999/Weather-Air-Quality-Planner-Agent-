# Project 1 — Weather & Air Quality Daily Planner
**API & Goal**: Use **Open-Meteo** (no key) for weather forecasts and **OpenAQ** for air quality. Recommend clothing and outdoor risk based on location/time.

### MCP Tool Spec
- **tool**: `get_weather`  
  - args: `{ location: string | {lat:number, lon:number}, start?: string(ISO), end?: string(ISO), units?: "metric"|"imperial" }`  
  - returns: `{ source: "open-meteo", generated_at: ISO, hourly: Array<{time: ISO, temp: number, precip_mm: number, wind_kph: number}>, daily: Array<{date: YYYY-MM-DD, tmin: number, tmax: number, precip_mm: number}> }`
- **tool**: `get_air_quality`  
  - args: `{ location: string | {lat:number, lon:number}, parameter?: "pm25"|"pm10"|"o3"|"no2" }`  
  - returns: `{ source: "openaq", measurements: Array<{time: ISO, parameter: string, value: number, unit: string}>, nearest_station: string }`
- **Errors**: `LOCATION_NOT_FOUND`, `API_RATE_LIMIT`, `NETWORK_ERROR`

## What Users Might Ask
- What should I wear in **Kathmandu** tomorrow morning?
- Plan a run at **6am Sunday**—safe air quality and low rain?
- Compare **today vs. tomorrow**%$#** for a picnic in kathmandu.
- Give me an **allergy-sensitive** plan for the week.
- Warn me if **wind gusts > 40 kph** this weekend.

## Expected Chat Behavior

**Example Interaction**
- **User**: What should I wear in Kathmandu tomorrow morning?  
- **Agent**: “Tomorrow (Fri), 6–9am: **13–15°C**, light breeze, **0.2–0.5 mm** rain expected, AQI good (PM2.5 ≈ **8 µg/m³**). Wear a **light jacket**, optional cap. Take a **small umbrella** if you’ll be out past 9am. *Sources: Open‑Meteo, OpenAQ. Generated local time.*”

## Acceptance Tests
- Plan includes **temp range**, **precip**, **wind**, **AQI**, and a **recommendation sentence**.
- Supports both **city name** and **lat/lon** inputs.
- Graceful message when nearest air station is far (include station name or distance).

## Stretch Goals
- Rules-based **risk score** (heat/cold/rain/wind/AQI) with color badges.
- Multi-day summary card (table or markdown).

---

# Intern Project: Agentic AI Chat with MCP-wrapped Public API

## Baseline Requirements
- **Architecture**: LLM-based chat agent → MCP server (your wrapper) → Public API. Do **not** call the API directly from the agent; always go through MCP.
- **Observability**: Log tool calls (inputs/outputs), latencies, and errors. Provide a simple `/health` endpoint.
- **Resilience**: Handle API downtime, rate limits, and partial data (graceful responses + retry/backoff).
- **Privacy & Safety**: Never expose raw keys/tokens. Sanitize user input, validate tool args, and defend against prompt injection (treat tool function descriptions as the contract).
- **UX**: Clear, structured answers; cite **data timestamp** and **source**; include **units** and **caveats**.
- **Testing**: Unit tests for MCP tool functions; integration tests for end-to-end flows; golden transcripts for chat.

## Submission
Provide a repo with:
- `agent/`, `mcp-server/`, `tests/`, `README.md` with setup/run steps


## Uniform Evaluation Rubric (0–3 each, total /24)
1. **MCP Integration** – clear function schemas, arg validation, deterministic tool choice  
2. **Reasoning Quality** – synthesizes data, cites source/time, avoids hallucinations  
3. **Robustness** – handles errors, rate limits, empty results gracefully  
4. **User Experience** – clear structure, follows instructions, answers the actual question  
5. **Performance** – sensible caching, low latency, avoids unnecessary calls  
6. **Testing & Docs** – unit/integration tests, README, example transcripts, and logs  

> **Pass threshold**: ≥18/24 with no category = 0.

## Implementation Checklist
- [ ] MCP server scaffolding with **typed schemas** for tools
- [ ] API client + retry/backoff + sensible timeouts
- [ ] Rate-limit handling (429) with exponential backoff and user-visible notice
- [ ] Input validation & normalization (location parsing, currency codes, ids)
- [ ] Caching layer (in-memory TTL keyed by args)
- [ ] Agent tool-use policies (avoid repeated identical calls within 60s for same args)
- [ ] Response formatter with units, timezones, and sources
- [ ] Test suite (unit + e2e) and **golden chat transcripts**

## Starter Prompt (Embed/Adapt)
**System**: You are an assistant that **only** answers using data fetched via MCP tools. If a tool lacks data, say so and offer alternatives. Always include source names and data timestamps.  
**Developer**: Choose the **single best** tool call for each user request. If uncertain, ask one clarifying question. Avoid repeating identical tool calls within 60 seconds for the same args.

---
