// src/components/WeatherDisplay.tsx
'use client';

import { WeatherData } from '@/lib/types';
import { useTheme } from './ThemeProvider';
import { useTranslations, useLocale } from 'next-intl';

interface WeatherDisplayProps {
  weatherData: WeatherData | null;
  rainFallsData: number | null;
  snowDepthData: number | null;
}

export default function WeatherDisplay({ weatherData, rainFallsData, snowDepthData }: WeatherDisplayProps) {
  const { darkMode } = useTheme();
  const t = useTranslations();
  const locale = useLocale();

  if (!weatherData) return null;

  return (
    <div className={`p-4 rounded mb-4 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} text-gray-900 dark:text-gray-200`}>
      <h2 className="text-xl mb-2">{t('weather_for', { name: weatherData.name })}</h2>
      <p>{t('temperature', { value: weatherData.main.temp })}</p>
      <p>{t('feels_like', { value: weatherData.main.feels_like })}</p>
      <p>{t('description_label', { value: weatherData.weather[0].description })}</p>
      <p>{t('wind', { speed: weatherData.wind.speed, deg: weatherData.wind.deg })}</p>
      <p>{t('clouds', { value: weatherData.clouds.all })}</p>
      <p>{t('visibility', { value: weatherData.visibility != null ? (weatherData.visibility / 1000).toFixed(1) : t('no_data') })}</p>
      <p>{t('coordinates', { lat: weatherData.coord.lat, lon: weatherData.coord.lon })}</p>
      <p>{t('sunrise', { value: new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString(locale) })}</p>
      <p>{t('sunset', { value: new Date(weatherData.sys.sunset * 1000).toLocaleTimeString(locale) })}</p>
      <p>{t('humidity', { value: weatherData.main.humidity })}</p>
      <p>{t('pressure', { value: weatherData.main.pressure })}</p>
      <p>{t('rain_falls', { value: rainFallsData !== null ? rainFallsData.toFixed(1) : t('no_data') })}</p>
      <p>{t('snow_falls', { value: snowDepthData !== null ? snowDepthData.toFixed(1) : t('no_data') })}</p>
    </div>
  );
}