import axios from 'axios';
import { ENVIRONMENT } from '../../config/environment';

const apiClient = axios.create({
  baseURL: ENVIRONMENT.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10s timeout
});

// Interceptor de Solicitud (Request Interceptor)
// Adjunta automáticamente el token JWT simulado en cada petición
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ENVIRONMENT.jwtStorageKey);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuesta (Response Interceptor)
// Captura y gestiona errores globales como 401 (no autorizado) o 403 (prohibido)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      const { status } = error.response;
      
      // Control de sesión expirada
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        // Limpiar sesión local
        localStorage.removeItem(ENVIRONMENT.jwtStorageKey);
        localStorage.removeItem(ENVIRONMENT.userStorageKey);
        
        // Emitir evento para redirección limpia vía SPA
        if (window.location.pathname !== '/login') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      }
      
      // Control de falta de privilegios
      if (status === 403) {
        window.dispatchEvent(new CustomEvent('auth:forbidden'));
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
