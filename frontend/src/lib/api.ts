// src/lib/api.ts
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL;
console.log('BACKEND_URL:', process.env.BACKEND_URL);

const api = axios.create({
  baseURL: process.env.BACKEND_URL,
  withCredentials: true
});


export async function search(city: string) {
  const url = '/api/search?city=' + encodeURIComponent(city);
  console.log('Fetching data from:', url);
  const response = await api.get(url);
  return response.data;
}


export const getWeather = async (city: string) => {
  const url = `/api/weather?city=${city}`;
  const response = await api.get(url);
  return response.data;
};

export const getPrecipitation = async (latitude: string, longitude: string, date: string) => {
  const url = `/api/precipitations?lat=${latitude}&lon=${longitude}&date=${date}`;
  const response = await api.get(url);
  return response.data;
};

export const getForecast = async (latitude: string, longitude: string) => {
  const url = `/api/forecast?lat=${latitude}&lon=${longitude}`;
  const response = await api.get(url);
  return response.data;
};