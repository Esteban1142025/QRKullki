import React, { useState, useEffect } from 'react';
import { AREAS } from '../data/mockData';
import { MdMap, MdVpnKey, MdAccessTime, MdEdit, MdHistory, MdClose, MdSave } from 'react-icons/md';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';

const RestrictedAreas = () => {
  const { user } = useAuth();
  
  const [areas, setAreas] = useState(() => {
    try {
      const stored = localStorage.getItem('kw_dynamic_areas');
      return stored ? JSON.parse(stored) : AREAS;
    } catch { return AREAS; }
  });

  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem('kw_dynamic_area_logs');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const [editingArea, setEditingArea] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [form, setForm] = useState({ schedule: '', allowedRoles: '', riskLevel: '' });

  const persistAreas = (newAreas) => {
    setAreas(newAreas);
    localStorage.setItem('kw_dynamic_areas', JSON.stringify(newAreas));
  };

  const persistHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem('kw_dynamic_area_logs', JSON.stringify(newHistory));
  };

  const handleEdit = (area) => {
    setEditingArea(area);
    setForm({
      schedule: area.schedule,
      allowedRoles: area.allowedRoles.join(', '),
      riskLevel: area.riskLevel
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const updatedAreas = areas.map(a => {
      if (a.id === editingArea.id) {
        return {
          ...a,
          schedule: form.schedule,
          allowedRoles: form.allowedRoles.split(',').map(r => r.trim()).filter(Boolean),
          riskLevel: form.riskLevel
        };
      }
      return a;
    });

    const changeLog = {
      id: Date.now(),
      areaId: editingArea.id,
      areaName: editingArea.name,
      timestamp: new Date().toISOString(),
      user: user?.name || 'Sistema',
      changes: `Actualizado: Riesgo(${form.riskLevel}), Horario(${form.schedule}), Roles(${form.allowedRoles})`
    };

    persistAreas(updatedAreas);
    persistHistory([changeLog, ...history]);
    
    setEditingArea(null);
    Swal.fire({ icon: 'success', title: 'Área Actualizada', timer: 1500, showConfirmButton: false });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Zonas de Acceso Controlado</h2>
          <p className="text-sm text-slate-500 mt-1">Gestión de áreas físicas, perfiles autorizados y políticas de horario de la cooperativa.</p>
        </div>
        <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 rounded-xl text-sm font-bold text-white tracking-wider transition-all shadow-lg shrink-0">
          <MdHistory size={18} className="text-[#84cc16]" />
          HISTORIAL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map(area => (
          <div key={area.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col h-full relative overflow-hidden group">
            
            <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none ${
              area.riskLevel === 'Crítico' ? 'bg-red-500/10' :
              area.riskLevel === 'Alto' ? 'bg-orange-500/10' :
              'bg-[#84cc16]/10'
            }`} />

            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border ${
                    area.riskLevel === 'Crítico' ? 'bg-red-50 text-red-500 border-red-100' :
                    area.riskLevel === 'Alto' ? 'bg-orange-50 text-orange-500 border-orange-100' :
                    'bg-[#84cc16]/10 text-[#65a30d] border-[#84cc16]/20'
                  }`}>
                    <MdMap />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 leading-snug">{area.name}</h3>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                      {area.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6 mt-5 text-sm font-medium flex-1">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-slate-600 flex items-center gap-2"><MdVpnKey size={16} /> Nivel Riesgo</span>
                  <span className={`font-black uppercase tracking-wider text-xs ${
                    area.riskLevel === 'Crítico' ? 'text-red-500' :
                    area.riskLevel === 'Alto' ? 'text-orange-500' : 'text-[#65a30d]'
                  }`}>{area.riskLevel}</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-slate-600 flex items-center gap-2"><MdAccessTime size={16} /> Horario</span>
                  <span className="font-mono text-[#84cc16] font-bold text-sm">{area.schedule}</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex justify-between items-center">
                  Roles Autorizados
                  <button onClick={() => handleEdit(area)} className="text-slate-400 hover:text-[#84cc16] transition-colors bg-white border border-slate-200 rounded p-1">
                    <MdEdit size={14} />
                  </button>
                </p>
                <div className="flex flex-wrap gap-2">
                  {area.allowedRoles.map(r => (
                    <span key={r} className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border shadow-sm ${
                      r === 'all' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      'bg-slate-800 text-white border-slate-900'
                    }`}>
                      {r === 'all' ? 'Acceso Público / Todos' : r.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editingArea && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 font-['Outfit'] uppercase tracking-wider">
                Editar Área: {editingArea.name}
              </h3>
              <button onClick={() => setEditingArea(null)} className="text-slate-400 hover:text-slate-600">
                <MdClose size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nivel de Riesgo</label>
                <select value={form.riskLevel} onChange={e => setForm({...form, riskLevel: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800">
                  <option value="Medio">Medio</option>
                  <option value="Alto">Alto</option>
                  <option value="Crítico">Crítico</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Horario Permitido</label>
                <input type="text" value={form.schedule} onChange={e => setForm({...form, schedule: e.target.value})} placeholder="Ej: 08:00 - 18:00 o 24/7" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Roles Permitidos (separados por coma)</label>
                <input type="text" value={form.allowedRoles} onChange={e => setForm({...form, allowedRoles: e.target.value})} placeholder="Ej: admin, gerente, cajero" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800" />
              </div>
              <div className="flex justify-end pt-4 mt-2">
                <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#84cc16] hover:bg-[#65a30d] rounded-xl text-sm font-bold text-white shadow-md transition-all">
                  <MdSave size={18} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 font-['Outfit'] uppercase tracking-wider flex items-center gap-2">
                <MdHistory size={18} className="text-[#84cc16]" /> Historial de Modificaciones
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {history.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-4">No hay modificaciones registradas.</p>
              ) : (
                history.map(log => (
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
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RestrictedAreas;
