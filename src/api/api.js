import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE.API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token'); // Nomini auth_token qildik
  if (token) {
    // MUHIM: TokenAuthentication uchun "Token <kalit>" formatida bo'lishi shart
    config.headers.Authorization = `Token ${token}`; 
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;