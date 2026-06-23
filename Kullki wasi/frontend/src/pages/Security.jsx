import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/apiClient';
import Swal from 'sweetalert2';
import {
  MdWarning, MdCheckCircle, MdEdit, MdClose, MdHistory, MdPerson, MdSave, MdRefresh,
  MdFilterList
} from 'react-icons/md';

const SEVERITY_STYLES = {
  Crítica: {
    border: 'border-l-red-500 border-y-red-100 border-r-red-100',
    glow:   'bg-red-100/50',
    badge:  'bg-red-50 text-red-600 border-red-200',
  },
  Alta: {
    border: 'border-l-orange-500 border-y-orange-100 border-r-orange-100',
    glow:   'bg-orange-100/50',
    badge:  'bg-orange-50 text-orange-600 border-orange-200',
  },
  Media: {
    border: 'border-l-yellow-500 border-y-yellow-100 border-r-yellow-100',
    glow:   'bg-yellow-100/50',
    badge:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  Baja: {
    border: 'border-l-blue-400 border-y-blue-50 border-r-blue-50',
    glow:   'bg-blue-50/50',
    badge:  'bg-blue-50 text-blue-600 border-blue-200',
  },
};
const getSeverityStyle = (s) => SEVERITY_STYLES[s] || SEVERITY_STYLES.Alta;

const Security = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [managingAlert, setManagingAlert] = useState(null);
  const [manageForm, setManageForm] = useState({ status: '', comment: '' });

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/security/alerts');
      setAlerts(res.data);
    } catch (err) {
      console.error('Error al cargar alertas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const CAN_MANAGE_ALERTS = ['admin', 'riesgos', 'seguridad_fisica', 'jefe_agencia'];

  const openManage = (alert) => {
    if (!CAN_MANAGE_ALERTS.includes(user.role)) {
      Swal.fire({
        icon: 'error', title: 'Acceso Denegado',
        text: 'Su rol no tiene privilegios para gestionar alertas de seguridad.',
        background: '#ffffff', color: '#1e293b'
      });
      return;
    }
    setManagingAlert(alert);
    setManageForm({ status: alert.status || 'ABIERTA', comment: '' });
  };

  const handleSaveManage = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/security/alerts/${managingAlert.id_alerta}`, {
        estado: manageForm.status,
      });
      await loadAlerts();
      setManagingAlert(null);
      Swal.fire({
        icon: 'success', title: 'Alerta Actualizada',
        timer: 1500, showConfirmButton: false,
        background: '#ffffff', color: '#1e293b'
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'Error al actualizar la alerta.' });
    }
  };

  const [statusFilter, setStatusFilter] = useState('TODAS');

  // Filtrar por agencia activa del contexto global (reactivo al switcher)
  const effectiveAgency = user?.agency || null;
  const agencyAlerts = effectiveAgency
    ? alerts.filter(a => !a.agency || a.agency === effectiveAgency)
    : alerts;

  const unresolvedAlerts = agencyAlerts.filter(a => !a.isResolved && a.status !== 'RESUELTA');
  const resolvedAlerts   = agencyAlerts.filter(a => a.isResolved  || a.status === 'RESUELTA');

  const counts = {
    TODAS:            agencyAlerts.length,
    ABIERTA:          agencyAlerts.filter(a => a.status === 'ABIERTA').length,
    EN_INVESTIGACION: agencyAlerts.filter(a => a.status === 'EN_INVESTIGACION').length,
    RESUELTA:         resolvedAlerts.length,
  };

  // Listas filtradas para cada panel
  const activeDisplay = statusFilter === 'TODAS'
    ? unresolvedAlerts
    : statusFilter === 'RESUELTA'
      ? []
      : unresolvedAlerts.filter(a => a.status === statusFilter);

  const resolvedDisplay = (statusFilter === 'TODAS' || statusFilter === 'RESUELTA')
    ? resolvedAlerts
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#8DC63F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Cargando alertas de seguridad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Consola de Alertas e Intrusiones</h2>
          <p className="text-sm text-slate-500 mt-1">Verifique los incidentes de red física, accesos denegados recurrentes y alarmas en tiempo real.</p>
        </div>
        <button onClick={loadAlerts} className="btn-icon" title="Actualizar">
          <MdRefresh size={18} />
        </button>
      </div>

      {/* Filtros de estado */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">
          <MdFilterList size={15} /> Filtrar
        </span>
        {[
          { key: 'TODAS',            label: 'Todas',            color: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200',          active: 'bg-slate-700 text-white border-slate-700' },
          { key: 'ABIERTA',          label: 'Abierta',          color: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100',        active: 'bg-orange-500 text-white border-orange-500' },
          { key: 'EN_INVESTIGACION', label: 'En Investigación', color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',               active: 'bg-blue-600 text-white border-blue-600' },
          { key: 'RESUELTA',         label: 'Resuelta',         color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100',    active: 'bg-emerald-600 text-white border-emerald-600' },
        ].map(({ key, label, color, active }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${statusFilter === key ? active : color}`}
          >
            {label}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${statusFilter === key ? 'bg-white/25' : 'bg-white/80'}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-1 gap-8 ${resolvedDisplay.length > 0 ? 'lg:grid-cols-12' : ''}`}>

        {/* Alertas Activas */}
        {(statusFilter !== 'RESUELTA') && (
        <div className={`space-y-4 ${resolvedDisplay.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="flex items-center gap-2 px-1">
            <span className="relative flex h-3 w-3">
              {activeDisplay.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${activeDisplay.length > 0 ? 'bg-red-500' : 'bg-slate-400'}`} />
            </span>
            <h3 className={`text-sm font-bold uppercase tracking-widest ${activeDisplay.length > 0 ? 'text-red-500' : 'text-slate-500'}`}>
              {statusFilter === 'EN_INVESTIGACION' ? 'En Investigación' : statusFilter === 'ABIERTA' ? 'Abiertas' : 'Amenazas Activas'} ({activeDisplay.length})
            </h3>
          </div>

          <div className="space-y-4">
            {activeDisplay.length > 0 ? (
              activeDisplay.map((alert) => {
                const sty = getSeverityStyle(alert.severity);
                return (
                <div key={alert.id} className={`p-6 rounded-2xl bg-white relative overflow-hidden transition-all shadow-md border-y border-r border-l-4 hover:shadow-lg ${sty.border}`}>
                  <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none ${sty.glow}`} />
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase border ${sty.badge}`}>
                        Gravedad {alert.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {alert.id}
                      </span>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                        {alert.status || 'ABIERTA'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono font-bold">
                      {new Date(alert.timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="space-y-2 relative z-10 mb-5">
                    <h4 className="font-black text-lg text-slate-800 flex items-center gap-2">
                      <MdWarning size={22} className={sty.badge.includes('red') ? 'text-red-500' : sty.badge.includes('orange') ? 'text-orange-500' : sty.badge.includes('yellow') ? 'text-yellow-600' : 'text-blue-500'} />
                      {alert.type}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{alert.details}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 relative z-10">
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
                      <span className="text-slate-500">Área: <strong className="text-slate-700">{alert.area}</strong></span>
                      <span className="text-slate-500">Sucursal: <strong className="text-slate-700">{alert.agency}</strong></span>
                    </div>
                    <button onClick={() => openManage(alert)} className="btn-primary shrink-0">
                      <MdEdit size={18} /> Gestionar
                    </button>
                  </div>
                </div>
              );
              })
            ) : (
              <div className="p-10 text-center rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-500 text-sm flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <MdCheckCircle size={32} />
                </div>
                <p className="font-medium">
                  {statusFilter === 'ABIERTA' ? 'No hay alertas abiertas.' : statusFilter === 'EN_INVESTIGACION' ? 'No hay alertas en investigación.' : 'No hay amenazas de seguridad activas en la Cooperativa.'}
                  <br />{statusFilter === 'TODAS' && 'El entorno está asegurado.'}
                </p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Historial Resueltas */}
        {resolvedDisplay.length > 0 && (
        <div className={`space-y-4 ${statusFilter === 'RESUELTA' ? 'lg:col-span-12' : 'lg:col-span-5'}`}>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Historial de Eventos Solventados</h3>
          <div className={`space-y-4 overflow-y-auto pr-2 ${statusFilter === 'RESUELTA' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-none' : 'max-h-[600px]'}`}>
            {resolvedDisplay.map((alert) => (
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
                    {alert.resolvedBy || 'Resuelto por operador.'}
                  </div>
                </div>
                <button onClick={() => openManage(alert)} className="text-[#84cc16] text-xs font-bold hover:underline flex items-center gap-1">
                  <MdHistory size={14} /> Ver Detalles
                </button>
              </div>
            ))}
          </div>
        </div>
        )}
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
                  <span className="flex items-center gap-1"><MdPerson size={14} /> Área: {managingAlert.area}</span>
                </div>
              </div>
              <form onSubmit={handleSaveManage} className="border-t border-slate-200 pt-4 space-y-4">
                <div className="space-y-1">
                  <label className="form-label">Estado de la Alerta</label>
                  <select value={manageForm.status} onChange={e => setManageForm({...manageForm, status: e.target.value})} className="form-input">
                    <option value="ABIERTA">Abierta</option>
                    <option value="EN_INVESTIGACION">En Investigación</option>
                    <option value="RESUELTA">Resuelta</option>
                  </select>
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
