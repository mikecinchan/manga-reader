import axios from 'axios';

// Use production API URL if available, otherwise proxy through dev server
const API_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
});

// Request interceptor to add auth token
let getAuthToken = null;

export function setAuthTokenGetter(getter) {
  getAuthToken = getter;
}

api.interceptors.request.use(
  (config) => {
    if (getAuthToken) {
      const token = getAuthToken();
      console.log('[API] Request interceptor:', {
        hasGetAuthToken: !!getAuthToken,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
        url: config.url
      });
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('[API] No auth token available for request to:', config.url);
      }
    } else {
      console.warn('[API] getAuthToken function not set');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error: No response received');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Manga API
export const mangaAPI = {
  search: (params) => api.get('/manga/search', { params }),
  getById: (id) => api.get(`/manga/${id}`),
  getFeed: (id, params) => api.get(`/manga/${id}/feed`, { params }),
  getTags: () => api.get('/manga/tags/all'),
};

// Chapter API
export const chapterAPI = {
  getById: (id) => api.get(`/chapter/${id}`),
  getImages: (id, quality = 'data') => api.get(`/chapter/${id}/images`, { params: { quality } }),
};

// Bookmarks API
export const bookmarksAPI = {
  getAll: () => api.get('/bookmarks'),
  create: (data) => api.post('/bookmarks', data),
  update: (id, data) => api.put(`/bookmarks/${id}`, data),
  delete: (id) => api.delete(`/bookmarks/${id}`),
  checkManga: (mangaId) => api.get(`/bookmarks/manga/${mangaId}`),
};

export default api;
