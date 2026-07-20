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

// Coordonnées par défaut (France) — à ajuster si le van change de région.
const DEFAULT_LAT = 47.2184;
const DEFAULT_LON = -1.5536;

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
