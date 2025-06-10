import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sessionToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sessionToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth endpoints
  login: async (credentials) => {
    const response = await api.post('/auth/login', { user: credentials });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshSession: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  // Items endpoints
  getItems: async (filters = {}) => {
    const response = await api.get('/items', { params: filters });
    return response.data;
  },

  getItem: async (id) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  createItem: async (itemData) => {
    const response = await api.post('/items', { item: itemData });
    return response.data;
  },

  updateItem: async (id, itemData) => {
    const response = await api.put(`/items/${id}`, { item: itemData });
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },

  disposeItem: async (id, reason) => {
    const response = await api.patch(`/items/${id}/dispose`, { disposal_reason: reason });
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/items/categories');
    return response.data;
  },

  getLocations: async () => {
    const response = await api.get('/items/locations');
    return response.data;
  },
};

export default api;
