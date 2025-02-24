//src/app/page.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { search, getWeather, getPrecipitation, getForecast } from "@/lib/api";

// Default number of days
const DEFAULT_DAYS = 3;

// Define types for weather data and location
interface Location {
  name: string;
  country: string;
  lat: number;
  lon: number;
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
  // Define this based on your API response, e.g.:
  list: { dt: number; main: { temp: number }; weather: { description: string }[] }[];
}

export default function Home() {
  const [numDays, setNumDays] = useState(DEFAULT_DAYS);
  const [city, setCity] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null); // Added type
  const [precipitationData, setPrecipitationData] = useState<PrecipitationData[]>([]);
  const [error, setError] = useState<string | null>(null);

    // Handle city search
    const handleSearch = async () => {
      try {
        const data = await search(city);
        setLocations(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setError('Failed to fetch locations');
        setLocations([]);
      }
    };

  // Handle location selection
  const handleLocationClick = async (location: Location) => {
    try {
      const data = await getWeather(location.name);
      setWeatherData(data);
      setLocations([]);
      setError(null);
    } catch {
      setError('Failed to fetch weather data');
    }
  };

  // Handle forecast display
  const handleShowForecast = async () => {
    if (!weatherData) return;
    try {
      const data = await getForecast(weatherData.coord.lat, weatherData.coord.lon);
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
    const precipitationDataPromises = [];
    const today = new Date();

    for (let i = 1; i <= numDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = date.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
      precipitationDataPromises.push(getPrecipitation(weatherData.coord.lat, weatherData.coord.lon, formattedDate));
    }

    const data = await Promise.all(precipitationDataPromises);
    setPrecipitationData(data);
    setError(null);
  } catch (error) {
    console.error('Error fetching precipitation data:', error);
    setError('Failed to fetch precipitation data');
  }
};

  // Chart rendering functions
  const renderPrecipitationChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={precipitationData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="precipitation" stroke="#8884d8" />
      </LineChart>
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
        <Line type="monotone" dataKey="humidity" stroke="#82ca9d" />
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
        <Line type="monotone" dataKey="cloudCover" stroke="#ff7300" />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center mb-4">
          <Image src="/icon.svg" alt="Rain Under The Cloud" width={50} height={50} />
          <h1 className="text-2xl ml-2">Rain Under The Cloud</h1>
        </div>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter a city"
          className="w-full p-2 mb-4 border rounded"
        />
        <button
          onClick={handleSearch}
          className="w-full p-2 mb-4 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Search
        </button>

        {error && <div className="text-red-600 mb-4">{error}</div>}

        {locations.length > 0 && (
          <div className="mb-4">
            {locations.map((location, index) => (
              <div
                key={index}
                onClick={() => handleLocationClick(location)}
                className="p-2 mb-2 bg-gray-200 cursor-pointer hover:bg-gray-300"
              >
                {location.name}, {location.country}
              </div>
            ))}
          </div>
        )}

        {weatherData && (
          <div className="p-4 bg-blue-100 rounded mb-4">
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
          </div>
        )}

        {weatherData && (
          <>
            <button
              onClick={handleShowForecast}
              className="w-full p-2 mb-4 bg-green-500 text-white rounded hover:bg-green-700"
            >
              Show weather forecast
            </button>
            <button
              onClick={fetchPrecipitations}
              className="w-full p-2 mb-4 bg-blue-500 text-white rounded hover:bg-blue-700"
            >
              View last {numDays} days of precipitation
            </button>
          </>
        )}

        {/* Display forecast data if available */}
        {forecastData && (
          <div className="p-4 bg-green-100 rounded mb-4">
            <h2 className="text-xl mb-2">Weather Forecast</h2>
            {forecastData.list.slice(0, 5).map((item, index) => ( // Show first 5 forecast items
              <div key={index} className="mb-2">
                <p>{new Date(item.dt * 1000).toLocaleString()}: {item.main.temp}°C, {item.weather[0].description}</p>
              </div>
            ))}
          </div>
        )}

        {weatherData && (
          <div className="mb-4">
            <label htmlFor="numDays" className="mr-2">Number of days:</label>
            <input
              type="number"
              id="numDays"
              value={numDays}
              onChange={(e) => setNumDays(parseInt(e.target.value) || DEFAULT_DAYS)}
              min="1"
              className="border rounded p-1"
            />
          </div>
        )}

        {precipitationData.length > 0 && (
          <div className="mt-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-medium mb-2">Precipitation (last {numDays} days)</h3>
              {renderPrecipitationChart()}
            </div>

            <div className="bg-white p-4 rounded shadow mt-4">
              <h3 className="text-lg font-medium mb-2">Humidity (last {numDays} days)</h3>
              {renderHumidityChart()}
            </div>

            <div className="bg-white p-4 rounded shadow mt-4">
              <h3 className="text-lg font-medium mb-2">Cloud Cover (last {numDays} days)</h3>
              {renderCloudCoverChart()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}