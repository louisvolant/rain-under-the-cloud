// src/lib/account_api.ts
import axios from 'axios';

console.log('BACKEND_URL:', process.env.BACKEND_URL);

const api = axios.create({
  baseURL: process.env.BACKEND_URL,
  withCredentials: true
});

export const getFavorites = async () => {
  const response = await api.get('/api/favorites', { withCredentials: true });
  return response.data;
};

export const addFavorite = async (location: { location_name: string; latitude: number; longitude: number }) => {
  const response = await api.post('/api/add-favorite', location, { withCredentials: true });
  return response.data;
};

export const removeFavorite = async (id: string) => {
  const response = await api.post('/api/remove-favorite', { id }, { withCredentials: true });
  return response.data;
};