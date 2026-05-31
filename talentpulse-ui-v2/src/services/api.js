import axios from 'axios';

const getBackendURL = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:8000/api`;
};

const api = axios.create({
  baseURL: getBackendURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
