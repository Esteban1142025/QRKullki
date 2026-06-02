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
        background: '#ffffff', color: '#1e293b'
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
      confirmButtonColor: '#84cc16', cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Registrar Solución', cancelButtonText: 'Cancelar',
      background: '#ffffff', color: '#1e293b'
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
          background: '#ffffff', color: '#1e293b'
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
        <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Consola de Alertas e Intrusiones</h2>
        <p className="text-sm text-slate-500 mt-1">Verifique los incidentes de red física, accesos denegados recurrentes y alarmas en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Alertas Activas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="relative flex h-3 w-3">
              {unresolvedAlerts.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${unresolvedAlerts.length > 0 ? 'bg-red-500' : 'bg-slate-400'}`} />
            </span>
            <h3 className={`text-sm font-bold uppercase tracking-widest ${unresolvedAlerts.length > 0 ? 'text-red-500' : 'text-slate-500'}`}>
              Amenazas Activas ({unresolvedAlerts.length})
            </h3>
          </div>

          <div className="space-y-4">
            {unresolvedAlerts.length > 0 ? (
              unresolvedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-6 rounded-2xl bg-white relative overflow-hidden transition-all shadow-md border-y border-r border-l-4 ${
                    alert.severity === 'Crítica'
                      ? 'border-l-red-500 border-y-red-100 border-r-red-100 hover:shadow-lg'
                      : 'border-l-orange-500 border-y-orange-100 border-r-orange-100 hover:shadow-lg'
                  }`}
                >
                  {/* Subtle glow background */}
                  <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
                    alert.severity === 'Crítica' ? 'bg-red-100/50' : 'bg-orange-100/50'
                  }`} />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${
                        alert.severity === 'Crítica'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-orange-50 text-orange-600 border-orange-200'
                      }`}>
                        Gravedad {alert.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {alert.id}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono font-bold">
                      {new Date(alert.timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="space-y-2 relative z-10 mb-5">
                    <h4 className="font-black text-lg text-slate-800 flex items-center gap-2">
                      <MdWarning size={22} className={alert.severity === 'Crítica' ? 'text-red-500' : 'text-orange-500'} />
                      {alert.type}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{alert.details}</p>
                  </div>

                  {/* Footer metadata & actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 relative z-10">
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                      <span className="text-slate-500">Área: <strong className="text-slate-700">{alert.area}</strong></span>
                      <span className="text-slate-500">Sucursal: <strong className="text-slate-700">{alert.agency}</strong></span>
                    </div>

                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-[#84cc16] border border-slate-800 hover:border-[#84cc16] text-white transition-all text-xs font-bold uppercase cursor-pointer shrink-0 shadow-md"
                    >
                      <MdCheckCircle size={18} /> Solventar Evento
                    </button>
                  </div>

                </div>
              ))
            ) : (
              <div className="p-10 text-center rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-500 text-sm flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <MdCheckCircle size={32} />
                </div>
                <p className="font-medium">No hay amenazas de seguridad activas en la Cooperativa.<br />El entorno está asegurado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Historial Resueltas */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Historial de Eventos Solventados</h3>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {resolvedAlerts.length > 0 ? (
              resolvedAlerts.map((alert) => (
                <div key={alert.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 text-sm hover:bg-white hover:shadow-md transition-all">
                  <div className="flex justify-between items-start gap-3">
                    <span className="font-bold text-slate-800 leading-snug">{alert.type}</span>
                    <span className="text-[10px] px-2 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-bold uppercase shrink-0">
                      Resuelta
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed text-xs font-medium">{alert.details}</p>

                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex gap-3 shadow-sm">
                    <MdCheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 block mb-1">Resolución:</strong>
                      {alert.resolvedBy}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 font-medium">
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
