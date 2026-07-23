'use client';
import { useEffect, useState } from 'react';
import { parseDate, formatRange, startOfToday, fmtDate } from '../../lib/dates';
import { fetchDailyWeather, weatherEmoji, DEFAULT_LOCATION_NAME, getStoredLocation, refreshLocation } from '../../lib/weather';
import { haptic } from '../../lib/haptics';
import { useToast } from '../ToastProvider';

export default function WeatherCard({ trip, isActive }) {
  const [weather, setWeather] = useState(undefined);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);
  const showToast = useToast();

  const weatherDate = trip ? (isActive ? fmtDate(startOfToday()) : fmtDate(parseDate(trip.start_date))) : null;

  useEffect(() => {
    setLocation(getStoredLocation());
  }, []);

  useEffect(() => {
    if (!weatherDate) { setWeather(undefined); return; }
    let cancelled = false;
    setWeather(undefined);
    fetchDailyWeather(weatherDate, location?.lat, location?.lon).then((w) => {
      if (!cancelled) setWeather(w);
    });
    return () => { cancelled = true; };
  }, [weatherDate, location?.lat, location?.lon]);

  async function handleRefreshLocation() {
    haptic.tap();
    setLocating(true);
    setLocError(false);
    try {
      const loc = await refreshLocation();
      setLocation(loc);
      showToast(`Localisation mise à jour · ${loc.name}`);
    } catch {
      setLocError(true);
    } finally {
      setLocating(false);
    }
  }

  if (!trip || weather === null) return null;

  return (
    <div className="home-card weather-card">
      <div className="home-card-title weather-card-title">
        <span>Météo {isActive ? 'du jour' : 'au départ'} · {location?.name || DEFAULT_LOCATION_NAME}</span>
        <button
          className="weather-refresh-btn"
          title="Actualiser la localisation"
          aria-label="Actualiser la localisation"
          onClick={handleRefreshLocation}
          disabled={locating}
        >
          {locating ? '…' : '📍'}
        </button>
      </div>
      {locError && <div className="weather-loc-error">Localisation indisponible. Vérifie les autorisations.</div>}
      {weather === undefined ? (
        <div className="weather-body">
          <span className="skeleton skeleton-circle" />
          <div>
            <div className="skeleton skeleton-line" style={{ width: '64px', height: '16px' }} />
            <div className="skeleton skeleton-line" style={{ width: '48px', height: '11px', marginTop: '6px' }} />
          </div>
        </div>
      ) : (
        <div className="weather-body">
          <span className="weather-emoji">{weatherEmoji(weather.code)}</span>
          <div>
            <div className="weather-temps">{weather.min}° / {weather.max}°</div>
            <div className="weather-date">{formatRange(weatherDate, weatherDate)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
