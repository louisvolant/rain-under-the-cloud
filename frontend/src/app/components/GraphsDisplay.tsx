// src/components/GraphsDisplay.tsx
'use client';

import { ChangeEvent, useState, useCallback, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PrecipitationData, WeatherData } from '@/lib/types';
import { useTheme } from './ThemeProvider';
import { useLanguage } from '@/context/LanguageContext';
import { getOneCallMonthSummary } from '@/lib/weather_api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GraphsDisplayProps {
  weatherData: WeatherData | null;
  precipitationData: PrecipitationData[];
  setPrecipitationData: (data: PrecipitationData[]) => void;
  isLoadingPrecipitation: boolean;
  setIsLoadingPrecipitation: (loading: boolean) => void;
  showGraphs: boolean;
  setShowGraphs: (show: boolean) => void;
  setError: (error: string | null) => void;
}

export default function GraphsDisplay({
  weatherData,
  precipitationData,
  setPrecipitationData,
  isLoadingPrecipitation,
  setIsLoadingPrecipitation,
  showGraphs,
  setShowGraphs,
  setError,
}: GraphsDisplayProps) {
  const { darkMode } = useTheme();
  const { t } = useLanguage();

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    // Initialize to the first day of the current month
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Function to format the month for display
  const getDisplayMonth = useCallback((date: Date) => {
    return date.toLocaleDateString(t('locale_code'), { year: 'numeric', month: 'long' });
  }, [t]); // Depend on 't' to re-render if language changes

  // Fetch data when weatherData or currentMonthDate changes
  const fetchMonthData = useCallback(async () => {
    if (!weatherData) {
      setPrecipitationData([]); // Clear data if no location selected
      setShowGraphs(false);
      return;
    }

    try {
      setIsLoadingPrecipitation(true);
      setShowGraphs(true);
      setError(null);

      const year = currentMonthDate.getFullYear();
      const month = currentMonthDate.getMonth() + 1; // getMonth() is 0-indexed

      const responses = await getOneCallMonthSummary(
        weatherData.coord.lat.toString(),
        weatherData.coord.lon.toString(),
        year,
        month
      );

      // Transform data: responses is an array of daily summaries
      const transformedData = responses.map((response: any) => ({
        date: new Date(response.date).toLocaleDateString(t('locale_code'), { day: 'numeric', month: 'short' }), // Format date for XAxis
        precipitation: response.precipitation?.total || 0,
        humidity: response.humidity?.afternoon || 0,
        cloudCover: response.cloud_cover?.afternoon || 0,
      }));

      // Sort by date to ensure correct graph display
      transformedData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());


      setPrecipitationData(transformedData);
    } catch (error) {
      console.error('Error fetching monthly precipitation data:', error);
      setError(t('failed_to_fetch_precipitation_month')); // You might need a new translation key
      setShowGraphs(false);
      setPrecipitationData([]);
    } finally {
      setIsLoadingPrecipitation(false);
    }
  }, [weatherData, currentMonthDate, setPrecipitationData, setIsLoadingPrecipitation, setShowGraphs, setError, t]);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]); // Re-fetch when fetchMonthData (and thus currentMonthDate/weatherData) changes

  const handlePreviousMonth = () => {
    setCurrentMonthDate((prevDate) => {
      const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prevDate) => {
      const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1);
      return newDate;
    });
  };

  // Check if the current displayed month is the actual current month
  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return (
      currentMonthDate.getFullYear() === today.getFullYear() &&
      currentMonthDate.getMonth() === today.getMonth()
    );
  }, [currentMonthDate]);

  const Spinner = () => (
    <div className="flex justify-center items-center h-full min-h-[300px]">
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
        <Bar dataKey="precipitation" fill={darkMode ? "#a3bffa" : "#8884d8"} name={t('precipitation')} />
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
        <Line type="monotone" dataKey="humidity" stroke={darkMode ? "#a3bffa" : "#82ca9d"} name={t('humidity')} />
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
        <Line type="monotone" dataKey="cloudCover" stroke={darkMode ? "#a3bffa" : "#ff7300"} name={t('cloud_cover')} />
      </LineChart>
    </ResponsiveContainer>
  );

  // Helper to ensure 'locale_code' is available in translations
  // Add these to your locale JSONs (e.g., en.json: "locale_code": "en-US", fr.json: "locale_code": "fr-FR")
  const getLocaleForDateFormatting = () => {
    const localeCode = t('locale_code');
    return localeCode === 'locale_code' ? 'en-US' : localeCode; // Fallback if not translated
  };

  return (
    <div className="mt-4">
      {/* Navigation and Month Display */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePreviousMonth}
          className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoadingPrecipitation || !weatherData}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {getDisplayMonth(currentMonthDate)}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoadingPrecipitation || isCurrentMonth || !weatherData}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Button to show graphs (or remove if graphs are always shown) */}
      <button
        onClick={() => fetchMonthData()} // Re-fetch explicitly if needed, or rely on useEffect
        className={`w-full p-2 mb-4 bg-blue-500 text-white rounded hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 ${
          !weatherData ? 'opacity-75 cursor-not-allowed' : ''
        }`}
        disabled={!weatherData || isLoadingPrecipitation}
      >
        {t('view_month_data')}
      </button>

      {showGraphs && (
        <div>
          {isLoadingPrecipitation ? (
            <Spinner />
          ) : precipitationData.length > 0 ? (
            <>
              <div className={`bg-white dark:bg-gray-800 p-4 rounded shadow ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ minHeight: '380px' }}>
                <h3 className="text-lg font-medium mb-2">{t('precipitation_chart_title')}</h3>
                {renderPrecipitationChart()}
              </div>
              <div className={`bg-white dark:bg-gray-800 p-4 rounded shadow mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ minHeight: '380px' }}>
                <h3 className="text-lg font-medium mb-2">{t('humidity_chart_title')}</h3>
                {renderHumidityChart()}
              </div>
              <div className={`bg-white dark:bg-gray-800 p-4 rounded shadow mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ minHeight: '380px' }}>
                <h3 className="text-lg font-medium mb-2">{t('cloud_cover_chart_title')}</h3>
                {renderCloudCoverChart()}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-600 dark:text-gray-400">
              {t('no_data_for_month')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}