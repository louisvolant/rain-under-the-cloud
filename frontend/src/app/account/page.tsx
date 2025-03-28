// src/app/account/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { checkAuth } from '@/lib/login_api';
import { getFavorites, addFavorite, removeFavorite } from '@/lib/account_api';
import { search, getDistance } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface FavoriteLocation {
  id: string;
  location_name: string;
  longitude: number;
  latitude: number;
}

interface Location {
  name: string;
  country: string;
  lat: number;
  lon: number;
  state?: string;
  local_names?: { [key: string]: string };
}

export default function Account() {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      const authStatus = await checkAuth();
      if (!authStatus.isAuthenticated) {
        router.push('/');
      } else {
        setIsAuthenticated(true);
        fetchFavorites();
      }
    };
    checkAuthentication();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [refreshTrigger, isAuthenticated]);

  const fetchFavorites = async () => {
    try {
      const data = await getFavorites() as FavoriteLocation[]; // Type assertion
      const uniqueFavorites: FavoriteLocation[] = Array.from(
        new Map(data.map((item) => [item.id, item])).values()
      );
      setFavorites(uniqueFavorites);
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchCity.trim()) return; // Avoid searching empty strings
    setIsSearching(true);
    try {
      const data = await search(searchCity);
      if (data.length === 0) {
        setLocations([]);
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
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchCity]); // Dependency on searchCity

  // Debounce effect for automatic search
  useEffect(() => {
    if (!searchCity.trim()) return; // Skip if empty
    const debounceTimer = setTimeout(() => {
      handleSearch();
    }, 2000); // 2-second delay

    // Cleanup timeout on new input or unmount
    return () => clearTimeout(debounceTimer);
  }, [searchCity, handleSearch]);

  const handleAddFavorite = async (location: Location) => {
    try {
      await addFavorite({
        location_name: location.name,
        latitude: location.lat,
        longitude: location.lon
      });
      setRefreshTrigger((prev) => prev + 1);
      setLocations([]);
      setSearchCity('');
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      await removeFavorite(id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Account</h1>
      </div>

      {/* Favorites List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">My Favorite Locations</h2>
        {favorites.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic text-center">No favorites yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">Location Name</th>
                  <th className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">Latitude</th>
                  <th className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">Longitude</th>
                  <th className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {favorites.map((fav) => (
                  <tr
                    key={fav.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{fav.location_name}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{fav.latitude}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{fav.longitude}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleRemoveFavorite(fav.id)}
                        className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Favorite Form */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">Add New Favorite</h2>
        <input
          type="text"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          placeholder="Enter a city"
          className="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className={`w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 font-medium transition-colors ${
            isSearching ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>

        {locations.length > 0 && (
          <div className="mt-4 space-y-2">
            {locations.map((location) => (
              <div
                key={`${location.name}-${location.lat}-${location.lon}`}
                className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-gray-900 dark:text-gray-100">
                  {location.name}, {location.country} {location.state ? `(${location.state})` : ''}
                </span>
                <button
                  onClick={() => handleAddFavorite(location)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded transition-colors"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}