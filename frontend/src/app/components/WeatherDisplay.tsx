// src/components/WeatherDisplay.tsx
'use client';

import { WeatherData } from '@/lib/types';
import { useTheme } from './ThemeProvider';
import { useLanguage } from '@/context/LanguageContext';
import {
  Sun, Cloud, Droplets, Wind, Eye, Sunrise, Sunset, CloudRain, Snowflake
} from 'lucide-react';

interface WeatherDisplayProps {
  weatherData: WeatherData | null;
  rainFallsData: number | null;
  snowDepthData: number | null;
}

export default function WeatherDisplay({ weatherData, rainFallsData, snowDepthData }: WeatherDisplayProps) {
  const { darkMode } = useTheme();
  const { t, tWeather } = useLanguage();
  if (!weatherData) return null;

  const formatTime = (timestamp: number) =>
    new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`p-4 rounded mb-4 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} text-gray-900 dark:text-gray-200`}>
      <h2 className="text-xl font-semibold mb-3 flex items-center">
        {weatherData.country && (
          <span className={`fi fi-${weatherData.country.toLowerCase()} mr-2 rounded`}></span>
        )}
        {weatherData.name}
      </h2>

      {/* Temperature */}
      <div className="flex items-center text-lg mb-2 gap-2">
        <Sun className="w-5 h-5" />
        {weatherData.main.temp.toFixed(1)}{t('celsius_short')}
        <span className="text-sm ml-2">({weatherData.main.feels_like.toFixed(1)}{t('celsius_short')} {t('feels_like')})</span>
      </div>

      <div className="capitalize mb-3 flex items-center gap-2">
        <Cloud className="w-5 h-5" />
        {tWeather(weatherData.weather[0].description)}
      </div>

      {/* Conditions */}
      <div className="text-sm flex flex-wrap gap-x-4 gap-y-2">
        {weatherData.wind.speed > 0 && (
          <div className="flex items-center gap-1">
            <Wind className="w-4 h-4" /> {weatherData.wind.speed} {t('wind_speed_unit')} ({weatherData.wind.deg}°)
          </div>
        )}

        {weatherData.clouds.all > 0 && (
          <div className="flex items-center gap-1">
            <Cloud className="w-4 h-4" /> {weatherData.clouds.all}{t('clouds_unit')}
          </div>
        )}

        {weatherData.visibility && (
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" /> {(weatherData.visibility / 1000).toFixed(0)} {t('visibility_unit')}
          </div>
        )}

        {weatherData.main.humidity && (
          <div className="flex items-center gap-1">
            <Droplets className="w-4 h-4" /> {weatherData.main.humidity}{t('humidity_unit')}
          </div>
        )}

        {rainFallsData !== null && rainFallsData > 0 && (
          <div className="flex items-center gap-1">
            <CloudRain className="w-4 h-4" /> {rainFallsData.toFixed(1)} {t('rain_unit')}
          </div>
        )}

        {snowDepthData !== null && snowDepthData > 0 && (
          <div className="flex items-center gap-1">
            <Snowflake className="w-4 h-4" /> {snowDepthData.toFixed(1)} {t('snow_unit')}
          </div>
        )}
      </div>

      {/* Sunrise & Sunset */}
      <div className="text-xs mt-3 flex gap-4">
        <div className="flex items-center gap-1">
          <Sunrise className="w-4 h-4" /> {formatTime(weatherData.sys.sunrise)}
        </div>
        <div className="flex items-center gap-1">
          <Sunset className="w-4 h-4" /> {formatTime(weatherData.sys.sunset)}
        </div>
      </div>
    </div>
  );
}