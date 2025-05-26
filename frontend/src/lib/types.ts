// src/lib/types.ts

export interface FavoriteLocation {
  _id: string; // Changed from "id" to "_id"
  location_name: string;
  longitude: number;
  latitude: number;
  user_id?: string; // Optional, since it’s in the response
  __v?: number; // Optional, since it’s in the response
}

export interface Location {
  name: string;
  country: string;
  lat: number;
  lon: number;
  state?: string;
  local_names?: { [key: string]: string };
  location_name?: string;
}


export interface WeatherData {
  name: string;
  country?: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  weather: { description: string }[];
  wind: { speed: number; deg: number };
  clouds: { all: number };
  visibility: number;
  coord: { lat: number; lon: number };
  sys: { sunrise: number; sunset: number };
}

export interface PrecipitationData {
  date: string;
  precipitation: number;
  humidity: number;
  cloudCover: number;
}

export interface ForecastData {
  list: {
    dt: number;
    main: { temp: number };
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    }[];
  }[];
}