// src/app/Home.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { search, getWeatherAndSnow, getDistance, fetchCachedFavorites } from "@/lib/weather_api";
import { Location, WeatherData, PrecipitationData, ForecastData, CachedFavoriteLocation } from '@/lib/types';
import WeatherDisplay from './components/WeatherDisplay';
import ForecastDisplay from './components/ForecastDisplay';
import GraphsDisplay from './components/GraphsDisplay';
import { useLanguage } from '@/context/LanguageContext';
import { Loader2 } from 'lucide-react';

const DEFAULT_DAYS = 3;
const LOCAL_STORAGE_KEY = 'cachedFavorites';
const DEBOUNCE_DELAY = 500; // Milliseconds for

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
  const [cachedFavorites, setCachedFavorites] = useState<CachedFavoriteLocation[]>([]);

  const { t } = useLanguage();

  useEffect(() => {
    const storedFavorites = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedFavorites) {
      setCachedFavorites(JSON.parse(storedFavorites));
    }

    const loadCachedFavorites = async () => {
      try {
        const favorites = await fetchCachedFavorites();
        setCachedFavorites(favorites);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Error fetching cached favorites:', error);
      }
    };
    loadCachedFavorites();
  }, []);

  // Use useCallback to memoize handleSearch
  const handleSearch = useCallback(async () => {
    // Only search if city is not empty and not just whitespace
    if (!city.trim()) {
      setLocations([]); // Clear previous results if input is empty
      setNoResults(false);
      setError(null);
      return;
    }

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
      setError(t('failed_to_fetch_locations'));
      setLocations([]);
      setNoResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [city, t]); // Add `t` to dependencies if `handleSearch` depends on it

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      handleSearch();
    }, DEBOUNCE_DELAY);

    // Cleanup function to clear the timeout if city changes before the delay
    return () => {
      clearTimeout(handler);
    };
  }, [city, handleSearch]); // Re-run effect when city or handleSearch changes

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLocationClick = async (location: Partial<Location>) => {
    try {
      setIsSearching(true);
      const { weather, rainFalls, snowDepth } = await getWeatherAndSnow(location.lat!, location.lon!);

      if (weather) {
        const weatherDataToSet: WeatherData = weather as WeatherData;
        weatherDataToSet.name = location.name || location.location_name || 'Unknown Location';
        weatherDataToSet.country = location.country;
        setWeatherData(weatherDataToSet);
        setRainFallsData(rainFalls);
        setSnowDepthData(snowDepth);
        setLocations([]);
        setError(null);
      } else {
        setError(t('failed_to_fetch_weather_data'));
      }
    } catch (err) {
      console.error('Error in handleLocationClick:', err);
      setError(t('failed_to_fetch_weather_and_snow'));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex justify-center items-start pt-16" >
      <div className="w-full max-w-4xl mx-4 sm:mx-6 lg:mx-8 px-4 sm:px-6 lg:px-8 py-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8">
        {cachedFavorites.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">{t('popular_locations')}</h3>
            <div className="flex flex-wrap gap-2">
              {cachedFavorites.map((fav, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationClick({ location_name: fav.location_name, lat: fav.lat, lon: fav.lon, country: fav.country })}
                  className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center"
                >
                  {fav.country && (
                    <span className={`fi fi-${fav.country.toLowerCase()} mr-2 rounded`}></span>
                  )}
                  {fav.location_name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search_placeholder')}
            className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !city.trim()} // Disable if searching or input is empty
            className={`flex-shrink-0 p-3 bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 flex items-center justify-center transition-colors ${
              isSearching || !city.trim() ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                {t('searching_text')}
              </>
            ) : (
              t('search_button')
            )}
          </button>
        </div>

        {error && <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>}
        {noResults && <div className="text-gray-600 dark:text-gray-400 mb-4">{t('no_results')}</div>}

        {locations.length > 0 && (
          <div className="mb-4">
            {locations.map((location, index) => (
              <div
                key={index}
                onClick={() => handleLocationClick(location)}
                className="p-2 mb-2 bg-gray-200 dark:bg-gray-700 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200 flex items-center" >
                {location.country && (
                  <span className={`fi fi-${location.country.toLowerCase()} mr-2 rounded`} ></span>
                )}
                {location.name}, {location.country} {location.state ? `(${location.state})` : ''}
              </div>
            ))}
          </div>
        )}

        <WeatherDisplay weatherData={weatherData} rainFallsData={rainFallsData} snowDepthData={snowDepthData} />

        {weatherData && (
          <ForecastDisplay
            weatherData={weatherData}
            forecastData={forecastData}
            setForecastData={setForecastData}
            setError={setError}
          />
        )}

        {weatherData && (
          <GraphsDisplay
            weatherData={weatherData}
            precipitationData={precipitationData}
            setPrecipitationData={setPrecipitationData}
            isLoadingPrecipitation={isLoadingPrecipitation}
            setIsLoadingPrecipitation={setIsLoadingPrecipitation}
            showGraphs={showGraphs}
            setShowGraphs={setShowGraphs}
            numDays={numDays}
            setNumDays={setNumDays}
            setError={setError}
            defaultDays={DEFAULT_DAYS}
          />
        )}
      </div>
    </div>
  );
}