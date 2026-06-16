import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/apiClient';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdQrCodeScanner, MdCheckCircle, MdCancel, MdDevices,
  MdArrowForward, MdPlayCircleFilled, MdWifiTethering, MdRefresh
} from 'react-icons/md';

const QRScanner = () => {
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [devices, setDevices]     = useState([]);
  const [areas, setAreas]         = useState([]);
  const [loading, setLoading]     = useState(true);

  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedEmpId, setSelectedEmpId]       = useState('');
  const [scannedQR, setScannedQR]               = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, devRes, areaRes] = await Promise.all([
        apiClient.get('/empleados'),
        apiClient.get('/dispositivos'),
        apiClient.get('/areas'),
      ]);
      setEmployees(empRes.data);
      setDevices(devRes.data);
      setAreas(areaRes.data);
      if (devRes.data.length > 0) setSelectedDeviceId(devRes.data[0].id);
      if (empRes.data.length > 0) setSelectedEmpId(empRes.data[0].id);
    } catch (err) {
      console.error('Error al cargar datos del simulador:', err);
      Swal.fire({ icon: 'error', title: 'Error de conexión', text: 'No se pudo cargar los datos del simulador.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Dispositivo activo
  const device = devices.find(d => d.id === selectedDeviceId) ?? devices[0];

  // Área del dispositivo activo (match por nombre)
  const area = device
    ? areas.find(a => a.name === device.area) ?? areas[0]
    : null;

  // ── Lógica de validación ────────────────────────────────
  const validate = (qrString, preFoundEmp = null) => {
    if (!qrString?.trim()) {
      Swal.fire({ icon: 'warning', title: 'Entrada Vacía',
        text: 'Ingrese o seleccione un código QR.',
        background: '#ffffff', color: '#1e293b' });
      return;
    }
    if (!device || device.status !== 'Online') {
      Swal.fire({ icon: 'error', title: 'Terminal Offline',
        text: 'Este terminal se encuentra desconectado. No puede procesar accesos.',
        background: '#ffffff', color: '#1e293b' });
      return;
    }
    if (!area) {
      Swal.fire({ icon: 'error', title: 'Sin Área',
        text: 'El terminal no tiene un área asignada.',
        background: '#ffffff', color: '#1e293b' });
      return;
    }

    const emp = preFoundEmp || employees.find(e => e.qrCode === qrString);

    if (!emp) {
      record(false, 'Código QR no registrado en la institución.', null, qrString);
      return;
    }
    if (emp.status !== 'Activo') {
      record(false, 'El contrato laboral del colaborador está INACTIVO o SUSPENDIDO.', emp, qrString);
      return;
    }

    const allowedRoles = area.allowedRoles || [];
    const roleOk = allowedRoles.includes('all')
      || allowedRoles.includes(emp.role)
      || emp.role === 'admin';

    if (!roleOk) {
      record(false, `El perfil '${emp.role}' no tiene privilegios de ingreso a '${area.name}'.`, emp, qrString);
      return;
    }

    if (area.schedule && area.schedule !== '24/7') {
      const parts = area.schedule.split(' - ');
      if (parts.length === 2) {
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
    }

    record(true, 'Acceso autorizado exitosamente. Bienvenido.', emp, qrString);
  };

  const record = async (allowed, reason, emp, _qrString) => {
    const ts = new Date().toISOString();
    const unknown = { name: 'Credencial Desconocida', id: 'KW-UNK', department: '—' };
    setValidationResult({ allowed, reason, timestamp: ts, employee: emp ?? unknown });

    // Registrar en la base de datos
    try {
      await apiClient.post('/scan/simulate', {
        id_empleado: emp?.id_empleado ?? null,
        id_dispositivo: device?.id_dispositivo ?? null,
        resultado: allowed ? 'CONCEDIDO' : 'DENEGADO',
        motivo: reason,
      });
    } catch (err) {
      console.error('Error al registrar escaneo en DB:', err);
    }
  };

  const handleScanEmployee = () => {
    const emp = employees.find(e => e.id === selectedEmpId);
    if (emp) { setScannedQR(emp.qrCode); validate(emp.qrCode, emp); }
  };

  const reset = () => { setValidationResult(null); setScannedQR(''); };

  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#8DC63F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Cargando terminal QR...</p>
        </div>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <MdDevices size={36} className="mx-auto mb-3 text-slate-300" />
        <p className="font-semibold">No hay dispositivos registrados en la base de datos.</p>
        <button onClick={loadData} className="mt-4 btn-primary text-xs">
          <MdRefresh size={14} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 font-['Outfit']">Simulador de Garita y Control QR</h2>
          <p className="text-xs text-slate-500 mt-0.5">Emule el comportamiento de los lectores físicos instalados en torniquetes y exclusas de seguridad.</p>
        </div>
        <button onClick={loadData} className="btn-icon" title="Actualizar datos">
          <MdRefresh size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT: Device config panel ─────────────── */}
        <div className="lg:col-span-5 p-5 rounded-2xl glass-panel space-y-5">
          <h3 className="text-xs font-bold text-[#79ac34] uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-3">
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
              {devices.map(d => (
                <option key={d.id} value={d.id}>{d.name} — {d.status}</option>
              ))}
            </select>
          </div>

          {/* Device info */}
          {device && area && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              {[
                ['Área de Cobertura', area.name],
                ['Nivel de Riesgo',   area.riskLevel],
                ['Horario Activo',    area.schedule],
                ['IP Terminal',       device.ip],
                ['Estado Conexión',   device.status],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}:</span>
                  <span className={`font-semibold ${
                    k === 'Nivel de Riesgo'
                      ? (v === 'Crítico' ? 'text-red-500' : v === 'Alto' ? 'text-orange-500' : 'text-slate-700')
                      : k === 'Horario Activo'    ? 'text-[#79ac34]'
                      : k === 'Estado Conexión'   ? (v === 'Online' ? 'text-emerald-500' : 'text-red-500')
                      : 'text-slate-700'
                  }`}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Credential injection */}
          <div className="space-y-3.5 pt-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inyectar Credencial</p>

            {/* Method A */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Método A — Empleado Registrado</span>
              <div className="flex gap-2">
                <select
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  className="flex-1 text-[11px] bg-slate-50"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.status})</option>
                  ))}
                </select>
                <button
                  onClick={handleScanEmployee}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-[#8DC63F]/50 hover:border-[#8DC63F] rounded-lg text-[11px] font-bold text-[#79ac34] transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                >
                  <MdPlayCircleFilled size={14} /> Escanear
                </button>
              </div>
            </div>

            {/* Method B */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Ingreso Manual de Código QR</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder='Ingrese el código del colaborador...'
                  value={scannedQR}
                  onChange={e => setScannedQR(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && validate(scannedQR)}
                  className="flex-1 text-[11px]"
                />
                <button
                  onClick={() => validate(scannedQR)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 transition-all cursor-pointer shrink-0 shadow-sm"
                >
                  Validar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Turnstile display ──────────────── */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-2xl glass-panel min-h-[420px] relative overflow-hidden">

          <div className="absolute inset-0 bg-gradient-radial from-slate-200/50 via-transparent to-transparent pointer-events-none" />

          <AnimatePresence mode="wait">
            {!validationResult ? (

              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 relative qr-scanner-frame bg-white">
                  <MdQrCodeScanner size={42} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 font-['Outfit'] text-base">Lector QR Activo</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    Presente una credencial QR institucional o inyecte una desde el panel de configuración.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <MdWifiTethering size={14} className="text-[#8DC63F] animate-pulse" />
                  <span className="text-[10px] text-[#79ac34] font-mono font-bold tracking-wider">
                    LISTENING · {device?.ip || '—'}
                  </span>
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
                <div className="p-6 rounded-2xl bg-white border-2 border-emerald-300 flex flex-col items-center text-center shadow-xl shadow-emerald-100/50">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
                    <MdCheckCircle size={38} />
                  </div>
                  <h3 className="text-xl font-black text-emerald-500 tracking-wider font-['Outfit'] uppercase">Acceso Autorizado</h3>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Torniquete Abierto</p>

                  <div className="mt-5 w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-left">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white bg-emerald-500 text-lg shrink-0 shadow-sm">
                      {validationResult.employee.name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{validationResult.employee.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{validationResult.employee.department}</p>
                      <span className="inline-block mt-1 text-[9px] bg-white text-[#79ac34] font-mono px-1.5 rounded uppercase font-bold border border-slate-200">
                        {validationResult.employee.id}
                      </span>
                    </div>
                  </div>

                  <p className="w-full mt-4 text-[10px] text-slate-400 border-t border-slate-100 pt-3 font-mono">
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
                <div className="p-6 rounded-2xl bg-white border-2 border-red-300 flex flex-col items-center text-center shadow-xl shadow-red-100/50">
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 animate-pulse">
                    <MdCancel size={38} />
                  </div>
                  <h3 className="text-xl font-black text-red-500 tracking-wider font-['Outfit'] uppercase">Acceso Denegado</h3>
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-0.5">Torniquete Bloqueado</p>

                  <div className="mt-5 w-full p-3 rounded-xl bg-slate-50 border border-slate-100 text-left">
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      <strong className="text-slate-800">Causa:</strong> {validationResult.reason}
                    </p>
                  </div>

                  {validationResult.employee.id !== 'KW-UNK' && (
                    <div className="mt-3 w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-left">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white bg-red-400 shrink-0 shadow-sm">
                        {validationResult.employee.name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-700 truncate">{validationResult.employee.name}</p>
                        <span className="text-[9px] text-red-500 font-mono">{validationResult.employee.id}</span>
                      </div>
                    </div>
                  )}

                  <div className="w-full mt-4 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                    <span className="text-[10px] text-red-500 font-bold">Alerta registrada en el sistema</span>
                  </div>
                </div>
              </motion.div>

            )}
          </AnimatePresence>

          {validationResult && (
            <button
              onClick={reset}
              className="mt-6 text-xs text-[#79ac34] font-bold uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
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
