// Environment Configuration
// Configuración de variables de entorno para desarrollo e integración futura

const API_PORT = 8000;
const WS_PORT = 3001;

const getHostName = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return 'localhost';
};

export const ENVIRONMENT = {
  production: false,
  apiBaseUrl: `http://${getHostName()}:${API_PORT}/api/v1`,
  websocketUrl: `ws://${getHostName()}:${WS_PORT}`,
  jwtStorageKey: 'kw_token',
  userStorageKey: 'kw_user'
};
