// src/components/WeatherDisplay.tsx
'use client';

import { WeatherData } from '@/lib/types';
import { useTheme } from './ThemeProvider';

interface WeatherDisplayProps {
  weatherData: WeatherData | null;
  rainFallsData: number | null;
  snowDepthData: number | null;
}

export default function WeatherDisplay({ weatherData, rainFallsData, snowDepthData }: WeatherDisplayProps) {
  const { darkMode } = useTheme();

  if (!weatherData) return null;

  return (
    <div className={`p-4 rounded mb-4 ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} text-gray-900 dark:text-gray-200`}>
      <h2 className="text-xl mb-2">Weather for {weatherData.name}</h2>
      <p>Temperature: {weatherData.main.temp}°C</p>
      <p>Feels like: {weatherData.main.feels_like}°C</p>
      <p>Description: {weatherData.weather[0].description}</p>
      <p>Wind: {weatherData.wind.speed} m/s, direction {weatherData.wind.deg}°</p>
      <p>Clouds: {weatherData.clouds.all}%</p>
      <p>Visibility: {weatherData.visibility != null ? `${weatherData.visibility / 1000} km` : 'No data available'}</p>
      <p>Coordinates: Lat {weatherData.coord.lat}, Lon {weatherData.coord.lon}</p>
      <p>Sunrise: {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}</p>
      <p>Sunset: {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}</p>
      <p>Humidity: {weatherData.main.humidity}%</p>
      <p>Pressure: {weatherData.main.pressure} hPa</p>
      <p>Total rain falls for today: {rainFallsData !== null ? rainFallsData.toFixed(1) + ' mm' : 'No data available'}</p>
      <p>Total snow falls for today: {snowDepthData !== null ? snowDepthData.toFixed(1) + ' cm' : 'No data available'}</p>
    </div>
  );
}