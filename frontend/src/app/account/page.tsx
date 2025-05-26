// src/app/account/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { checkAuth, changePassword } from '@/lib/login_api';
import { getFavorites, addFavorite, removeFavorite, deleteAccount } from '@/lib/account_api';
import { search, getDistance } from '@/lib/weather_api';
import { FavoriteLocation, Location } from '@/lib/types'; // Ensure FavoriteLocation has country_code
import { useRouter } from 'next/navigation';

export default function Account() {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]); // Location type should have 'country'
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      const authStatus = await checkAuth();
      if (!authStatus.isAuthenticated) {
        router.push('/');
      } else {
        setIsAuthenticated(true);
        // fetchFavorites will be called by the second useEffect
      }
    };
    checkAuthentication();
  }, [router]);

  const fetchFavorites = useCallback(async () => { // Wrapped in useCallback
    if (!isAuthenticated) return;
    try {
      const data = await getFavorites();
      const uniqueFavorites: FavoriteLocation[] = Array.from(
        new Map(data.map((item: FavoriteLocation) => [item._id, item])).values()
      );
      setFavorites(uniqueFavorites);
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  }, [isAuthenticated]); // Added isAuthenticated to dependencies

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [refreshTrigger, isAuthenticated, fetchFavorites]); // Added fetchFavorites to dependencies

  const handleSearch = useCallback(async () => {
    if (!searchCity.trim()) {
      setLocations([]); // Clear locations if search is empty
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
      setLocations([]); // Clear locations on error
    } finally {
      setIsSearching(false);
    }
  }, [searchCity]); // getDistance is stable, no need to list unless it changes

  useEffect(() => {
    if (!searchCity.trim()) {
      setLocations([]); // Clear locations immediately if search city is cleared
      return;
    }
    const debounceTimer = setTimeout(() => {
      handleSearch();
    }, 1000); // Shortened debounce for better UX, adjust as needed

    return () => clearTimeout(debounceTimer);
  }, [searchCity, handleSearch]);

  const handleAddFavorite = async (location: Location) => {
    try {
      await addFavorite({
        location_name: location.name,
        latitude: location.lat,
        longitude: location.lon,
        country_code: location.country // Pass the country code here
      });
      setRefreshTrigger((prev) => prev + 1);
      setLocations([]); // Clear search results
      setSearchCity(''); // Clear search input
    } catch (error) {
      console.error('Error adding favorite:', error);
      alert(`Failed to add favorite: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      await removeFavorite(id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove favorite.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteAccount();
      router.push('/'); // Redirect to homepage or login
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setSuccessMessage('');
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    try {
      await changePassword(newPassword);
      setSuccessMessage('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordForm(false);
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Failed to change password. Please try again.');
    }
  };

  const togglePasswordForm = () => {
    setShowPasswordForm(!showPasswordForm);
    setPasswordError('');
    setSuccessMessage('');
    setNewPassword('');
    setConfirmPassword('');
    if (!showPasswordForm && formRef.current) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
    }
  };

  if (!isAuthenticated) return <div className="flex justify-center items-center h-screen"><p className="text-xl">Loading account...</p></div>; // Or a spinner

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Account</h1>
      </div>

      {/* Favorites List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">My Favorite Locations</h2>
        {favorites.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 italic text-center">No favorites yet. Add some below!</p>
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
                    key={fav._id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                      {fav.country_code && (
                        <span className={`fi fi-${fav.country_code.toLowerCase()} mr-2 rounded`}></span>
                      )}
                      {fav.location_name}
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{fav.latitude.toFixed(4)}</td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{fav.longitude.toFixed(4)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleRemoveFavorite(fav._id)}
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
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mb-4">Add New Favorite</h2>
        <input
          type="text"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
          placeholder="Enter a city to add as favorite"
          className="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
        {/* Removed the separate search button as search is debounced on input change */}
        {isSearching && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Searching...</p>}

        {locations.length > 0 && (
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto"> {/* Added max-height and scroll */}
            {locations.map((location) => (
              <div
                key={`${location.name}-${location.lat}-${location.lon}-${location.country}`} // Added country to key for more uniqueness
                className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="text-gray-900 dark:text-gray-100">
                  {location.country && (
                      <span className={`fi fi-${location.country.toLowerCase()} mr-2 rounded`}></span>
                  )}
                  {location.name}, {location.country} {location.state ? `(${location.state})` : ''}
                </span>
                <button
                  onClick={() => handleAddFavorite(location)}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded transition-colors text-sm" // Made button text smaller
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

      {/* Account Actions & Password Change Form ... (rest of the component remains the same) ... */}
      <div className="flex flex-col items-center space-y-4 md:flex-row md:justify-center md:space-y-0 md:space-x-4">
        <button
          onClick={togglePasswordForm}
          className={`w-full md:w-auto text-white font-medium py-2 px-6 rounded transition-colors ${
            showPasswordForm
              ? 'bg-blue-700 dark:bg-blue-500 ring-2 ring-blue-500'
              : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'
          }`}
        >
          Change My Password
        </button>
        <button
          onClick={handleDeleteAccount}
          className="w-full md:w-auto bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded transition-colors"
        >
          Delete My Account
        </button>
      </div>

      {showPasswordForm && (
        <div
          ref={formRef}
          className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 max-w-md mx-auto relative"
        >
          <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword}>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="Enter new password (min. 8 characters)"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="Confirm new password"
                required
              />
            </div>
            {passwordError && (
              <p className="text-red-500 dark:text-red-400 text-sm mb-4">{passwordError}</p>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-800 border border-green-300 dark:border-green-600 text-green-700 dark:text-green-200 rounded-md animate-fade-in text-sm">
                {successMessage}
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={togglePasswordForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 font-medium py-2 px-4 rounded transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
              >
                Save Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}