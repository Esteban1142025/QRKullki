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

export const readEvents = () => {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
  } catch {
    return [];
  }
};

// Detecta diferencias y guarda un evento por cada permiso cambiado.
// Devuelve el número de eventos registrados.
export const logPermissionChanges = (adminUser, roleId, roleName, oldPerms, newPerms) => {
  const now = new Date().toISOString();
  const granted = newPerms.filter(p => !oldPerms.includes(p));
  const revoked  = oldPerms.filter(p => !newPerms.includes(p));

  if (granted.length === 0 && revoked.length === 0) return 0;

  const base = { timestamp: now, by: adminUser?.name || '—', by_dni: adminUser?.dni || '', role: roleId, roleName };

  const newEntries = [
    ...granted.map(p => ({
      ...base,
      id:               `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      permission:       p,
      permissionLabel:  PERM_LABELS[p] || p,
      action:           'granted',
    })),
    ...revoked.map(p => ({
      ...base,
      id:               `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      permission:       p,
      permissionLabel:  PERM_LABELS[p] || p,
      action:           'revoked',
    })),
  ];

  const existing = readEvents();
  localStorage.setItem(EVENTS_KEY, JSON.stringify([...newEntries, ...existing].slice(0, MAX_EVENTS)));
  return newEntries.length;
};
