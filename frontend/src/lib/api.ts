// src/lib/api.ts
import axios from 'axios';

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

export const getWeatherAndSnow = async (latitude: number, longitude: number) => {
  try {
    const url = `/api/onecall?lat=${latitude}&lon=${longitude}`;
    const response = await api.get(url);

    const currentData = response.data?.current;
    const dailyData = response.data?.daily;

    if (!currentData || !dailyData || dailyData.length === 0) {
      console.warn('No current or daily forecast data available.');
      return { weather: null, snowDepth: null };
    }

    // Construct weather data similar to what /weather provides
    const weatherData = {
      name: '', // Note: One Call doesn't provide city name, you'll need to pass it separately or fetch it differently
      main: {
        temp: currentData.temp,
        feels_like: currentData.feels_like,
        humidity: currentData.humidity,
        pressure: currentData.pressure,
      },
      weather: [{ description: currentData.weather[0].description }],
      wind: { speed: currentData.wind_speed, deg: currentData.wind_deg },
      clouds: { all: currentData.clouds },
      visibility: currentData.visibility,
      coord: { lat: latitude, lon: longitude },
      sys: { sunrise: currentData.sunrise, sunset: currentData.sunset },
    };

    // Extract rain Falls from the first day's data (in mm)
    const rainFalls = dailyData[0].rain ?? null;

    // Extract snow depth from the first day's data (in mm) and convert to cm
    const snowDepthMm = dailyData[0].snow ?? null;
    const snowDepth = snowDepthMm !== null ? snowDepthMm / 10 : null;

    return { weather: weatherData, rainFalls, snowDepth };
  } catch (error) {
    console.error('Error fetching weather and snow data:', error);
    return { weather: null, snowDepth: null };
  }
};

export const getForecast = async (latitude: string, longitude: string) => {
  const url = `/api/forecast?lat=${latitude}&lon=${longitude}`;
  const response = await api.get(url);
  return response.data;
};

export const getPrecipitation = async (latitude: string, longitude: string, date: string) => {
  const url = `/api/precipitations?lat=${latitude}&lon=${longitude}&date=${date}`;
  const response = await api.get(url);
  return response.data;
};

export const getOneCallTimeMachine = async (latitude: string, longitude: string, date: string) => {
  const url = `/api/onecalltimemachine?lat=${latitude}&lon=${longitude}&date=${date}`;
  const response = await api.get(url);
  return response.data;
};

export const getOneCallDaySummary = async (latitude: string, longitude: string, date: string) => {
  const url = `/api/onecalldaysummary?lat=${latitude}&lon=${longitude}&date=${date}`;
  const response = await api.get(url);
  return response.data;
};