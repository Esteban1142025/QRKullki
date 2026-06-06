import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SECURITY_ALERTS } from '../data/mockData';
import Swal from 'sweetalert2';
import {
  MdWarning, MdCheckCircle, MdEdit, MdClose, MdHistory, MdPerson, MdSave
} from 'react-icons/md';

const Security = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [managingAlert, setManagingAlert] = useState(null);
  const [manageForm, setManageForm] = useState({ status: '', comment: '' });

  const loadAlerts = () => {
    try {
      const dyn = localStorage.getItem('kw_dynamic_alerts');
      const dynamic = dyn ? JSON.parse(dyn) : [];
      const seen = new Set();
      const merged = [...dynamic, ...SECURITY_ALERTS.map(a => ({
        ...a, 
        status: a.isResolved ? 'Resuelto' : 'Pendiente',
        responsibleUserId: a.isResolved ? 'Admin' : null,
        history: [{ date: a.timestamp, user: 'Sistema', action: 'Alerta importada' }]
      }))].filter(a => {
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

  const openManage = (alert) => {
    if (user.role !== 'admin' && user.role !== 'riesgos' && user.role !== 'seguridad_fisica') {
      Swal.fire({
        icon: 'error', title: 'Acceso Denegado',
        text: 'Su rol no tiene privilegios para gestionar alertas de seguridad.',
        background: '#ffffff', color: '#1e293b'
      });
      return;
    }
    setManagingAlert(alert);
    setManageForm({ status: alert.status || 'Pendiente', comment: '' });
  };

  const handleSaveManage = (e) => {
    e.preventDefault();
    const updated = alerts.map(a => {
      if (a.id === managingAlert.id) {
        const newHistory = [...(a.history || [])];
        if (manageForm.comment) {
          newHistory.push({
            date: new Date().toISOString(),
            user: user.name,
            action: `Estado cambiado a ${manageForm.status}. Comentario: ${manageForm.comment}`
          });
        } else if (a.status !== manageForm.status) {
          newHistory.push({
            date: new Date().toISOString(),
            user: user.name,
            action: `Estado cambiado a ${manageForm.status}.`
          });
        }
        return {
          ...a,
          status: manageForm.status,
          responsibleUserId: user.id,
          history: newHistory,
          isResolved: manageForm.status === 'Resuelto',
          resolvedBy: manageForm.status === 'Resuelto' ? user.name : a.resolvedBy
        };
      }
      return a;
    });

    saveAlertsToStorage(updated);
    
    // Registrar en logs
    const newLog = {
      id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(),
      employeeId: user?.id, name: user?.name, role: user?.role,
      agency: user?.agency, area: 'Módulo Alertas Seguridad', device: 'Consola Operativa',
      status: 'Autorizado', details: `Alerta ${managingAlert.id} actualizada a ${manageForm.status}.`, risk: 'Bajo'
    };
    const currentLogs = JSON.parse(localStorage.getItem('kw_dynamic_logs') || '[]');
    localStorage.setItem('kw_dynamic_logs', JSON.stringify([newLog, ...currentLogs]));

    setManagingAlert(null);
    Swal.fire({
      icon: 'success', title: 'Alerta Actualizada',
      timer: 1500, showConfirmButton: false,
      background: '#ffffff', color: '#1e293b'
    });
  };

  const unresolvedAlerts = alerts.filter(a => a.status !== 'Resuelto' && !a.isResolved);
  const resolvedAlerts = alerts.filter(a => a.status === 'Resuelto' || a.isResolved);

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
                  <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none ${
                    alert.severity === 'Crítica' ? 'bg-red-100/50' : 'bg-orange-100/50'
                  }`} />

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
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        {alert.status || 'Pendiente'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono font-bold">
                      {new Date(alert.timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="space-y-2 relative z-10 mb-5">
                    <h4 className="font-black text-lg text-slate-800 flex items-center gap-2">
                      <MdWarning size={22} className={alert.severity === 'Crítica' ? 'text-red-500' : 'text-orange-500'} />
                      {alert.type}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{alert.details}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 relative z-10">
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                      <span className="text-slate-500">Área: <strong className="text-slate-700">{alert.area}</strong></span>
                      <span className="text-slate-500">Sucursal: <strong className="text-slate-700">{alert.agency}</strong></span>
                    </div>

                    <button
                      onClick={() => openManage(alert)}
                      className="btn-primary shrink-0"
                    >
                      <MdEdit size={18} /> Gestionar
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
                      {alert.resolvedBy || (alert.history && alert.history[alert.history.length-1]?.action)}
                    </div>
                  </div>
                  <button onClick={() => openManage(alert)} className="text-[#84cc16] text-xs font-bold hover:underline flex items-center gap-1">
                    <MdHistory size={14} /> Ver Historial Completo
                  </button>
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

      {/* MANAGE ALERT MODAL */}
      {managingAlert && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 font-['Outfit'] uppercase tracking-wider">
                Gestión de Alerta: {managingAlert.id}
              </h3>
              <button onClick={() => setManagingAlert(null)} className="text-slate-400 hover:text-slate-600">
                <MdClose size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">{managingAlert.type}</h4>
                <p className="text-sm text-slate-600">{managingAlert.details}</p>
                <div className="flex gap-4 text-xs text-slate-500 mt-2">
                  <span><MdPerson className="inline mr-1"/> Responsable actual: {managingAlert.responsibleUserId || 'No asignado'}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Historial de Eventos</h4>
                <div className="space-y-3">
                  {(managingAlert.history || []).map((h, i) => (
                    <div key={i} className="text-xs bg-slate-50 p-2 rounded border border-slate-100">
                      <div className="flex justify-between font-bold text-slate-600 mb-1">
                        <span>{h.user}</span>
                        <span className="text-slate-400">{new Date(h.date).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700">{h.action}</p>
                    </div>
                  ))}
                  {(!managingAlert.history || managingAlert.history.length === 0) && (
                    <p className="text-xs text-slate-400">No hay historial para esta alerta.</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveManage} className="border-t border-slate-200 pt-4 space-y-4">
                <div className="space-y-1">
                  <label className="form-label">Estado de la Alerta</label>
                  <select value={manageForm.status} onChange={e => setManageForm({...manageForm, status: e.target.value})} className="form-input">
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Investigación">En Investigación</option>
                    <option value="Resuelto">Resuelto</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="form-label">Nuevo Comentario / Acción</label>
                  <textarea value={manageForm.comment} onChange={e => setManageForm({...manageForm, comment: e.target.value})} placeholder="Detalle las acciones realizadas..." className="form-input min-h-[80px]" />
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" className="btn-primary">
                    <MdSave size={18} /> Actualizar Alerta
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Security;
