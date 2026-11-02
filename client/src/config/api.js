// Centralized API & Socket configuration
// Supports local development and production cloud deployment (Render, Vercel, Railway, Heroku, etc.)

const isProduction = process.env.NODE_ENV === 'production';

// Sanitize and normalize API_BASE_URL: strip any accidental trailing '/api' or '/'
// so that `${API_BASE_URL}/api/...` always resolves to a clean single `/api/...`
const rawApiUrl = process.env.REACT_APP_API_URL !== undefined 
  ? process.env.REACT_APP_API_URL.trim() 
  : (isProduction ? '' : 'http://localhost:5000');

export const API_BASE_URL = rawApiUrl
  ? rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '')
  : (isProduction ? '' : 'http://localhost:5000');

// Socket server URL
const rawSocketUrl = process.env.REACT_APP_SOCKET_URL || rawApiUrl;
export const SOCKET_URL = rawSocketUrl
  ? rawSocketUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '')
  : (isProduction && typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

// Helper to format image URLs safely
export const formatImageUrl = (imagePath, fallbackText = 'Item') => {
  if (!imagePath) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
  }
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export default {
  API_BASE_URL,
  SOCKET_URL,
  formatImageUrl
};

