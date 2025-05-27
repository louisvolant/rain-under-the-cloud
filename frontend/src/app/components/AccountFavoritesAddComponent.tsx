//src/app/components/AccountFavoritesAddComponent.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { search, getDistance } from '@/lib/weather_api';
import { Location } from '@/lib/types';

interface AccountFavoritesAddComponentProps {
  onAddFavorite: (location: Location) => void;
}

export default function AccountFavoritesAddComponent({
  onAddFavorite,
}: AccountFavoritesAddComponentProps) {
  const [searchCity, setSearchCity] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);

  const handleSearch = useCallback(async () => {
    if (!searchCity.trim()) {
      setLocations([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await search(searchCity);
      if (data.length === 0) {
        setLocations([]);
        return;
      }

      // Your existing grouping and filtering logic for locations
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
            if (cluster.some((cl) => getDistance(loc.lat, loc.lon, cl.lat, cl.lon) <= 1)) {
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
    } catch (error) {
      console.error('Error searching locations:', error);
      setLocations([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchCity]);

  useEffect(() => {
    if (!searchCity.trim()) {
      setLocations([]);
      return;
    }
    const debounceTimer = setTimeout(() => {
      handleSearch();
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [searchCity, handleSearch]);

  const handleAddClick = (location: Location) => {
    onAddFavorite(location);
    setSearchCity(''); // Clear search input
    setLocations([]); // Clear search results
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">Add New Favorite</h2>
      <input
        type="text"
        value={searchCity}
        onChange={(e) => setSearchCity(e.target.value)}
        placeholder="Enter a city to add as favorite"
        className="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      />
      {isSearching && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Searching...</p>}

      {locations.length > 0 && (
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {locations.map((location) => (
            <div
              key={`${location.name}-${location.lat}-${location.lon}-${location.country}`}
              className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-900 dark:text-gray-100">
                {location.country && (
                  <span className={`fi fi-${location.country.toLowerCase()} mr-2 rounded`}></span>
                )}
                {location.name}, {location.country} {location.state ? `(${location.state})` : ''}
              </span>
              <button
                onClick={() => handleAddClick(location)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded transition-colors text-sm"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}
      {searchCity && !isSearching && locations.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No results found for "{searchCity}".</p>
      )}
    </div>
  );
}