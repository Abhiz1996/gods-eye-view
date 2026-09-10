import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import handler from '../api/index.js';

test('hosted API routes data middleware and excludes local administration', async (t) => {
  const server = createServer(handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = globalThis.fetch;

  const health = await request(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');

  for (const route of ['/api/setup/status', '/api/setup/keys', '/api/realtime/debug-log', '/api/unknown']) {
    const response = await request(`${base}${route}`, { method: route.endsWith('keys') ? 'POST' : 'GET' });
    assert.equal(response.status, 404, route);
    assert.ok((await response.json()).error);
  }

  const invalidSatellite = await request(`${base}/api/celestrak/invalid_group`);
  assert.equal(invalidSatellite.status, 400);
  assert.equal(await invalidSatellite.text(), 'invalid group');
  const invalidTerrain = await request(`${base}/api/terrain/heights?points=invalid`);
  assert.equal(invalidTerrain.status, 400);
  await invalidTerrain.text();

  // A real HTTP request traverses the hosted adapter; only the provider is mocked.
  globalThis.fetch = async (url) => {
    assert.equal(String(url), 'https://api.adsb.lol/v2/mil');
    return new Response(JSON.stringify({ ac: [{ hex: 'abc123', lat: 30, lon: -97 }] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  };
  t.after(() => { globalThis.fetch = request; });
  const aircraft = await request(`${base}/api/adsblol/mil`);
  assert.equal(aircraft.status, 200);
  assert.equal((await aircraft.json()).ac[0].hex, 'abc123');
});
