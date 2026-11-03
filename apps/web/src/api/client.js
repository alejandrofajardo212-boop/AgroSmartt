import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 8000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrosmart.token') || sessionStorage.getItem('agrosmart.token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agrosmart.token');
      localStorage.removeItem('agrosmart.user');
      sessionStorage.removeItem('agrosmart.token');
      sessionStorage.removeItem('agrosmart.user');
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export function getApiError(error) {
  if (error.response?.data?.error) return error.response.data.error;
  if (error.code === 'ECONNABORTED') return 'La solicitud tardó demasiado. Intenta nuevamente.';
  if (!error.response) return 'No fue posible conectar con el servidor.';
  return 'No se pudo completar la operación. Intenta nuevamente.';
}
