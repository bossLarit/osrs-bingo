// API Configuration
// In development, Vite proxy handles /api requests
// In production, we need the full backend URL

const isDev = import.meta.env.DEV;

export const API_BASE_URL = isDev 
  ? '' 
  : (import.meta.env.VITE_API_URL || 'https://osrs-bingo-api.onrender.com');

export const api = (path) => `${API_BASE_URL}${path}`;
