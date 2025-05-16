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

  const getOrdinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const formatDateDisplay = (date: Date, currentDate: Date): string => {
    const today = new Date(currentDate.setHours(0, 0, 0, 0));
    const forecastDate = new Date(date.setHours(0, 0, 0, 0));
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const currentHour = currentDate.getHours(); // 18:24 PM CEST = 18

    if (forecastDate.getTime() === today.getTime()) {
      return currentHour >= 18 ? 'Tonight' : 'This afternoon';
    } else if (forecastDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      return `${day}${getOrdinalSuffix(day)} ${month}`;
    }
  };

  const groupForecastByDay = (forecast: ForecastData) => {
    const currentDate = new Date('2025-05-18T18:24:00+02:00'); // Current time: 06:24 PM CEST, May 18, 2025
    const grouped: { [key: string]: { dt: number; main: { temp: number }; weather: { description: string; icon: string }[] }[] } = {};
    const dateLabels: { [key: string]: string } = {};

    forecast.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toLocaleDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
        dateLabels[dateKey] = formatDateDisplay(date, currentDate);
      }
      grouped[dateKey].push(item);
    });

    return { grouped, dateLabels };
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
          <div className="flex flex-col gap-6">
            {(() => {
              const { grouped, dateLabels } = groupForecastByDay(forecastData);
              return Object.entries(grouped).map(([dateKey, items]) => (
                <div key={dateKey} className="flex flex-col">
                  <h3 className="text-lg font-medium mb-2">{dateLabels[dateKey]}</h3>
                  <div className="overflow-x-auto scroll-smooth">
                    <div className="flex flex-row gap-4">
                      {items.map((item, index) => {
                        const description = item.weather[0].description;
                        const iconSrc = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
                        return (
                          <div
                            key={index}
                            className={`flex flex-col items-center min-w-[120px] p-2 border-r last:border-r-0 ${
                              darkMode ? 'border-gray-600' : 'border-gray-300'
                            }`}
                          >
                            <span className="text-sm font-medium mb-2">{new Date(item.dt * 1000).getHours()}h</span>
                            <div className={`flex-shrink-0 rounded-full p-1 mb-2 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                              <Image src={iconSrc} alt={description} width={40} height={40} />
                            </div>
                            <span className="text-sm font-medium mb-2">{item.main.temp.toFixed(1)}°C</span>
                            <span className="text-xs text-center capitalize">{description}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}