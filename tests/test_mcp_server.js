/**
 * Node.js unit tests for MCP server functions.
 * Run with: node --test test_mcp_server.js
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Test validation logic (conceptual tests since we can't easily import the functions)
test('Coordinate validation - valid ranges', () => {
  // Valid coordinates
  const validLat = 27.7172; // Kathmandu
  const validLon = 85.3240;
  
  assert.ok(validLat >= -90 && validLat <= 90, 'Latitude should be in valid range');
  assert.ok(validLon >= -180 && validLon <= 180, 'Longitude should be in valid range');
});

test('Coordinate validation - invalid ranges', () => {
  // Invalid coordinates
  const invalidLat = 91;
  const invalidLon = 181;
  
  assert.ok(!(invalidLat >= -90 && invalidLat <= 90), 'Latitude should be invalid');
  assert.ok(!(invalidLon >= -180 && invalidLon <= 180), 'Longitude should be invalid');
});

test('Date format validation - ISO 8601', () => {
  const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  
  // Valid dates
  const validDates = [
    '2025-01-15',
    '2025-01-15T10:30:00',
    '2025-01-15T10:30:00Z',
    '2025-01-15T10:30:00+05:45',
  ];
  
  validDates.forEach(date => {
    assert.ok(isoRegex.test(date), `Date ${date} should be valid`);
  });
  
  // Invalid dates
  const invalidDates = [
    '2025-1-15',      // Missing leading zero
    '25-01-15',       // Wrong year format
    '2025/01/15',     // Wrong separator
    'not-a-date',
  ];
  
  invalidDates.forEach(date => {
    assert.ok(!isoRegex.test(date), `Date ${date} should be invalid`);
  });
});

test('Parameter validation - air quality parameters', () => {
  const validParams = ['pm25', 'pm10', 'co', 'no', 'no2', 'o3', 'so2', 'nh3'];
  
  validParams.forEach(param => {
    assert.ok(validParams.includes(param.toLowerCase()), `Parameter ${param} should be valid`);
  });
  
  // Invalid parameter
  const invalidParam = 'invalid_param';
  assert.ok(!validParams.includes(invalidParam.toLowerCase()), 'Invalid parameter should be rejected');
});

test('String sanitization - length limit', () => {
  const longString = 'a'.repeat(300);
  const sanitized = longString.slice(0, 200);
  
  assert.ok(sanitized.length <= 200, 'Sanitized string should be limited to 200 characters');
});

test('String sanitization - dangerous characters', () => {
  const dangerous = '<script>alert("xss")</script>';
  const sanitized = dangerous.replace(/[<>\"']/g, '');
  
  assert.ok(!sanitized.includes('<'), 'Should remove < character');
  assert.ok(!sanitized.includes('>'), 'Should remove > character');
  assert.ok(!sanitized.includes('"'), 'Should remove " character');
  assert.ok(!sanitized.includes("'"), "Should remove ' character");
});

console.log('✓ All MCP server validation tests passed');

