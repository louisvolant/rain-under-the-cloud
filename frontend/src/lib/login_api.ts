// src/lib/login_api.ts
import axios from 'axios';

console.log('BACKEND_URL:', process.env.BACKEND_URL);

const api = axios.create({
  baseURL: process.env.BACKEND_URL,
  withCredentials: true
});


export const login = async (username: string, password: string) => {
  const response = await api.post(
    '/api/login',
    { username, password },
    { withCredentials: true }
  );
  return response.data;
};

export const changePassword = async (newpassword: string) => {
  const response = await api.post(
    '/api/changepassword',
    { newpassword },
    { withCredentials: true }
  );
  return response.data;
};

export const checkAuth = async () => {
  const response = await api.get('/api/check-auth', { withCredentials: true });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/api/logout', null, { withCredentials: true });
  return response.data;
};

export const register = async (username: string, email: string, password: string) => {
  const response = await api.post('/api/register', { username, email, password });
  return response.data;
};

export const requestPasswordReset = async (email: string) => {
  const response = await api.post("/api/password_reset/request", { email });
  return response.data;
};

export const verifyResetToken = async (token: string) => {
  const response = await api.get("/api/password_reset/verify", {
    params: { token },
  });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await api.post("/api/password_reset/reset", {
    token,
    newpassword: newPassword,
  });
  return response.data;
};