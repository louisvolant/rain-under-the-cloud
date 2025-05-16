// src/components/ForecastDisplay.tsx
'use client';

import Image from 'next/image';
import { ForecastData, WeatherData } from '@/lib/types';
import { useTheme } from './ThemeProvider';
import { getForecast } from '@/lib/weather_api';

interface ForecastDisplayProps {
  weatherData: WeatherData | null;
  forecastData: ForecastData | null;
  setForecastData: (data: ForecastData | null) => void;
  setError: (error: string | null) => void;
}

export default function ForecastDisplay({ weatherData, forecastData, setForecastData, setError }: ForecastDisplayProps) {
  const { darkMode } = useTheme();

  const handleShowForecast = async () => {
    if (!weatherData) return;
    try {
      const data = await getForecast(weatherData.coord.lat.toString(), weatherData.coord.lon.toString());
      setForecastData(data);
      setError(null);
    } catch {
      setError('Failed to fetch forecast');
    }
  };

  const groupForecastByDay = (forecast: ForecastData) => {
    const grouped: { [key: string]: { dt: number; main: { temp: number }; weather: { description: string; icon: string }[] }[] } = {};
    forecast.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  };

  return (
    <div className="mb-4">
      <button
        onClick={handleShowForecast}
        className={`w-full p-2 mb-4 bg-green-500 text-white rounded hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 ${
          !weatherData ? 'opacity-75 cursor-not-allowed' : ''
        }`}
        disabled={!weatherData}
      >
        Show weather forecast
      </button>

      {forecastData && (
        <div className={`p-6 rounded-lg shadow-md mb-4 ${darkMode ? 'bg-green-800' : 'bg-green-50'} text-gray-950 dark:text-gray-100`}>
          <h2 className="text-2xl font-semibold mb-3">Weather Forecast</h2>
          {Object.entries(groupForecastByDay(forecastData)).map(([date, items]) => (
            <div key={date} className="mb-6">
              <h3 className="text-lg font-medium mb-2">{date}</h3>
              <div className="ml-4 space-y-2">
                {items.map((item, index) => {
                  const description = item.weather[0].description;
                  const iconSrc = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
                  return (
                    <div key={index} className="flex items-center">
                      <div className={`flex-shrink-0 rounded-full p-1 mr-3 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                        <Image src={iconSrc} alt={description} width={40} height={40} />
                      </div>
                      <p className="text-base">
                        <span className="font-medium">{new Date(item.dt * 1000).getHours()}h:</span>{' '}
                        {item.main.temp.toFixed(1)}°C, {description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}