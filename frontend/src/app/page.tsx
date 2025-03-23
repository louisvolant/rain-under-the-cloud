// src/app/page.tsx
'use client';

import { useState } from 'react';
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

interface PrecipitationData {
  date: string;
  precipitation: number;
  humidity: number;
  cloudCover: number;
}

interface ForecastData {
  list: {
    dt: number;
    main: { temp: number };
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    }[];
  }[];
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
  const [numDays, setNumDays] = useState<number | string>(DEFAULT_DAYS);
  const [city, setCity] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [rainFallsData, setRainFallsData] = useState<number | null>(null);
  const [snowDepthData, setSnowDepthData] = useState<number | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [precipitationData, setPrecipitationData] = useState<PrecipitationData[]>([]);
  const [isLoadingPrecipitation, setIsLoadingPrecipitation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [showGraphs, setShowGraphs] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const data = await search(city);
      setWeatherData(null);
      setForecastData(null);
      setPrecipitationData([]);
      setRainFallsData(null);
      setSnowDepthData(null);
      setShowGraphs(false);
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

      if (filteredLocations.length === 1) {
        await handleLocationClick(filteredLocations[0]);
      } else {
        setLocations(filteredLocations);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to fetch locations');
      setLocations([]);
      setNoResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLocationClick = async (location: Location) => {
    try {
      setIsSearching(true);
      const { weather, rainFalls, snowDepth } = await getWeatherAndSnow(location.lat, location.lon);
      if (weather) {
        weather.name = location.name;
        setWeatherData(weather);
        setRainFallsData(rainFalls);
        setSnowDepthData(snowDepth);
        setLocations([]);
        setError(null);
      } else {
        setError('Failed to fetch weather data');
      }
    } catch {
      setError('Failed to fetch weather and snow data');
    } finally {
      setIsSearching(false);
    }
  };

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

  const handleNumDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || !isNaN(parseInt(value))) {
      setNumDays(value === '' ? '' : parseInt(value));
    }
  };

  const handleNumDaysBlur = () => {
    const numValue = typeof numDays === 'string' ? parseInt(numDays) : numDays;
    if (numDays === '' || isNaN(numValue) || numValue < 1) {
      setNumDays(DEFAULT_DAYS);
    }
  };

  const fetchPrecipitations = async () => {
    if (!weatherData) return;
    try {
      setIsLoadingPrecipitation(true);
      setShowGraphs(true);
      const precipitationDataPromises = [];
      const today = new Date();
      const days = typeof numDays === 'string' ? parseInt(numDays) || DEFAULT_DAYS : numDays;

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
      setError('Failed to fetch precipitation data');
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
    const grouped: { [key: string]: { dt: number; main: { temp: number }; weather: { description: string, icon: string }[] }[] } = {};
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
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="w-full max-w-4xl mx-4 sm:mx-6 lg:mx-8 px-4 sm:px-6 lg:px-8 py-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex items-center justify-end mb-6">
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
          disabled={isSearching}
          className={`w-full p-2 mb-4 bg-blue-500 text-white rounded hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 flex items-center justify-center ${
            isSearching ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isSearching ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Searching...
            </>
          ) : (
            'Search'
          )}
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
            <p>Visibility: {weatherData.visibility != null && weatherData.visibility !== null ? `${weatherData.visibility / 1000} km` : 'No data available'}</p>
            <p>Coordinates: Lat {weatherData.coord.lat}, Lon {weatherData.coord.lon}</p>
            <p>Sunrise: {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}</p>
            <p>Sunset: {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}</p>
            <p>Humidity: {weatherData.main.humidity}%</p>
            <p>Pressure: {weatherData.main.pressure} hPa</p>
            <p>Total rain falls for today: {rainFallsData !== null ? rainFallsData.toFixed(1) + ' mm' : 'No data available'}</p>
            <p>Total snow falls for today: {snowDepthData !== null ? snowDepthData.toFixed(1) + ' cm' : 'No data available'}</p>
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
              <div className="p-6 bg-green-50 dark:bg-green-800 rounded-lg shadow-md mb-4 text-gray-950 dark:text-gray-100">
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
                            <div className="flex-shrink-0 bg-white dark:bg-gray-700 rounded-full p-1 mr-3">
                              <img
                                src={iconSrc}
                                alt={description}
                                width={40}
                                height={40}
                              />
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
              onChange={handleNumDaysChange}
              onBlur={handleNumDaysBlur}
              min="1"
              className="border rounded p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {showGraphs && (
          <div className="mt-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow" style={{ minHeight: '380px' }}>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Precipitation (last {numDays} days)</h3>
              {isLoadingPrecipitation ? (
                <Spinner />
              ) : (
                precipitationData.length > 0 && renderPrecipitationChart()
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mt-4" style={{ minHeight: '380px' }}>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Humidity (last {numDays} days)</h3>
              {isLoadingPrecipitation ? (
                <Spinner />
              ) : (
                precipitationData.length > 0 && renderHumidityChart()
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mt-4" style={{ minHeight: '380px' }}>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Cloud Cover (last {numDays} days)</h3>
              {isLoadingPrecipitation ? (
                <Spinner />
              ) : (
                precipitationData.length > 0 && renderCloudCoverChart()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}