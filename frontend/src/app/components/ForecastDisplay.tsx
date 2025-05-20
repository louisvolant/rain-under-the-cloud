// src/components/ForecastDisplay.tsx
'use client';
import { useEffect } from 'react';
import { ForecastData, WeatherData } from '@/lib/types';
import { useTheme } from './ThemeProvider';
import { getForecast } from '@/lib/weather_api';
import { weatherIconMap, weatherIconColorMap, weatherIconAnimationMap } from '@/lib/weatherIconMap';

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
    
      const currentHour = currentDate.getHours(); // 18:30 PM CEST = 18

      if (forecastDate.getTime() === today.getTime()) {
        return currentHour >= 18 ? 'Tonight' : 'This afternoon';
      } else if (forecastDate.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
      } else {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const day = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'long' });
        return `${dayName} ${day}${getOrdinalSuffix(day)} ${month}`;
      }
    };


  const groupForecastByDay = (forecast: ForecastData) => {
    const currentDate = new Date('2025-05-18T18:30:00+02:00'); // Current time: 06:30 PM CEST, May 18, 2025
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

  useEffect(() => {
    if (weatherData && !forecastData) {
      handleShowForecast();
    }
  }, [weatherData]);

  return (
    <div className="mb-4">
      <button
        onClick={handleShowForecast}
        className={`w-full p-2 mb-4 bg-green-500 text-white rounded hover:bg-green-700 dark:bg-green-600 dark:hover:bg-blue-500 ${
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
                    <div className="flex flex-row gap-2">
                      {items.map((item, index) => {
                        return (
                            <div
                              key={index}
                              className={`flex flex-col items-center min-w-[100px] p-1 border-r-[0.5px] last:border-r-0 ${
                                darkMode ? 'border-gray-600' : 'border-gray-300'
                              }`}
                            >
                              <span className="text-xs font-medium mb-1">{new Date(item.dt * 1000).getHours()}h</span>

                              <div className={`flex-shrink-0 rounded-full p-1 mb-1 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                    <i
                                      className={`wi ${weatherIconMap[item.weather[0].icon]} text-3xl ${
                                        weatherIconColorMap[item.weather[0].icon]
                                      } ${weatherIconAnimationMap[item.weather[0].icon] || ''}`}
                                    />
                              </div>

                              <span className="text-xs font-medium mb-1">{item.main.temp.toFixed(1)}°C</span>
                              <span className="text-[10px] text-center capitalize">{item.weather[0].description}</span>
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