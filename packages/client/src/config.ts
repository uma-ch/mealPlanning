// API configuration
export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const WS_URL = import.meta.env.VITE_WS_URL || '';

// In development, Vite proxy handles /api and /socket.io
// In production, we need full URLs to the backend
