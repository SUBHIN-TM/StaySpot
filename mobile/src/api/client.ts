import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
export const TOKEN_KEY = 'staymate.token';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
});

// Attach the JWT to every request once it's stored.
let inMemoryToken: string | null = null;

export async function setToken(token: string | null) {
  inMemoryToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function loadToken(): Promise<string | null> {
  if (inMemoryToken) return inMemoryToken;
  inMemoryToken = await AsyncStorage.getItem(TOKEN_KEY);
  return inMemoryToken;
}

api.interceptors.request.use(async (config) => {
  const token = inMemoryToken || (await loadToken());
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalise backend error messages into something throwable/displayable.
export function apiError(err: any): string {
  return (
    err?.response?.data?.error ||
    err?.message ||
    'Something went wrong. Please try again.'
  );
}
