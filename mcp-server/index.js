#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

// Load API keys from environment variables
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
if (!OPENWEATHER_API_KEY) {
  console.error('ERROR: OPENWEATHER_API_KEY not found in environment variables');
  process.exit(1);
}
const OPENWEATHER_AIR_POLLUTION_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

// In-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 300000; // 5 minutes

function getCacheKey(prefix, args) {
  return `${prefix}:${JSON.stringify(args)}`;
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// Retry with exponential backoff
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
        const waitTime = Math.min(retryAfter * 1000, Math.pow(2, attempt) * 1000);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw new McpError(
          ErrorCode.InternalError,
          'API_RATE_LIMIT',
          `Rate limit exceeded. Please try again later.`
        );
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return { response, latency };
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  throw new McpError(
    ErrorCode.InternalError,
    'NETWORK_ERROR',
    `Network error after ${maxRetries} attempts: ${lastError.message}`
  );
}

// Geocoding helper (using Open-Meteo geocoding API)
async function geocodeLocation(location) {
  if (typeof location === 'object' && location.lat && location.lon) {
    return { lat: location.lat, lon: location.lon };
  }
  
  const cacheKey = getCacheKey('geocode', location);
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  try {
    // If it's a string with lat/lon format, try to parse
    const latLonMatch = location.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
    if (latLonMatch) {
      const coords = { lat: parseFloat(latLonMatch[1]), lon: parseFloat(latLonMatch[2]) };
      setCache(cacheKey, coords);
      return coords;
    }
    
    // Use Open-Meteo geocoding API
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const { response } = await fetchWithRetry(geocodeUrl);
    const geocodeData = await response.json();
    
    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'LOCATION_NOT_FOUND',
        `Location "${location}" not found. Please provide coordinates as "lat,lon" or use {lat, lon} object.`
      );
    }
    
    const result = geocodeData.results[0];
    const coords = { lat: result.latitude, lon: result.longitude };
    setCache(cacheKey, coords);
    return coords;
  } catch (error) {
    if (error instanceof McpError) throw error;
    throw new McpError(
      ErrorCode.InternalError,
      'LOCATION_NOT_FOUND',
      `Could not geocode location: ${error.message}`
    );
  }
}

// Get weather data
async function getWeatherData(location, start, end, units = 'metric') {
  const coords = await geocodeLocation(location);
  const cacheKey = getCacheKey('weather', { coords, start, end, units });
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  const params = new URLSearchParams({
    latitude: coords.lat.toString(),
    longitude: coords.lon.toString(),
    hourly: 'temperature_2m,precipitation,wind_speed_10m',
    daily: 'temperature_2m_min,temperature_2m_max,precipitation_sum',
    timezone: 'auto',
  });
  
  if (start) params.append('start_date', start.split('T')[0]);
  if (end) params.append('end_date', end.split('T')[0]);
  
  const url = `${OPEN_METEO_BASE_URL}/forecast?${params.toString()}`;
  
  const { response, latency } = await fetchWithRetry(url);
  const data = await response.json();
  
  // Log tool call
  console.error(JSON.stringify({
    tool: 'get_weather',
    args: { location, start, end, units },
    latency,
    status: 'success',
  }));
  
  // Transform to expected format
  const hourly = data.hourly.time.map((time, i) => ({
    time: new Date(time).toISOString(),
    temp: data.hourly.temperature_2m[i],
    precip_mm: data.hourly.precipitation[i] || 0,
    wind_kph: (data.hourly.wind_speed_10m[i] || 0) * (units === 'imperial' ? 2.237 : 3.6),
  }));
  
  const daily = data.daily.time.map((date, i) => ({
    date,
    tmin: data.daily.temperature_2m_min[i],
    tmax: data.daily.temperature_2m_max[i],
    precip_mm: data.daily.precipitation_sum[i] || 0,
  }));
  
  const result = {
    source: 'open-meteo',
    generated_at: new Date().toISOString(),
    hourly,
    daily,
  };
  
  setCache(cacheKey, result);
  return result;
}

// Get air quality data using OpenWeatherMap Air Pollution API
async function getAirQualityData(location, parameter = 'pm25') {
  const coords = await geocodeLocation(location);
  const cacheKey = getCacheKey('aq', { coords, parameter });
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  try {
    // Use OpenWeatherMap Air Pollution Forecast API
    const url = `${OPENWEATHER_AIR_POLLUTION_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_API_KEY}`;
    
    const { response, latency } = await fetchWithRetry(url);
    const data = await response.json();
    
    if (!data || !data.list || data.list.length === 0) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'LOCATION_NOT_FOUND',
        'No air quality data found for this location.'
      );
    }
    
    // Get the most recent forecast (first item in list)
    const latest = data.list[0];
    
    // Log tool call
    console.error(JSON.stringify({
      tool: 'get_air_quality',
      args: { location, parameter },
      latency,
      status: 'success',
      aqi: latest.main.aqi,
    }));
    
    // Extract components
    const components = latest.components || {};
    const measurements = [];
    
    // Add PM2.5 and PM10 always
    if (components.pm2_5 !== undefined) {
      measurements.push({
        parameter: 'pm2_5',
        value: components.pm2_5,
        unit: 'µg/m³',
        time: new Date(latest.dt * 1000).toISOString(),
      });
    }
    if (components.pm10 !== undefined) {
      measurements.push({
        parameter: 'pm10',
        value: components.pm10,
        unit: 'µg/m³',
        time: new Date(latest.dt * 1000).toISOString(),
      });
    }
    
    // Add other components if requested
    if (parameter !== 'pm25' && parameter !== 'pm10') {
      const paramMap = {
        'co': 'co',
        'no': 'no',
        'no2': 'no2',
        'o3': 'o3',
        'so2': 'so2',
        'nh3': 'nh3',
      };
      if (paramMap[parameter] && components[paramMap[parameter]] !== undefined) {
        measurements.push({
          parameter: parameter,
          value: components[paramMap[parameter]],
          unit: 'µg/m³',
          time: new Date(latest.dt * 1000).toISOString(),
        });
      }
    }
    
    const result = {
      source: 'openweathermap',
      aqi: latest.main.aqi, // AQI value 1-5
      aqi_meaning: ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'][latest.main.aqi - 1] || 'Unknown',
      coord: data.coord || { lat: coords.lat, lon: coords.lon },
      measurements,
      timestamp: new Date(latest.dt * 1000).toISOString(),
    };
    
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    if (error instanceof McpError) throw error;
    
    // Log error
    console.error(JSON.stringify({
      tool: 'get_air_quality',
      args: { location, parameter },
      error: error.message,
      status: 'error',
    }));
    
    throw new McpError(
      ErrorCode.InternalError,
      'NETWORK_ERROR',
      `Failed to fetch air quality data: ${error.message}`
    );
  }
}

// Create MCP server
const server = new Server(
  {
    name: 'weather-air-quality-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_weather',
      description: 'Get weather forecast for a location. Supports both city names (as "lat,lon" string) and coordinate objects.',
      inputSchema: {
        type: 'object',
        properties: {
          location: {
            oneOf: [
              { type: 'string', description: 'Location as "lat,lon" string or city name' },
              {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lon: { type: 'number' },
                },
                required: ['lat', 'lon'],
              },
            ],
          },
          start: {
            type: 'string',
            description: 'Start date/time in ISO 8601 format (optional)',
          },
          end: {
            type: 'string',
            description: 'End date/time in ISO 8601 format (optional)',
          },
          units: {
            type: 'string',
            enum: ['metric', 'imperial'],
            description: 'Temperature units (default: metric)',
          },
        },
        required: ['location'],
      },
    },
    {
      name: 'get_air_quality',
      description: 'Get air quality measurements for a location. Returns latest measurements from nearest station.',
      inputSchema: {
        type: 'object',
        properties: {
          location: {
            oneOf: [
              { type: 'string', description: 'Location as "lat,lon" string or city name' },
              {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lon: { type: 'number' },
                },
                required: ['lat', 'lon'],
              },
            ],
          },
          parameter: {
            type: 'string',
            enum: ['pm25', 'pm10', 'o3', 'no2'],
            description: 'Air quality parameter to fetch (default: pm25)',
          },
        },
        required: ['location'],
      },
    },
  ],
}));

// Handle tool calls
// Input validation and sanitization helpers
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  // Remove potentially dangerous characters, limit length
  return input.trim().slice(0, 200).replace(/[<>\"']/g, '');
}

function validateLocation(location) {
  if (!location) {
    throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: location');
  }
  
  // If it's an object, validate coordinates
  if (typeof location === 'object') {
    if (typeof location.lat !== 'number' || typeof location.lon !== 'number') {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid coordinates: lat and lon must be numbers');
    }
    // Validate coordinate ranges
    if (location.lat < -90 || location.lat > 90 || location.lon < -180 || location.lon > 180) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid coordinates: lat must be -90 to 90, lon must be -180 to 180');
    }
  } else if (typeof location === 'string') {
    // Sanitize string location
    return sanitizeString(location);
  }
  
  return location;
}

function validateDate(dateString) {
  if (!dateString) return null;
  if (typeof dateString !== 'string') {
    throw new McpError(ErrorCode.InvalidParams, 'Date must be a string in ISO 8601 format');
  }
  // Basic ISO 8601 validation
  const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  if (!isoRegex.test(dateString)) {
    throw new McpError(ErrorCode.InvalidParams, 'Invalid date format. Use ISO 8601 format (e.g., 2025-11-05T00:00:00)');
  }
  return dateString;
}

function validateParameter(parameter) {
  const validParams = ['pm25', 'pm10', 'co', 'no', 'no2', 'o3', 'so2', 'nh3'];
  if (parameter && !validParams.includes(parameter.toLowerCase())) {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameter. Must be one of: ${validParams.join(', ')}`);
  }
  return parameter ? parameter.toLowerCase() : 'pm25';
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // Validate tool name
    if (typeof name !== 'string' || !['get_weather', 'get_air_quality'].includes(name)) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
    
    // Validate and sanitize inputs
    if (name === 'get_weather') {
      const location = validateLocation(args.location);
      const start = validateDate(args.start);
      const end = validateDate(args.end);
      const units = args.units === 'imperial' ? 'imperial' : 'metric';
      
      const result = await getWeatherData(
        location,
        start,
        end,
        units
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    } else if (name === 'get_air_quality') {
      const location = validateLocation(args.location);
      const parameter = validateParameter(args.parameter);
      
      const result = await getAirQualityData(
        location,
        parameter
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    } else {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      'TOOL_EXECUTION_ERROR',
      `Tool execution failed: ${error.message}`
    );
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Weather & Air Quality MCP server running on stdio');
}

main().catch(console.error);

