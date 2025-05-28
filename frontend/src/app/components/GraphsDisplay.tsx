// src/components/GraphsDisplay.tsx
'use client';

import { ChangeEvent } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PrecipitationData, WeatherData } from '@/lib/types';
import { useTheme } from './ThemeProvider';
import { useLanguage } from '@/context/LanguageContext';
import { getOneCallDaySummary } from '@/lib/weather_api';

interface GraphsDisplayProps {
  weatherData: WeatherData | null;
  precipitationData: PrecipitationData[];
  setPrecipitationData: (data: PrecipitationData[]) => void;
  isLoadingPrecipitation: boolean;
  setIsLoadingPrecipitation: (loading: boolean) => void;
  showGraphs: boolean;
  setShowGraphs: (show: boolean) => void;
  numDays: number | string;
  setNumDays: (days: number | string) => void;
  setError: (error: string | null) => void;
  defaultDays: number;
}

export default function GraphsDisplay({
  weatherData,
  precipitationData,
  setPrecipitationData,
  isLoadingPrecipitation,
  setIsLoadingPrecipitation,
  showGraphs,
  setShowGraphs,
  numDays,
  setNumDays,
  setError,
  defaultDays,
}: GraphsDisplayProps) {
  const { darkMode } = useTheme();
  const { t } = useLanguage();

  const handleNumDaysChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || !isNaN(parseInt(value))) {
      setNumDays(value === '' ? '' : parseInt(value));
    }
  };

  const handleNumDaysBlur = () => {
    const numValue = typeof numDays === 'string' ? parseInt(numDays) : numDays;
    if (numDays === '' || isNaN(numValue) || numValue < 1) {
      setNumDays(defaultDays);
    }
  };

  const fetchPrecipitations = async () => {
    if (!weatherData) return;
    try {
      setIsLoadingPrecipitation(true);
      setShowGraphs(true);
      const precipitationDataPromises = [];
      const today = new Date();
      const days = typeof numDays === 'string' ? parseInt(numDays) || defaultDays : numDays;

      for (let i = 1; i <= days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const formattedDate = date.toISOString().split('T')[0];
        precipitationDataPromises.push(
          getOneCallDaySummary(weatherData.coord.lat.toString(), weatherData.coord.lon.toString(), formattedDate)
        );
      }

      const responses = await Promise.all(precipitationDataPromises);
      const transformedData = responses.map((response) => ({
        date: new Date(response.date).toLocaleDateString(),
        precipitation: response.precipitation?.total || 0,
        humidity: response.humidity?.afternoon || 0,
        cloudCover: response.cloud_cover?.afternoon || 0,
      }));

      setPrecipitationData(transformedData.reverse());
      setError(null);
    } catch (error) {
      console.error('Error fetching precipitation data:', error);
      setError(t('failed_to_fetch_precipitation'));
      setShowGraphs(false);
    } finally {
      setIsLoadingPrecipitation(false);
    }
  };

  const Spinner = () => (
    <div className="flex justify-center items-center h-full">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const renderPrecipitationChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={precipitationData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="precipitation" fill={darkMode ? "#a3bffa" : "#8884d8"} name={t('precipitation_chart_title').replace('{numDays}', String(numDays))} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderHumidityChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={precipitationData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="humidity" stroke={darkMode ? "#a3bffa" : "#82ca9d"} name={t('humidity_chart_title').replace('{numDays}', String(numDays))} />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderCloudCoverChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={precipitationData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="cloudCover" stroke={darkMode ? "#a3bffa" : "#ff7300"} name={t('cloud_cover_chart_title').replace('{numDays}', String(numDays))} />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="mt-4">
      <div className="mb-4">
        <label htmlFor="numDays" className="mr-2 text-gray-900 dark:text-gray-200">
          {t('number_of_days')}
        </label>
        <input
          type="number"
          id="numDays"
          value={numDays}
          onChange={handleNumDaysChange}
          onBlur={handleNumDaysBlur}
          min="1"
          className="border rounded p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        onClick={fetchPrecipitations}
        className={`w-full p-2 mb-4 bg-blue-500 text-white rounded hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 ${
          !weatherData ? 'opacity-75 cursor-not-allowed' : ''
        }`}
        disabled={!weatherData}
      >
        {t('view_precipitation_button').replace('{numDays}', String(numDays))}
      </button>

      {showGraphs && (
        <div>
          <div className={`bg-white dark:bg-gray-800 p-4 rounded shadow ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ minHeight: '380px' }}>
            <h3 className="text-lg font-medium mb-2">{t('precipitation_chart_title').replace('{numDays}', String(numDays))}</h3>
            {isLoadingPrecipitation ? <Spinner /> : precipitationData.length > 0 && renderPrecipitationChart()}
          </div>
          <div className={`bg-white dark:bg-gray-800 p-4 rounded shadow mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ minHeight: '380px' }}>
            <h3 className="text-lg font-medium mb-2">{t('humidity_chart_title').replace('{numDays}', String(numDays))}</h3>
            {isLoadingPrecipitation ? <Spinner /> : precipitationData.length > 0 && renderHumidityChart()}
          </div>
          <div className={`bg-white dark:bg-gray-800 p-4 rounded shadow mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ minHeight: '380px' }}>
            <h3 className="text-lg font-medium mb-2">{t('cloud_cover_chart_title').replace('{numDays}', String(numDays))}</h3>
            {isLoadingPrecipitation ? <Spinner /> : precipitationData.length > 0 && renderCloudCoverChart()}
          </div>
        </div>
      )}
    </div>
  );
}