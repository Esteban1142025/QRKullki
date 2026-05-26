import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SECURITY_ALERTS } from '../data/mockData';
import Swal from 'sweetalert2';
import {
  MdWarning, MdCheckCircle
} from 'react-icons/md';

const Security = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);

  const loadAlerts = () => {
    try {
      const dyn = localStorage.getItem('kw_dynamic_alerts');
      const dynamic = dyn ? JSON.parse(dyn) : [];
      // deduplicate
      const seen = new Set();
      const merged = [...dynamic, ...SECURITY_ALERTS].filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id); return true;
      });
      setAlerts(merged);
    } catch {
      setAlerts(SECURITY_ALERTS);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const saveAlertsToStorage = (updated) => {
    setAlerts(updated);
    const baseIds = new Set(SECURITY_ALERTS.map(a => a.id));
    const dynamicOnly = updated.filter(a => !baseIds.has(a.id));
    localStorage.setItem('kw_dynamic_alerts', JSON.stringify(dynamicOnly));
  };

  const handleResolveAlert = (alertId) => {
    if (user.role !== 'admin' && user.role !== 'riesgos' && user.role !== 'seguridad_fisica') {
      Swal.fire({
        icon: 'error', title: 'Acceso Denegado',
        text: 'Su rol no tiene privilegios para firmar la resolución de alertas de seguridad.',
        background: '#0d1424', color: '#f1f5f9'
      });
      return;
    }

    Swal.fire({
      title: '¿Confirmar Resolución?',
      text: 'Describa brevemente la acción correctiva tomada:',
      input: 'text',
      inputPlaceholder: 'Ej: Se verificó credencial físicamente, Lector reiniciado...',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8DC63F', cancelButtonColor: '#334155',
      confirmButtonText: 'Registrar Solución', cancelButtonText: 'Cancelar',
      background: '#0d1424', color: '#f1f5f9'
    }).then((result) => {
      if (result.isConfirmed) {
        const comment = result.value || 'Acción verificada por central de seguridad.';
        const updated = alerts.map(a =>
          a.id === alertId
            ? { ...a, isResolved: true, resolvedBy: `${user.name} (${user.roleName}) - Detalle: ${comment}` }
            : a
        );
        saveAlertsToStorage(updated);

        // Registrar en logs
        const newLog = {
          id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(),
          employeeId: user?.id, name: user?.name, role: user?.role,
          agency: user?.agency, area: 'Módulo Alertas Seguridad', device: 'Consola Operativa',
          status: 'Autorizado', details: `Alerta ${alertId} marcada como RESUELTA. Detalle: ${comment}`, risk: 'Bajo'
        };
        const currentLogs = JSON.parse(localStorage.getItem('kw_dynamic_logs') || '[]');
        localStorage.setItem('kw_dynamic_logs', JSON.stringify([newLog, ...currentLogs]));

        Swal.fire({
          icon: 'success', title: 'Alerta Solventada',
          text: 'Se ha registrado la solución del evento en la bitácora de seguridad.',
          timer: 1500, showConfirmButton: false,
          background: '#0d1424', color: '#f1f5f9'
        });
      }
    });
  };

  const unresolvedAlerts = alerts.filter(a => !a.isResolved);
  const resolvedAlerts = alerts.filter(a => a.isResolved);

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-black text-slate-100 font-['Outfit']">Consola de Alertas e Intrusiones</h2>
        <p className="text-xs text-slate-400 mt-0.5">Verifique los incidentes de red física, accesos denegados recurrentes y alarmas en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Alertas Activas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="relative flex h-2.5 w-2.5">
              {unresolvedAlerts.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${unresolvedAlerts.length > 0 ? 'bg-red-500' : 'bg-slate-500'}`} />
            </span>
            <h3 className={`text-xs font-bold uppercase tracking-widest ${unresolvedAlerts.length > 0 ? 'text-red-400' : 'text-slate-500'}`}>
              Amenazas Activas ({unresolvedAlerts.length})
            </h3>
          </div>

          <div className="space-y-3.5">
            {unresolvedAlerts.length > 0 ? (
              unresolvedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-5 rounded-2xl border bg-[#0d1424]/80 backdrop-blur-sm relative overflow-hidden transition-all shadow-lg ${
                    alert.severity === 'Crítica'
                      ? 'border-red-500/30 hover:border-red-500/60 shadow-red-900/10'
                      : 'border-orange-500/30 hover:border-orange-500/60 shadow-orange-900/10'
                  }`}
                >
                  {/* Subtle glow background */}
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
                    alert.severity === 'Crítica' ? 'bg-red-500/10' : 'bg-orange-500/10'
                  }`} />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        alert.severity === 'Crítica'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      }`}>
                        Gravedad {alert.severity}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {alert.id}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono font-medium">
                      {new Date(alert.timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-1.5 relative z-10 mb-4">
                    <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <MdWarning className={alert.severity === 'Crítica' ? 'text-red-400' : 'text-orange-400'} />
                      {alert.type}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{alert.details}</p>
                  </div>

                  {/* Footer metadata & actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800/60 relative z-10">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px]">
                      <span className="text-slate-500">Área: <strong className="text-slate-300">{alert.area}</strong></span>
                      <span className="text-slate-500">Sucursal: <strong className="text-slate-300">{alert.agency}</strong></span>
                    </div>

                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#8DC63F] border border-slate-700 hover:border-[#8DC63F] text-slate-300 hover:text-[#0d2347] transition-all text-[10px] font-bold uppercase cursor-pointer shrink-0 shadow-md"
                    >
                      <MdCheckCircle size={15} /> Solventar Evento
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl glass-panel border border-slate-800/70 text-slate-500 text-xs flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <MdCheckCircle size={24} />
                </div>
                <p>No hay amenazas de seguridad activas en la Cooperativa.<br />El entorno está asegurado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Historial Resueltas */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Historial de Eventos Solventados</h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {resolvedAlerts.length > 0 ? (
              resolvedAlerts.map((alert) => (
                <div key={alert.id} className="p-4 rounded-xl border border-slate-800/60 bg-[#080c17]/60 space-y-2.5 text-xs hover:border-slate-700/80 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-slate-300 leading-snug">{alert.type}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold uppercase shrink-0">
                      Resuelta
                    </span>
                  </div>

                  <p className="text-slate-500 leading-relaxed text-[11px]">{alert.details}</p>

                  <div className="p-2.5 rounded-lg bg-[#0d1424] border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed flex gap-2">
                    <MdCheckCircle className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-300 block mb-0.5">Resolución:</strong>
                      {alert.resolvedBy}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-700 rounded-xl bg-[#080c17]/40">
                No hay registros de soluciones anteriores en esta sesión.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Security;
