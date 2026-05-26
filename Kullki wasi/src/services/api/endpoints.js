// API Endpoints Definition
// Catálogo de endpoints preparado para la integración con FastAPI

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    verify: '/auth/verify-token'
  },
  employees: {
    list: '/employees',
    detail: (id) => `/employees/${id}`,
    create: '/employees',
    update: (id) => `/employees/${id}`,
    delete: (id) => `/employees/${id}`,
    qr: (id) => `/employees/${id}/qr-code`
  },
  rbac: {
    roles: '/rbac/roles',
    rolePermissions: (roleId) => `/rbac/roles/${roleId}/permissions`,
    updatePermissions: '/rbac/permissions'
  },
  areas: {
    list: '/areas',
    detail: (id) => `/areas/${id}`,
    create: '/areas',
    update: (id) => `/areas/${id}`,
    toggleLock: (id) => `/areas/${id}/emergency-lock`
  },
  logs: {
    list: '/audit-logs',
    create: '/audit-logs',
    export: '/audit-logs/export-csv'
  },
  devices: {
    list: '/devices',
    detail: (id) => `/devices/${id}`,
    reboot: (id) => `/devices/${id}/reboot`,
    status: '/devices/status'
  },
  security: {
    alerts: '/security/alerts',
    resolveAlert: (id) => `/security/alerts/${id}/resolve`
  }
};
