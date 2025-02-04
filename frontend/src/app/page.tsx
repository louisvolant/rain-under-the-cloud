// src/app/page.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Default number of days
const DEFAULT_DAYS = 3;

const BACKEND_URL = process.env.BACKEND_URL;
console.log('BACKEND_URL:', process.env.BACKEND_URL);

export default function Home() {
    const [numDays, setNumDays] = useState(DEFAULT_DAYS); // State for number of days
    const [city, setCity] = useState('');
    const [locations, setLocations] = useState([]);
    const [weatherData, setWeatherData] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [error, setError] = useState(null);

    // ... [keeping function implementations the same]

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
                            <div key={index} onClick={() => handleLocationClick(location)} className="p-2 mb-2 bg-gray-200 cursor-pointer hover:bg-gray-300">
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

                {/* Input for number of days */}
                {weatherData && (
                    <div className="mb-4">
                        <label htmlFor="numDays" className="mr-2">Number of days:</label>
                        <input
                            type="number"
                            id="numDays"
                            value={numDays}
                            onChange={e => setNumDays(parseInt(e.target.value) || DEFAULT_DAYS)}
                            min="1"
                            className="border rounded p-1"
                        />
                    </div>
                )}

                {/* Charts section */}
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