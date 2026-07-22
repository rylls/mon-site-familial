const CODE_EMOJI = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

export function weatherEmoji(code) {
  return CODE_EMOJI[code] || '🌡️';
}

// Coordonnées par défaut (France) — utilisées tant que personne n'a
// actualisé la localisation depuis l'appareil.
const DEFAULT_LAT = 47.2184;
const DEFAULT_LON = -1.5536;
export const DEFAULT_LOCATION_NAME = 'Nantes';

const LOCATION_KEY = 'wouchi_weather_location';

export function getStoredLocation() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeLocation(location) {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  } catch {}
}

async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=fr`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.address?.town || data.address?.city || data.address?.village || data.address?.municipality || data.address?.county || null;
  } catch {
    return null;
  }
}

// Demande la géolocalisation du navigateur, met à jour et renvoie la
// localisation stockée (coords + nom de ville si trouvé).
export function refreshLocation() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Géolocalisation non disponible'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const name = (await reverseGeocode(lat, lon)) || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        const location = { lat, lon, name };
        storeLocation(location);
        resolve(location);
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  });
}

export async function fetchDailyWeather(dateISO, lat = DEFAULT_LAT, lon = DEFAULT_LON) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis&forecast_days=16`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const idx = data.daily?.time?.indexOf(dateISO);
    if (idx == null || idx === -1) return null;
    return {
      code: data.daily.weathercode[idx],
      max: Math.round(data.daily.temperature_2m_max[idx]),
      min: Math.round(data.daily.temperature_2m_min[idx]),
    };
  } catch {
    return null;
  }
}
