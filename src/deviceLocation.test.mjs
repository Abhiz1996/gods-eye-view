import test from 'node:test';
import assert from 'node:assert/strict';
import { requestDeviceLocation } from './deviceLocation.js';

test('requestDeviceLocation resolves a valid one-time browser fix', async () => {
  const result = await requestDeviceLocation({
    getCurrentPosition(success) {
      success({ coords: { latitude: 30.2672, longitude: -97.7431, accuracy: 12 } });
    },
  });
  assert.deepEqual(result, { latitude: 30.2672, longitude: -97.7431, accuracy: 12 });
});

test('requestDeviceLocation gives a useful permission-denied message', async () => {
  await assert.rejects(
    requestDeviceLocation({ getCurrentPosition(_success, failure) { failure({ code: 1 }); } }),
    /permission was denied/,
  );
});

test('requestDeviceLocation rejects when browser geolocation is unavailable', async () => {
  await assert.rejects(requestDeviceLocation(null), /unavailable/);
});
