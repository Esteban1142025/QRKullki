import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EMPLOYEES, AREAS, QR_DEVICES, ROLES } from '../data/mockData';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdQrCodeScanner, MdCheckCircle, MdCancel, MdDevices,
  MdArrowForward, MdPlayCircleFilled, MdWifiTethering
} from 'react-icons/md';

// Map device area names → AREAS array id
const DEVICE_AREA_MAP = {
  'Bóveda Principal':              'BOV',
  'Cuarto de Servidores TI':       'SRV',
  'Área de Cajas':                 'CAJ',
  'Archivo General e Histórico':   'ARC',
};

const QRScanner = () => {
  const { user } = useAuth();
  const [selectedDeviceId, setSelectedDeviceId] = useState(QR_DEVICES[0].id);
  const [scannedQR, setScannedQR]               = useState('');
  const [selectedEmpId, setSelectedEmpId]       = useState(EMPLOYEES[0].id);
  const [validationResult, setValidationResult] = useState(null);
  const [employees, setEmployees]               = useState(EMPLOYEES);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('kw_dynamic_employees');
      if (raw) setEmployees(JSON.parse(raw));
    } catch (_) {}
  }, []);

  const device  = QR_DEVICES.find(d => d.id === selectedDeviceId) ?? QR_DEVICES[0];
  const areaId  = DEVICE_AREA_MAP[device.area] ?? 'ADM';
  const area    = AREAS.find(a => a.id === areaId) ?? AREAS[AREAS.length - 1];

  // ── Validation logic ─────────────────────────────────
  const validate = (qrString) => {
    if (!qrString.trim()) {
      Swal.fire({ icon: 'warning', title: 'Entrada Vacía', text: 'Ingrese o seleccione un código QR.',
        background: '#0d1424', color: '#f1f5f9' });
      return;
    }

    const emp = employees.find(e => e.qrCode === qrString);

    if (!emp) {
      record(false, 'Código QR no registrado en la institución.', null, qrString);
      return;
    }
    if (emp.status !== 'Activo') {
      record(false, 'El contrato laboral del colaborador está INACTIVO o SUSPENDIDO.', emp, qrString);
      return;
    }

    const roleOk = area.allowedRoles.includes('all')
      || area.allowedRoles.includes(emp.role)
      || emp.role === 'admin';

    if (!roleOk) {
      const roleName = ROLES[emp.role]?.name ?? emp.role;
      record(false, `El perfil '${roleName}' no tiene privilegios de ingreso a '${area.name}'.`, emp, qrString);
      return;
    }

    if (area.schedule && area.schedule !== '24/7') {
      const parts   = area.schedule.split(' - ');
      const [sh, sm] = parts[0].split(':').map(Number);
      const [eh, em] = parts[1].split(':').map(Number);
      const now = new Date();
      const cur = now.getHours() * 60 + now.getMinutes();
      const start = sh * 60 + sm;
      const end   = eh * 60 + em;
      if (cur < start || cur >= end) {
        record(false, `Acceso fuera del horario permitido para esta área (${area.schedule}).`, emp, qrString);
        return;
      }
    }

    record(true, 'Acceso autorizado exitosamente. Bienvenido.', emp, qrString);
  };

  const record = (allowed, reason, emp, qrString) => {
    const ts = new Date().toISOString();
    const unknown = { name: 'Credencial Desconocida', id: 'KW-UNK', role: '—', department: '—',
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' };

    setValidationResult({ allowed, reason, timestamp: ts, employee: emp ?? unknown });

    // Persist log
    const log = {
      id: `LOG-${Date.now()}`, timestamp: ts,
      employeeId: emp?.id ?? 'KW-DESCONOCIDO',
      name: emp?.name ?? 'Credencial Desconocida',
      role: emp?.role ?? 'desconocido',
      agency: device.agency, area: area.name, device: device.name,
      status: allowed ? 'Autorizado' : 'Denegado',
      details: reason,
      risk: allowed ? 'Bajo' : (reason.includes('no registrado') || reason.includes('INACTIVO') ? 'Alto' : 'Medio'),
    };
    const logs = JSON.parse(localStorage.getItem('kw_dynamic_logs') || '[]');
    localStorage.setItem('kw_dynamic_logs', JSON.stringify([log, ...logs]));

    if (!allowed) {
      const alert = {
        id: `ALT-${Date.now()}`, timestamp: ts,
        type: emp ? (emp.status !== 'Activo' ? 'Credencial Bloqueada' : 'Acceso No Autorizado') : 'QR Desconocido/Falsificado',
        severity: emp ? (emp.status !== 'Activo' ? 'Alta' : 'Crítica') : 'Crítica',
        area: area.name,
        agency: device.agency === 'MAT' ? 'Matriz Ambato' : `Agencia (${device.agency})`,
        details: `Denegación en ${device.name}: ${reason}`,
        isResolved: false, resolvedBy: '',
      };
      const alerts = JSON.parse(localStorage.getItem('kw_dynamic_alerts') || '[]');
      localStorage.setItem('kw_dynamic_alerts', JSON.stringify([alert, ...alerts]));
    }
  };

  const handleScanEmployee = () => {
    const emp = employees.find(e => e.id === selectedEmpId);
    if (emp) { setScannedQR(emp.qrCode); validate(emp.qrCode); }
  };

  const reset = () => { setValidationResult(null); setScannedQR(''); };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-100 font-['Outfit']">Simulador de Garita y Control QR</h2>
        <p className="text-xs text-slate-400 mt-0.5">Emule el comportamiento de los lectores físicos instalados en torniquetes y exclusas de seguridad.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT: Device config panel ─────────────── */}
        <div className="lg:col-span-5 p-5 rounded-2xl glass-panel border border-slate-800/70 space-y-5">
          <h3 className="text-xs font-bold text-[#8DC63F] uppercase tracking-widest flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <MdDevices size={15} /> Configuración de Terminal Lector
          </h3>

          {/* Device selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Terminal de Acceso</label>
            <select
              value={selectedDeviceId}
              onChange={e => { setSelectedDeviceId(e.target.value); reset(); }}
              className="w-full"
            >
              {QR_DEVICES.map(d => (
                <option key={d.id} value={d.id}>{d.name} — {d.status}</option>
              ))}
            </select>
          </div>

          {/* Device info */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 space-y-2.5 text-xs">
            {[
              ['Área de Cobertura', area.name],
              ['Nivel de Riesgo', area.riskLevel],
              ['Horario Activo', area.schedule],
              ['IP Terminal', device.ip],
              ['Estado Conexión', device.status],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-slate-500">{k}:</span>
                <span className={`font-semibold ${
                  k === 'Nivel de Riesgo' ? (v === 'Crítico' ? 'text-red-400' : v === 'Alto' ? 'text-orange-400' : 'text-slate-200')
                  : k === 'Horario Activo' ? 'text-[#8DC63F]'
                  : k === 'Estado Conexión' ? (v === 'Online' ? 'text-emerald-400' : 'text-red-400')
                  : 'text-slate-200'
                }`}>{v}</span>
              </div>
            ))}
          </div>

          {/* Credential injection */}
          <div className="space-y-3.5 pt-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inyectar Credencial</p>

            {/* Method A */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-900 space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Método A — Empleado Registrado</span>
              <div className="flex gap-2">
                <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} className="flex-1 text-[11px]">
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.status})</option>
                  ))}
                </select>
                <button
                  onClick={handleScanEmployee}
                  className="px-3 py-1.5 bg-[#0d2347] hover:bg-[#163668] border border-[#8DC63F]/30 hover:border-[#8DC63F] rounded-lg text-[11px] font-bold text-[#8DC63F] transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <MdPlayCircleFilled size={14} /> Escanear
                </button>
              </div>
            </div>

            {/* Method B */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-900 space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Método B — QR Manual (Prueba de Fallo)</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder='Pruebe con "QR-FALSO-999" para denegar...'
                  value={scannedQR}
                  onChange={e => setScannedQR(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && validate(scannedQR)}
                  className="flex-1 text-[11px]"
                />
                <button
                  onClick={() => validate(scannedQR)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] font-semibold text-slate-300 transition-all cursor-pointer shrink-0"
                >
                  Validar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Turnstile display ──────────────── */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-2xl glass-panel border border-slate-800/70 min-h-[420px] relative overflow-hidden">

          {/* bg glow */}
          <div className="absolute inset-0 bg-gradient-radial from-[#0d2347]/20 via-transparent to-transparent pointer-events-none" />

          <AnimatePresence mode="wait">
            {!validationResult ? (

              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-600 relative qr-scanner-frame">
                  <MdQrCodeScanner size={42} />
                </div>
                <div>
                  <p className="font-bold text-slate-200 font-['Outfit'] text-base">Lector QR Activo</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    Presente una credencial QR institucional o inyecte una desde el panel de configuración.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg">
                  <MdWifiTethering size={14} className="text-[#8DC63F] animate-pulse" />
                  <span className="text-[10px] text-[#8DC63F] font-mono font-bold tracking-wider">LISTENING · {device.ip}</span>
                </div>
              </motion.div>

            ) : validationResult.allowed ? (

              <motion.div
                key="approved"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-sm"
              >
                <div className="p-6 rounded-2xl bg-emerald-950/20 border-2 border-emerald-500/70 flex flex-col items-center text-center shadow-2xl shadow-emerald-950/20">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                    <MdCheckCircle size={38} />
                  </div>
                  <h3 className="text-xl font-black text-emerald-400 tracking-wider font-['Outfit'] uppercase">Acceso Autorizado</h3>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Torniquete Abierto</p>

                  <div className="mt-5 w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800/60 text-left">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-emerald-950 bg-emerald-500 border border-emerald-500/30 text-lg shrink-0">
                      {validationResult.employee.name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-100 truncate">{validationResult.employee.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{validationResult.employee.department}</p>
                      <span className="inline-block mt-1 text-[9px] bg-slate-800 text-[#8DC63F] font-mono px-1.5 rounded uppercase font-bold">
                        {validationResult.employee.id}
                      </span>
                    </div>
                  </div>

                  <p className="w-full mt-4 text-[10px] text-slate-500 border-t border-slate-800/60 pt-3 font-mono">
                    Registro: {new Date(validationResult.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>

            ) : (

              <motion.div
                key="denied"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-sm"
              >
                <div className="p-6 rounded-2xl bg-red-950/20 border-2 border-red-500/70 flex flex-col items-center text-center shadow-2xl shadow-red-950/20">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 animate-pulse">
                    <MdCancel size={38} />
                  </div>
                  <h3 className="text-xl font-black text-red-400 tracking-wider font-['Outfit'] uppercase">Acceso Denegado</h3>
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-0.5">Torniquete Bloqueado</p>

                  <div className="mt-5 w-full p-3 rounded-xl bg-slate-900/70 border border-slate-800/60 text-left">
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      <strong className="text-slate-200">Causa:</strong> {validationResult.reason}
                    </p>
                  </div>

                  {validationResult.employee.id !== 'KW-UNK' && (
                    <div className="mt-3 w-full flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/40 text-left">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-red-950 bg-red-500/40 opacity-70 shrink-0">
                        {validationResult.employee.name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-500 truncate">{validationResult.employee.name}</p>
                        <span className="text-[9px] text-red-400 font-mono">{validationResult.employee.id}</span>
                      </div>
                    </div>
                  )}

                  <div className="w-full mt-4 flex items-center justify-center gap-1.5 border-t border-slate-800/60 pt-3">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                    <span className="text-[10px] text-red-400 font-semibold">Alerta enviada al Oficial de Riesgos</span>
                  </div>
                </div>
              </motion.div>

            )}
          </AnimatePresence>

          {validationResult && (
            <button
              onClick={reset}
              className="mt-6 text-xs text-[#8DC63F] font-bold uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
            >
              Restablecer Lector <MdArrowForward size={13} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default QRScanner;
