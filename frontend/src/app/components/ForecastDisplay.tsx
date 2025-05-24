// src/components/ForecastDisplay.tsx
'use client';

import Image from 'next/image';
import { ForecastData, WeatherData } from '@/lib/types';
import { useTheme } from './ThemeProvider';
import { getForecast } from '@/lib/weather_api';
import { useTranslations, useLocale } from 'next-intl';

interface ForecastDisplayProps {
  weatherData: WeatherData | null;
  forecastData: ForecastData | null;
  setForecastData: (data: ForecastData | null) => void;
  setError: (error: string | null) => void;
}

export default function ForecastDisplay({ weatherData, forecastData, setForecastData, setError }: ForecastDisplayProps) {
  const { darkMode } = useTheme();
  const t = useTranslations();
  const locale = useLocale();

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
    if (locale === 'en') {
      if (day >= 11 && day <= 13) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    }
    return '';
  };

  const formatDateDisplay = (date: Date, currentDate: Date): string => {
    const today = new Date(currentDate.setHours(0, 0, 0, 0));
    const forecastDate = new Date(date.setHours(0, 0, 0, 0));
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const currentHour = currentDate.getHours();

    if (forecastDate.getTime() === today.getTime()) {
      return currentHour >= 18 ? t('tonight') : t('this_afternoon');
    } else if (forecastDate.getTime() === tomorrow.getTime()) {
      return t('tomorrow');
    } else {
      const day = date.getDate();
      const month = date.toLocaleDateString(locale, { month: 'long' });
      return `${day}${getOrdinalSuffix(day)} ${month}`;
    }
  };

  const groupForecastByDay = (forecast: ForecastData) => {
    const currentDate = new Date();
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
        className={`w-full p-2 mb-4 bg-green-500 text-white rounded hover:bg-green-700 dark:bg-green-600 dark:hover:bg-blue-500 ${
          !weatherData ? 'opacity-75 cursor-not-allowed' : ''
        }`}
        disabled={!weatherData}
      >
        {t('show_forecast')}
      </button>

      {forecastData && (
        <div className={`p-6 rounded-lg shadow-md mb-4 ${darkMode ? 'bg-green-800' : 'bg-green-50'} text-gray-950 dark:text-gray-100`}>
          <h2 className="text-2xl font-semibold mb-3">{t('weather_forecast')}</h2>
          <div className="flex flex-col gap-6">
            {(() => {
              const { grouped, dateLabels } = groupForecastByDay(forecastData);
              return Object.entries(grouped).map(([dateKey, items]) => (
                <div key={dateKey} className="flex flex-col">
                  <h3 className="text-lg font-medium mb-2">{dateLabels[dateKey]}</h3>
                  <div className="overflow-x-auto scroll-smooth">
                    <div className="flex flex-row gap-2">
                      {items.map((item, index) => {
                        const description = item.weather[0].description;
                        const iconSrc = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
                        return (
                          <div
                            key={index}
                            className={`flex flex-col items-center min-w-[100px] p-1 border-r-[0.5px] last:border-r-0 ${
                              darkMode ? 'border-gray-600' : 'border-gray-300'
                            }`}
                          >
                            <span className="text-xs font-medium mb-1">{new Date(item.dt * 1000).getHours()}h</span>
                            <div className={`flex-shrink-0 rounded-full p-1 mb-1 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                              <Image src={iconSrc} alt={description} width={36} height={36} />
                            </div>
                            <span className="text-xs font-medium mb-1">{item.main.temp.toFixed(1)}°C</span>
                            <span className="text-[10px] text-center capitalize">{description}</span>
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