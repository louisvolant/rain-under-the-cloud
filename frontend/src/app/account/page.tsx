'use client';

import { useEffect, useState, useCallback } from 'react';
import { checkAuth } from '@/lib/login_api';
import { getFavorites, addFavorite, removeFavorite, deleteAccount } from '@/lib/account_api';
import { FavoriteLocation, Location } from '@/lib/types';
import { useRouter } from 'next/navigation';
import AccountFavoritesListComponent from '@/app/components/AccountFavoritesListComponent';
import AccountFavoritesAddComponent from '@/app/components/AccountFavoritesAddComponent';
import AccountActionsComponent from '@/app/components/AccountActionsComponent';

export default function Account() {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      const authStatus = await checkAuth();
      if (!authStatus.isAuthenticated) {
        router.push('/');
      } else {
        setIsAuthenticated(true);
      }
    };
    checkAuthentication();
  }, [router]);

  const fetchFavorites = useCallback(async () => {
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
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [refreshTrigger, isAuthenticated, fetchFavorites]);

  const handleAddFavorite = async (location: Location) => {
    try {
      await addFavorite({
        location_name: location.name,
        latitude: location.lat,
        longitude: location.lon,
        country_code: location.country,
      });
      setRefreshTrigger((prev) => prev + 1);
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
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  if (!isAuthenticated)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Loading account...</p>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Account</h1>
      </div>

      <AccountFavoritesListComponent
        favorites={favorites}
        onRemoveFavorite={handleRemoveFavorite}
      />

      <AccountFavoritesAddComponent
        onAddFavorite={handleAddFavorite}
      />

      <AccountActionsComponent
        onDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}