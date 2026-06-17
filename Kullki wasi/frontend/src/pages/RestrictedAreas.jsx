import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api/apiClient';
import {
  MdMap, MdVpnKey, MdAccessTime, MdEdit, MdHistory, MdClose,
  MdSave, MdRefresh, MdTune, MdCheck, MdAdd, MdDelete
} from 'react-icons/md';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { agencyKey } from '../utils/agencyStorage';

/* ── Bases de claves de almacenamiento (se scopean por agencia en runtime) ── */
const SCHED_KEY        = 'kw_schedule_presets';
const ALLOW_CUSTOM_KEY = 'kw_allow_custom_schedule';
const HISTORY_KEY      = 'kw_area_history';

const DEFAULT_SCHEDULES = [
  { id: 'def-1', label: 'Acceso continuo',   value: '24/7',          active: true },
  { id: 'def-2', label: 'Jornada estándar',  value: '08:00 - 18:00', active: true },
  { id: 'def-3', label: 'Jornada reducida',  value: '08:00 - 17:00', active: true },
  { id: 'def-4', label: 'Jornada corrida',   value: '08:30 - 17:30', active: true },
  { id: 'def-5', label: 'Jornada extendida', value: '07:30 - 20:00', active: true },
  { id: 'def-6', label: 'Horario ampliado',  value: '06:00 - 22:00', active: true },
];

const readSchedules = (agency) => {
  const key = agencyKey(SCHED_KEY, agency);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_SCHEDULES));
      return DEFAULT_SCHEDULES;
    }
    const parsed = JSON.parse(raw);
    // migración de formato antiguo (sin id/active)
    if (parsed.length && parsed[0].id === undefined) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_SCHEDULES));
      return DEFAULT_SCHEDULES;
    }
    return parsed;
  } catch { return DEFAULT_SCHEDULES; }
};

const readAllowCustom = (agency) => {
  try { return JSON.parse(localStorage.getItem(agencyKey(ALLOW_CUSTOM_KEY, agency)) ?? 'true'); }
  catch { return true; }
};

/* ── Componente ─────────────────────────────────────────────────────────────── */
const RestrictedAreas = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const agency  = user?.agency;

  const [areas, setAreas]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [history, setHistory]     = useState([]);
  const [editingArea, setEditingArea] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Datos del área que se está editando
  const [form, setForm] = useState({ schedule: '', riskLevel: '', scheduleMode: 'preset' });

  // Gestión de horarios (se carga al abrir el modal)
  const [schedules, setSchedules]     = useState(DEFAULT_SCHEDULES);
  const [allowCustom, setAllowCustom] = useState(true);

  // Recargar historial y configuración de horarios cuando cambia la agencia activa
  useEffect(() => {
    if (!agency) return;
    try {
      setHistory(JSON.parse(localStorage.getItem(agencyKey(HISTORY_KEY, agency)) || '[]'));
    } catch { setHistory([]); }
    setSchedules(readSchedules(agency));
    setAllowCustom(readAllowCustom(agency));
  }, [agency]);
  const [schedEditId, setSchedEditId] = useState(null);   // id del horario en edición inline
  const [schedEditForm, setSchedEditForm] = useState({ label: '', value: '' });
  const [newSched, setNewSched]       = useState({ label: '', value: '' });
  const [showAddSched, setShowAddSched] = useState(false);

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

  /* ── Abrir modal ── */
  const handleEdit = (area) => {
    const freshScheds  = readSchedules(agency);
    const freshCustom  = readAllowCustom(agency);
    setSchedules(freshScheds);
    setAllowCustom(freshCustom);
    setSchedEditId(null);
    setNewSched({ label: '', value: '' });
    setShowAddSched(false);

    const isPreset = freshScheds.some(s => s.value === area.schedule && s.active);
    setForm({
      riskLevel:    area.riskLevel,
      schedule:     area.schedule,
      scheduleMode: isPreset ? 'preset' : 'custom',
    });
    setEditingArea(area);
  };

  /* ── Guardar área ── */
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/areas/${editingArea.id_area}`, {
        nivel_riesgo: form.riskLevel,
        horario:      form.schedule,
      });
      const changeLog = {
        id: Date.now(), areaId: editingArea.id, areaName: editingArea.name,
        timestamp: new Date().toISOString(), user: user?.name || 'Sistema',
        changes: `Actualizado: Riesgo(${form.riskLevel}), Horario(${form.schedule})`,
      };
      const newHistory = [changeLog, ...history];
      setHistory(newHistory);
      localStorage.setItem(agencyKey(HISTORY_KEY, agency), JSON.stringify(newHistory));
      await fetchAreas();
      setEditingArea(null);
      Swal.fire({ icon: 'success', title: 'Área Actualizada', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'Error al actualizar el área.' });
    }
  };

  /* ── Helpers de horarios ── */
  const persistSchedules = (updated) => {
    setSchedules(updated);
    localStorage.setItem(agencyKey(SCHED_KEY, agency), JSON.stringify(updated));
    // Si el horario seleccionado quedó inactivo, limpiar selección
    const sel = updated.find(s => s.value === form.schedule);
    if (sel && !sel.active) setForm(f => ({ ...f, schedule: '', scheduleMode: 'preset' }));
  };

  const toggleSchedActive = (id) =>
    persistSchedules(schedules.map(s => s.id === id ? { ...s, active: !s.active } : s));

  const startSchedEdit = (s) => {
    setSchedEditId(s.id);
    setSchedEditForm({ label: s.label, value: s.value });
  };

  const saveSchedEdit = (id) => {
    const label = schedEditForm.label.trim();
    const value = schedEditForm.value.trim();
    if (!label || !value) return;
    if (schedules.some(s => s.id !== id && s.value === value)) {
      Swal.fire({ icon: 'warning', title: 'Valor duplicado', text: `Ya existe un horario "${value}".`, background: '#ffffff', color: '#1e293b' }); return;
    }
    const updated = schedules.map(s => s.id === id ? { ...s, label, value } : s);
    persistSchedules(updated);
    // Actualizar selección si era el editado
    if (form.schedule === schedules.find(s => s.id === id)?.value)
      setForm(f => ({ ...f, schedule: value }));
    setSchedEditId(null);
  };

  const deleteSchedule = (id) => {
    persistSchedules(schedules.filter(s => s.id !== id));
  };

  const addSchedule = () => {
    const label = newSched.label.trim();
    const value = newSched.value.trim();
    if (!label || !value) {
      Swal.fire({ icon: 'warning', title: 'Campos requeridos', text: 'Ingresa nombre y valor del horario.', background: '#ffffff', color: '#1e293b' }); return;
    }
    if (schedules.some(s => s.value === value)) {
      Swal.fire({ icon: 'warning', title: 'Horario duplicado', text: `El horario "${value}" ya existe.`, background: '#ffffff', color: '#1e293b' }); return;
    }
    persistSchedules([...schedules, { id: `custom-${Date.now()}`, label, value, active: true }]);
    setNewSched({ label: '', value: '' });
    setShowAddSched(false);
  };

  const toggleAllowCustom = () => {
    const next = !allowCustom;
    setAllowCustom(next);
    localStorage.setItem(agencyKey(ALLOW_CUSTOM_KEY, agency), JSON.stringify(next));
    if (!next && form.scheduleMode === 'custom')
      setForm(f => ({ ...f, scheduleMode: 'preset', schedule: '' }));
  };

  /* ── Loading ── */
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#8DC63F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm font-medium">Cargando áreas restringidas...</p>
      </div>
    </div>
  );

  // Derivar directamente de user.agency — reactivo al switcher sin estado extra
  const displayAreas = agency
    ? areas.filter(a => !a.agency || a.agency === agency)
    : areas;

  /* ── Render principal ── */
  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Zonas de Acceso Controlado</h2>
          <p className="text-sm text-slate-500 mt-1">Gestión de áreas físicas, perfiles autorizados y políticas de horario de la cooperativa.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAreas} className="btn-icon" title="Actualizar"><MdRefresh size={18} /></button>
          <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 rounded-xl text-sm font-bold text-white tracking-wider transition-all shadow-lg shrink-0">
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
              <div className="pt-2 flex justify-end">
                <button onClick={() => handleEdit(area)} className="text-slate-400 hover:text-[#84cc16] transition-colors bg-white border border-slate-200 rounded p-1.5 flex items-center gap-1.5 text-xs font-bold">
                  <MdEdit size={14} /> Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODAL DE EDICIÓN ────────────────────────────────────────────────── */}
      {editingArea && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">

            {/* Cabecera */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-black text-slate-800 font-['Outfit'] uppercase tracking-wider">
                Editar Área: {editingArea.name}
              </h3>
              <button onClick={() => setEditingArea(null)} className="text-slate-400 hover:text-slate-600"><MdClose size={20} /></button>
            </div>

            {/* Cuerpo scrollable */}
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleSave} id="edit-area-form" className="p-6 space-y-5">

                {/* Nivel de riesgo */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nivel de Riesgo</label>
                  <select value={form.riskLevel} onChange={e => setForm({ ...form, riskLevel: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800">
                    <option>Bajo</option><option>Medio</option><option>Alto</option><option>Crítico</option>
                  </select>
                </div>

                {/* ── Horario Permitido ── */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Horario Permitido</label>
                  {isAdmin && (
                    <p className="text-[10px] text-slate-400">Selecciona un horario. Usa el lápiz para editar, el toggle para activar/desactivar y la basura para eliminar.</p>
                  )}

                  {/* Lista de horarios:
                      Admin  → ve todos (activos e inactivos) con controles de gestión
                      Otros  → solo ven los activos, sin controles */}
                  <div className="space-y-1.5">
                    {schedules
                      .filter(s => isAdmin || s.active)
                      .map(s => (
                        <div key={s.id}
                          className={`rounded-xl border transition-all ${s.active ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-50'}`}>

                          {isAdmin && schedEditId === s.id ? (
                            /* ── Fila en edición (solo admin) ── */
                            <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
                              <input autoFocus type="text" value={schedEditForm.label}
                                onChange={e => setSchedEditForm({ ...schedEditForm, label: e.target.value })}
                                placeholder="Nombre" className="flex-1 min-w-[100px] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#84cc16]" />
                              <input type="text" value={schedEditForm.value}
                                onChange={e => setSchedEditForm({ ...schedEditForm, value: e.target.value.replace(/[^0-9:\-/, ]/g, '') })}
                                placeholder="08:00 - 17:00" className="w-32 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#84cc16]" />
                              <button type="button" onClick={() => saveSchedEdit(s.id)}
                                className="p-1.5 rounded-lg bg-[#84cc16] hover:bg-[#65a30d] text-white transition-colors" title="Guardar">
                                <MdCheck size={15} />
                              </button>
                              <button type="button" onClick={() => setSchedEditId(null)}
                                className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors" title="Cancelar">
                                <MdClose size={15} />
                              </button>
                            </div>
                          ) : (
                            /* ── Fila normal ── */
                            <div className="flex items-center gap-2 px-3 py-2">
                              <input type="radio" name="schedulePreset"
                                checked={form.scheduleMode === 'preset' && form.schedule === s.value}
                                disabled={!s.active}
                                onChange={() => s.active && setForm({ ...form, scheduleMode: 'preset', schedule: s.value })}
                                className="accent-[#84cc16] shrink-0 cursor-pointer" />
                              <div className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => s.active && setForm({ ...form, scheduleMode: 'preset', schedule: s.value })}>
                                <p className="text-xs font-bold text-slate-700 truncate">{s.label}</p>
                                <p className="text-[10px] font-mono text-slate-500">{s.value}</p>
                              </div>

                              {/* Controles de gestión — solo admin */}
                              {isAdmin && (
                                <>
                                  <button type="button" onClick={() => toggleSchedActive(s.id)}
                                    title={s.active ? 'Desactivar' : 'Activar'}
                                    className={`relative w-8 h-4 rounded-full transition-colors shrink-0 cursor-pointer ${s.active ? 'bg-[#84cc16]' : 'bg-slate-300'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${s.active ? 'translate-x-4' : 'translate-x-0'}`} />
                                  </button>
                                  <button type="button" onClick={() => startSchedEdit(s)}
                                    className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors shrink-0" title="Editar horario">
                                    <MdEdit size={13} />
                                  </button>
                                  <button type="button" onClick={() => deleteSchedule(s.id)}
                                    className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0" title="Eliminar horario">
                                    <MdDelete size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                    {/* Opción: Horario Personalizado — visible solo si allowCustom */}
                    {(isAdmin || allowCustom) && (
                      <div className={`rounded-xl border transition-all ${allowCustom ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-50'}`}>
                        <div className="flex items-center gap-2 px-3 py-2">
                          <input type="radio" name="schedulePreset"
                            checked={form.scheduleMode === 'custom'}
                            disabled={!allowCustom}
                            onChange={() => allowCustom && setForm({ ...form, scheduleMode: 'custom', schedule: '' })}
                            className="accent-[#84cc16] shrink-0 cursor-pointer" />
                          <div className="flex-1 flex items-center gap-1.5 cursor-pointer"
                            onClick={() => allowCustom && setForm({ ...form, scheduleMode: 'custom', schedule: '' })}>
                            <MdTune size={13} className={allowCustom ? 'text-[#65a30d]' : 'text-slate-400'} />
                            <span className="text-xs font-bold text-slate-700">Horario Personalizado</span>
                          </div>
                          {/* Toggle — solo admin */}
                          {isAdmin && (
                            <button type="button" onClick={toggleAllowCustom}
                              title={allowCustom ? 'Desactivar opción personalizado' : 'Activar opción personalizado'}
                              className={`relative w-8 h-4 rounded-full transition-colors shrink-0 cursor-pointer ${allowCustom ? 'bg-[#84cc16]' : 'bg-slate-300'}`}>
                              <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${allowCustom ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                          )}
                        </div>
                        {form.scheduleMode === 'custom' && allowCustom && (
                          <div className="px-3 pb-3">
                            <input autoFocus type="text" value={form.schedule}
                              onChange={e => setForm({ ...form, schedule: e.target.value.replace(/[^0-9:\-/, ]/g, '') })}
                              placeholder="Ej: 09:00 - 13:00, 14:00 - 17:00"
                              className="w-full border border-[#84cc16] rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Agregar nuevo horario — solo admin */}
                    {isAdmin && (!showAddSched ? (
                      <button type="button" onClick={() => setShowAddSched(true)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-400 hover:border-[#84cc16] hover:text-[#65a30d] transition-all">
                        <MdAdd size={14} /> Agregar nuevo horario
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl border border-[#84cc16]/40 bg-[#84cc16]/5 space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Nuevo horario</p>
                        <div className="flex gap-2 flex-wrap">
                          <input type="text" value={newSched.label} autoFocus
                            onChange={e => setNewSched({ ...newSched, label: e.target.value })}
                            placeholder="Nombre" className="flex-1 min-w-[100px] border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#84cc16]" />
                          <input type="text" value={newSched.value}
                            onChange={e => setNewSched({ ...newSched, value: e.target.value.replace(/[^0-9:\-/, ]/g, '') })}
                            placeholder="22:00 - 06:00" className="w-32 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#84cc16]" />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setShowAddSched(false)}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-600 transition-colors">Cancelar</button>
                          <button type="button" onClick={addSchedule}
                            className="px-3 py-1.5 rounded-lg bg-[#84cc16] hover:bg-[#65a30d] text-xs font-bold text-white transition-colors">Agregar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer fijo */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
              <button type="submit" form="edit-area-form"
                className="flex items-center gap-2 px-5 py-2.5 bg-[#84cc16] hover:bg-[#65a30d] rounded-xl text-sm font-bold text-white shadow-md transition-all">
                <MdSave size={18} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL HISTORIAL ── */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
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
