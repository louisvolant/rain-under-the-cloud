// src/app/account/page.tsx
'use client';

import { useEffect, useState } from 'react';
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
  const [refreshTrigger, setRefreshTrigger] = useState(0); // For refreshing table
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
      const data = await getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  const handleSearch = async () => {
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
                (cl) => getDistance(loc.lat, loc.lon, cl.lat, cl.lon) <= 1 // Use imported getDistance
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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddFavorite = async (location: Location) => {
    try {
      await addFavorite({
        location_name: location.name,
        latitude: location.lat,
        longitude: location.lon
      });
      setRefreshTrigger(prev => prev + 1); // Trigger refresh
      setLocations([]);
      setSearchCity('');
    } catch (error) {
      console.error('Error adding favorite:', error);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      await removeFavorite(id);
      setRefreshTrigger(prev => prev + 1); // Trigger refresh
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Account</h1>
      </div>

      {/* Favorites List */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">My Favorite Locations</h2>
        {favorites.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic">No favorites yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                  <th className="py-2 px-4">Location Name</th>
                  <th className="py-2 px-4">Latitude</th>
                  <th className="py-2 px-4">Longitude</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {favorites.map((fav) => (
                  <tr key={fav.id} className="text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">
                    <td className="py-2 px-4">{fav.location_name}</td>
                    <td className="py-2 px-4">{fav.latitude}</td>
                    <td className="py-2 px-4">{fav.longitude}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => handleRemoveFavorite(fav.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded transition-colors"
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
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">Add New Favorite</h2>
        <input
          type="text"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a city"
          className="w-full p-2 mb-4 border rounded bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className={`w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors ${
            isSearching ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>

        {locations.length > 0 && (
          <div className="mt-4">
            {locations.map((location, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 mb-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-gray-800 dark:text-gray-200">
                  {location.name}, {location.country} {location.state ? `(${location.state})` : ''}
                </span>
                <button
                  onClick={() => handleAddFavorite(location)}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded transition-colors"
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