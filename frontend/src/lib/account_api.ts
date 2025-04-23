// src/lib/account_api.ts
import axios from 'axios';
import { FavoriteLocation } from '@/lib/types';

console.log('BACKEND_URL:', process.env.BACKEND_URL);

const api = axios.create({
  baseURL: process.env.BACKEND_URL,
  withCredentials: true
});

export async function getFavorites(): Promise<FavoriteLocation[]> {
  const response = await api.get('/api/favorites', { withCredentials: true });
  return response.data;
}

export const addFavorite = async (location: { location_name: string; latitude: number; longitude: number }) => {
  const response = await api.post('/api/add-favorite', location, { withCredentials: true });
  return response.data;
}

export const removeFavorite = async (id: string) => {
  const response = await api.post('/api/remove-favorite', { id }, { withCredentials: true });
  return response.data;
}

export const deleteAccount = async () => {
  const response = await api.post('/api/delete_my_account', {}, { withCredentials: true });
  return response.data;
}