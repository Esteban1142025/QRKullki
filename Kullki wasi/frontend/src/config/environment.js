// Environment Configuration
// Configuración de variables de entorno para desarrollo e integración futura

const API_PORT = 3001;
const WS_PORT = 3001;

const getHostName = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return 'localhost';
};

// Detectar si estamos en Docker (producción) o desarrollo local
const isDocker = () => {
  // Si el puerto es 8080, probablemente estamos en Docker con Devilbox
  if (typeof window !== 'undefined') {
    return window.location.port === '8080' || window.location.port === '';
  }
  return false;
};

// En Docker, el backend es accesible desde el mismo host
// En desarrollo local, usamos localhost
const getApiBaseUrl = () => {
  const host = getHostName();
  // Si estamos en Docker (frontend en puerto 8080), backend también está en el mismo host
  if (isDocker()) {
    return `http://${host}:${API_PORT}/api/v1`;
  }
  // En desarrollo local
  return `http://${host}:${API_PORT}/api/v1`;
};

export const ENVIRONMENT = {
  production: false,
  apiBaseUrl: getApiBaseUrl(),
  websocketUrl: `ws://${getHostName()}:${WS_PORT}`,
  jwtStorageKey: 'kw_token',
  userStorageKey: 'kw_user'
};
