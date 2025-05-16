// src/components/GraphsDisplay.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PrecipitationData } from '@/lib/types';
import { useTheme } from './ThemeProvider';

interface GraphsDisplayProps {
  precipitationData: PrecipitationData[];
  isLoadingPrecipitation: boolean;
  numDays: number | string;
}

export default function GraphsDisplay({ precipitationData, isLoadingPrecipitation, numDays }: GraphsDisplayProps) {
  const { darkMode } = useTheme();

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
        <Bar dataKey="precipitation" fill={darkMode ? "#a3bffa" : "#8884d8"} name="Precipitation (mm)" />
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
        <Line type="monotone" dataKey="humidity" stroke={darkMode ? "#a3bffa" : "#82ca9d"} name="Humidity (%)" />
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
        <Line type="monotone" dataKey="cloudCover" stroke={darkMode ? "#a3bffa" : "#ff7300"} name="Cloud Cover (%)" />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="mt-4">
      <div className={`bg-white dark:bg-gray-800 p-4 rounded shadow ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ minHeight: '380px' }}>
        <h3 className="text-lg font-medium mb-2">Precipitation (last {numDays} days)</h3>
        {isLoadingPrecipitation ? <Spinner /> : precipitationData.length > 0 && renderPrecipitationChart()}
      </div>
      <div className={`bg-white dark:bg-gray-800 p-4 rounded shadow mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ minHeight: '380px' }}>
        <h3 className="text-lg font-medium mb-2">Humidity (last {numDays} days)</h3>
        {isLoadingPrecipitation ? <Spinner /> : precipitationData.length > 0 && renderHumidityChart()}
      </div>
      <div className={`bg-white dark:bg-gray-800 p-4 rounded shadow mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`} style={{ minHeight: '380px' }}>
        <h3 className="text-lg font-medium mb-2">Cloud Cover (last {numDays} days)</h3>
        {isLoadingPrecipitation ? <Spinner /> : precipitationData.length > 0 && renderCloudCoverChart()}
      </div>
    </div>
  );
}