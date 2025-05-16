// src/components/ForecastDisplay.tsx
'use client';

import Image from 'next/image';
import { ForecastData } from '@/lib/types';
import { useTheme } from './ThemeProvider';

interface ForecastDisplayProps {
  forecastData: ForecastData | null;
}

export default function ForecastDisplay({ forecastData }: ForecastDisplayProps) {
  const { darkMode } = useTheme();

  if (!forecastData) return null;

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
  );
}