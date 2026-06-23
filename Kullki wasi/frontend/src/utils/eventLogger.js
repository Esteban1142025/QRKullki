import { agencyKey, agencyGet, agencySet, agencyRemove } from './agencyStorage';

export const EVENTS_KEY = 'kw_perm_events';
const MAX_EVENTS = 300;

export const PERM_LABELS = {
  all:                  'Super Administrador',
  gestionar_usuarios:   'Módulo: Colaboradores',
  ver_reportes:         'Módulo: Bitácora',
  modulo_areas_criticas:'Módulo: Áreas Críticas y Alertas',
  modulo_auditoria:     'Módulo: Auditoría',
  modulo_control_qr:    'Módulo: Control QR',
  acceso_boveda:        'Bóveda Principal',
  acceso_cajas:         'Área de Cajas',
  acceso_servidores:    'Cuarto de Servidores TI',
  acceso_archivo:       'Archivo e Histórico',
  acceso_total:         'Acceso Total a Áreas Físicas',
};

// Resuelve el label de un permiso — soporta códigos estáticos y dinámicos (area_X)
const resolveLabel = (permCode, extraLabels = {}) => {
  if (extraLabels[permCode]) return extraLabels[permCode];
  if (PERM_LABELS[permCode]) return PERM_LABELS[permCode];
  if (/^area_\d+$/.test(permCode)) return `Área física (${permCode})`;
  return permCode;
};

// Lee eventos de la agencia indicada
export const readEvents = (agency) =>
  agencyGet(EVENTS_KEY, agency, []);

// Elimina eventos de la agencia indicada
export const clearEvents = (agency) =>
  agencyRemove(EVENTS_KEY, agency);

// Detecta diferencias y guarda un evento por cada permiso cambiado.
// extraLabels: mapa { permCode: 'Nombre legible' } para permisos dinámicos de área.
export const logPermissionChanges = (adminUser, roleId, roleName, oldPerms, newPerms, extraLabels = {}) => {
  const agency = adminUser?.agency;
  const now    = new Date().toISOString();
  const granted = newPerms.filter(p => !oldPerms.includes(p));
  const revoked  = oldPerms.filter(p => !newPerms.includes(p));

  if (granted.length === 0 && revoked.length === 0) return 0;

  const base = {
    timestamp: now,
    by:        adminUser?.name || '—',
    by_dni:    adminUser?.dni  || '',
    agency,
    role:      roleId,
    roleName,
  };

  const newEntries = [
    ...granted.map(p => ({
      ...base,
      id:              `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      permission:      p,
      permissionLabel: resolveLabel(p, extraLabels),
      action:          'granted',
    })),
    ...revoked.map(p => ({
      ...base,
      id:              `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      permission:      p,
      permissionLabel: resolveLabel(p, extraLabels),
      action:          'revoked',
    })),
  ];

  const existing = readEvents(agency);
  agencySet(EVENTS_KEY, agency, [...newEntries, ...existing].slice(0, MAX_EVENTS));
  return newEntries.length;
};
