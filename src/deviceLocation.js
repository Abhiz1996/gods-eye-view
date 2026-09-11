/**
 * Request one device location fix without retaining it. Kept separate from the
 * UI so permission/error behaviour is deterministic and easy to test.
 *
 * @param {Geolocation|undefined|null} geolocation
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number|null}>}
 */
export function requestDeviceLocation(geolocation = globalThis.navigator?.geolocation) {
  if (!geolocation?.getCurrentPosition) {
    return Promise.reject(new Error('Location services are unavailable in this browser.'));
  }

  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position?.coords?.latitude);
        const longitude = Number(position?.coords?.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          reject(new Error('Location services returned an invalid position.'));
          return;
        }
        const accuracy = Number(position.coords.accuracy);
        resolve({ latitude, longitude, accuracy: Number.isFinite(accuracy) ? accuracy : null });
      },
      (error) => {
        const messages = {
          1: 'Location permission was denied. Allow location access and try again.',
          2: 'Your device could not determine a location. Try again outdoors or with Wi-Fi enabled.',
          3: 'Location request timed out. Try again.',
        };
        reject(new Error(messages[error?.code] || 'Could not retrieve your location.'));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
    );
  });
}
