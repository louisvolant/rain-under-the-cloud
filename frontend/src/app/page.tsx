// src/app/page.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { search, getWeatherAndSnow, getForecast, getOneCallDaySummary } from "@/lib/api";
import { useTheme } from './ThemeProvider';

// Default number of days
const DEFAULT_DAYS = 3;

// Define types for weather data and location
interface Location {
  name: string;
  country: string;
  lat: number;
  lon: number;
  state?: string;
  local_names?: { [key: string]: string };
}

interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: { description: string }[];
  wind: { speed: number; deg: number };
  clouds: { all: number };
  visibility: number;
  coord: { lat: number; lon: number };
  sys: { sunrise: number; sunset: number };
}

interface SnowDepthData {
  depth: number | null;
}

interface PrecipitationData {
  date: string;
  precipitation: number;
  humidity: number;
  cloudCover: number;
}

interface ForecastData {
  list: { dt: number; main: { temp: number }; weather: { description: string }[] }[];
}


// Function to calculate distance between two lat/lon points (in kilometers)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function Home() {
  const [numDays, setNumDays] = useState(DEFAULT_DAYS);
  const [city, setCity] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [snowDepthData, setSnowDepthData] = useState<number | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [precipitationData, setPrecipitationData] = useState<PrecipitationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [showGraphs, setShowGraphs] = useState(false); // New state for graph visibility
  const { darkMode, toggleDarkMode } = useTheme();

  // Handle city search with filtering
  const handleSearch = async () => {
    try {
      const data = await search(city);
      setWeatherData(null);
      setForecastData(null);
      setPrecipitationData([]);
      setSnowDepthData(null);
      setShowGraphs(false); // Reset graph visibility on new search
      setNoResults(false);

      if (data.length === 0) {
        setNoResults(true);
        setLocations([]);
        setError(null);
        return;
      }

      const groupedLocations: { [key: string]: Location[] } = {};
      data.forEach((loc: Location) => {
        const key = `${loc.name}-${loc.country}-${loc.state || ''}`;
        if (!groupedLocations[key]) {
          groupedLocations[key] = [];
        }
        groupedLocations[key].push(loc);
      });

      const filteredLocations = Object.values(groupedLocations).map((group) => {
        if (group.length === 1) return group[0];

        const clusters: Location[][] = [];
        group.forEach((loc) => {
          let added = false;
          for (const cluster of clusters) {
            if (
              cluster.some(
                (cl) => getDistance(loc.lat, loc.lon, cl.lat, cl.lon) <= 1
              )
            ) {
              cluster.push(loc);
              added = true;
              break;
            }
          }
          if (!added) clusters.push([loc]);
        });

        return clusters.map((cluster) =>
          cluster.reduce((best, current) => {
            const bestLocalNamesCount = Object.keys(best.local_names || {}).length;
            const currentLocalNamesCount = Object.keys(current.local_names || {}).length;
            return currentLocalNamesCount > bestLocalNamesCount ? current : best;
          })
        )[0];
      });

      setLocations(filteredLocations);
      setError(null);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to fetch locations');
      setLocations([]);
      setNoResults(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle location selection
  const handleLocationClick = async (location: Location) => {
    try {
      const { weather, snowDepth } = await getWeatherAndSnow(location.lat, location.lon);
      if (weather) {
        weather.name = location.name;
        setWeatherData(weather);
        setSnowDepthData(snowDepth);
        setLocations([]);
        setError(null);
      } else {
        setError('Failed to fetch weather data');
      }
    } catch {
      setError('Failed to fetch weather and snow data');
    }
  };

  // Handle forecast display
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

  // Fetch precipitation data
  const fetchPrecipitations = async () => {
    if (!weatherData) return;
    try {
      setShowGraphs(true); // Show graph containers before fetching data
      const precipitationDataPromises = [];
      const today = new Date();

      for (let i = 1; i <= numDays; i++) {
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

      setPrecipitationData(transformedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching precipitation data:', error);
      setError('Failed to fetch precipitation data');
      setShowGraphs(false); // Hide graphs if fetch fails
    }
  };


  // Chart rendering functions
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

  const groupForecastByDay = (forecast: ForecastData) => {
    const grouped: { [key: string]: { dt: number; main: { temp: number }; weather: { description: string }[] }[] } = {};
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
    <div className={`flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300`}>
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Image src="/icon.svg" alt="Rain Under The Cloud" width={50} height={50} />
            <h1 className="text-2xl ml-2 text-gray-900 dark:text-white">Rain Under The Cloud</h1>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a city"
          className="w-full p-2 mb-4 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          className="w-full p-2 mb-4 bg-blue-500 text-white rounded hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          Search
        </button>

        {error && <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>}
        {noResults && <div className="text-gray-600 dark:text-gray-400 mb-4">No result found for this place</div>}

        {locations.length > 0 && (
          <div className="mb-4">
            {locations.map((location, index) => (
              <div
                key={index}
                onClick={() => handleLocationClick(location)}
                className="p-2 mb-2 bg-gray-200 dark:bg-gray-700 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200"
              >
                {location.name}, {location.country} {location.state ? `(${location.state})` : ''}
              </div>
            ))}
          </div>
        )}

        {weatherData && (
          <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded mb-4 text-gray-900 dark:text-gray-200">
            <h2 className="text-xl mb-2">Weather for {weatherData.name}</h2>
            <p>Temperature: {weatherData.main.temp}°C</p>
            <p>Feels like: {weatherData.main.feels_like}°C</p>
            <p>Description: {weatherData.weather[0].description}</p>
            <p>Wind: {weatherData.wind.speed} m/s, direction {weatherData.wind.deg}°</p>
            <p>Clouds: {weatherData.clouds.all}%</p>
            <p>Visibility: {weatherData.visibility / 1000} km</p>
            <p>Coordinates: Lat {weatherData.coord.lat}, Lon {weatherData.coord.lon}</p>
            <p>Sunrise: {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}</p>
            <p>Sunset: {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}</p>
            <p>Humidity: {weatherData.main.humidity}%</p>
            <p>Pressure: {weatherData.main.pressure} hPa</p>
            {snowDepthData !== null ? (
              <p>Snow falls for today: {snowDepthData.toFixed(1)} cm</p>
            ) : (
              <p>Snow falls for today: No data available</p>
            )}
          </div>
        )}

        {weatherData && (
          <>
            <button
              onClick={handleShowForecast}
              className="w-full p-2 mb-4 bg-green-500 text-white rounded hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500"
            >
              Show weather forecast
            </button>
            {forecastData && (
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded mb-4 text-gray-900 dark:text-gray-200">
                <h2 className="text-xl mb-2">Weather Forecast</h2>
                {Object.entries(groupForecastByDay(forecastData)).map(([date, items]) => (
                  <div key={date} className="mb-4">
                    <h3 className="text-lg font-medium">{date}</h3>
                    {items.map((item, index) => (
                      <p key={index} className="ml-4">
                        {new Date(item.dt * 1000).getHours()}h: {item.main.temp}°C, {item.weather[0].description}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={fetchPrecipitations}
              className="w-full p-2 mb-4 bg-blue-500 text-white rounded hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              View last {numDays} days of precipitation
            </button>
          </>
        )}

        {weatherData && (
          <div className="mb-4">
            <label htmlFor="numDays" className="mr-2 text-gray-900 dark:text-gray-200">
              Number of days:
            </label>
            <input
              type="number"
              id="numDays"
              value={numDays}
              onChange={(e) => setNumDays(parseInt(e.target.value) || DEFAULT_DAYS)}
              min="1"
              className="border rounded p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {showGraphs && (
          <div className="mt-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow" style={{ minHeight: '380px' }}>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Precipitation (last {numDays} days)</h3>
              {precipitationData.length > 0 && renderPrecipitationChart()}
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mt-4" style={{ minHeight: '380px' }}>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Humidity (last {numDays} days)</h3>
              {precipitationData.length > 0 && renderHumidityChart()}
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mt-4" style={{ minHeight: '380px' }}>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Cloud Cover (last {numDays} days)</h3>
              {precipitationData.length > 0 && renderCloudCoverChart()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
