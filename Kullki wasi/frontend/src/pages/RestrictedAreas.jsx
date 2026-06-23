import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api/apiClient';
import {
  MdMap, MdVpnKey, MdAccessTime, MdEdit, MdHistory, MdClose,
  MdRefresh, MdAdd
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { agencyKey } from '../utils/agencyStorage';

const HISTORY_KEY = 'kw_area_history';

const RestrictedAreas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageAreas = ['admin', 'seguridad_fisica', 'tecnico_ti', 'jefe_agencia'].includes(user?.role);
  const agency = user?.agency;

  const [areas,       setAreas]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [history,     setHistory]     = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!agency) return;
    try {
      setHistory(JSON.parse(localStorage.getItem(agencyKey(HISTORY_KEY, agency)) || '[]'));
    } catch { setHistory([]); }
  }, [agency]);

  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/areas');
      setAreas(res.data);
    } catch (err) {
      console.error('Error al cargar áreas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#8DC63F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm font-medium">Cargando áreas restringidas...</p>
      </div>
    </div>
  );

  const displayAreas = agency
    ? areas.filter(a => !a.agency || a.agency === agency)
    : areas;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Zonas de Acceso Controlado</h2>
          <p className="text-sm text-slate-500 mt-1">Gestión de áreas físicas, perfiles autorizados y políticas de horario de la cooperativa.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAreas} className="btn-icon" title="Actualizar"><MdRefresh size={18} /></button>
          {canManageAreas && (
            <button
              onClick={() => navigate('/restricted-areas/new')}
              className="flex items-center gap-2 px-5 py-3 bg-[#84cc16] hover:bg-[#65a30d] rounded-xl text-sm font-bold text-white tracking-wider transition-all shadow-lg shrink-0">
              <MdAdd size={18} /> NUEVA ÁREA
            </button>
          )}
          <button onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 rounded-xl text-sm font-bold text-white tracking-wider transition-all shadow-lg shrink-0">
            <MdHistory size={18} className="text-[#84cc16]" /> HISTORIAL
          </button>
        </div>
      </div>

      {/* Grid de áreas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayAreas.map(area => (
          <div key={area.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col h-full relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none ${area.riskLevel === 'Crítico' ? 'bg-red-500/10' : area.riskLevel === 'Alto' ? 'bg-orange-500/10' : 'bg-[#84cc16]/10'}`} />
            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border ${area.riskLevel === 'Crítico' ? 'bg-red-50 text-red-500 border-red-100' : area.riskLevel === 'Alto' ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-[#84cc16]/10 text-[#65a30d] border-[#84cc16]/20'}`}>
                    <MdMap />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 leading-snug">{area.name}</h3>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">{area.id}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4 mb-6 mt-5 text-sm font-medium flex-1">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-slate-600 flex items-center gap-2"><MdVpnKey size={16} /> Nivel Riesgo</span>
                  <span className={`font-black uppercase tracking-wider text-xs ${area.riskLevel === 'Crítico' ? 'text-red-500' : area.riskLevel === 'Alto' ? 'text-orange-500' : 'text-[#65a30d]'}`}>{area.riskLevel}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-slate-600 flex items-center gap-2"><MdAccessTime size={16} /> Horario</span>
                  <span className="font-mono text-[#84cc16] font-bold text-sm">{area.schedule}</span>
                </div>
                <div className="flex justify-between items-center pb-1">
                  <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">Estado</span>
                  <span className={`text-xs font-black uppercase ${area.status === 'Protegido' ? 'text-emerald-600' : 'text-red-500'}`}>{area.status}</span>
                </div>
              </div>
              {canManageAreas && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => navigate(`/restricted-areas/edit/${area.id_area}`, { state: { area } })}
                    className="text-slate-400 hover:text-[#84cc16] transition-colors bg-white border border-slate-200 rounded p-1.5 flex items-center gap-1.5 text-xs font-bold">
                    <MdEdit size={14} /> Editar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── MODAL HISTORIAL ── */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-black text-slate-800 font-['Outfit'] uppercase tracking-wider flex items-center gap-2">
                <MdHistory size={18} className="text-[#84cc16]" /> Historial de Modificaciones
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600"><MdClose size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {history.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-4">No hay modificaciones registradas.</p>
              ) : history.map(log => (
                <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-slate-800">{log.areaName}</span>
                      <span className="text-[10px] ml-2 text-slate-500 font-mono bg-white border border-slate-200 px-1 rounded">{log.areaId}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 bg-white p-2 border border-slate-100 rounded-lg">{log.changes}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-2">Modificado por: <span className="text-[#84cc16]">{log.user}</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestrictedAreas;
