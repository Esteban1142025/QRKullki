const SECRET = 'KW-KULLKIWASI-SECURE-2024';

const sign = (str) => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
};

export const getTimeoutMs = () => {
  try {
    const cfg = JSON.parse(localStorage.getItem('kw_system_config') || '{}');
    return Math.max(1, parseInt(cfg.sessionTimeout || '30', 10)) * 60 * 1000;
  } catch { return 30 * 60 * 1000; }
};

// Fin de la ventana de tiempo global actual — igual para todos los empleados.
// Todos los tokens generados en la misma ventana expiran exactamente al mismo instante.
export const getWindowEnd = () => {
  const timeoutMs = getTimeoutMs();
  return (Math.floor(Date.now() / timeoutMs) + 1) * timeoutMs;
};

// Token sincronizado: determinístico dentro de una ventana (mismo id + misma ventana = mismo token).
// No requiere almacenamiento: llamarlo en cualquier momento de la ventana da el mismo resultado.
export const generateQRToken = (id_empleado) => {
  const expires = getWindowEnd();
  const payload = `${id_empleado}|${expires}`;
  return `KW|${payload}|${sign(payload + SECRET)}`;
};

export const parseQRToken = (qrString) => {
  if (!qrString?.startsWith('KW|')) return null;
  const parts = qrString.split('|');
  if (parts.length !== 4) return null;
  const [, idStr, expiresStr, sig] = parts;
  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires)) return null;
  const payload = `${idStr}|${expires}`;
  if (sign(payload + SECRET) !== sig) return { tampered: true };
  const id_empleado = parseInt(idStr, 10);
  if (Date.now() > expires) return { expired: true, id_empleado };
  return { valid: true, id_empleado, expires };
};
