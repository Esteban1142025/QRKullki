import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  MdArrowBack, MdSave, MdAdd, MdEdit, MdDelete, MdCheck, MdClose, MdTune
} from 'react-icons/md';
import Swal from 'sweetalert2';
import apiClient from '../services/api/apiClient';
import { useAuth } from '../context/AuthContext';
import { agencyKey } from '../utils/agencyStorage';

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
    if (!raw) { localStorage.setItem(key, JSON.stringify(DEFAULT_SCHEDULES)); return DEFAULT_SCHEDULES; }
    const parsed = JSON.parse(raw);
    if (parsed.length && parsed[0].id === undefined) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_SCHEDULES)); return DEFAULT_SCHEDULES;
    }
    return parsed;
  } catch { return DEFAULT_SCHEDULES; }
};

const readAllowCustom = (agency) => {
  try { return JSON.parse(localStorage.getItem(agencyKey(ALLOW_CUSTOM_KEY, agency)) ?? 'true'); }
  catch { return true; }
};

const validateSchedule = (s) =>
  /^(\d{2}:\d{2}\s*[-]\s*\d{2}:\d{2})(\s*[,/]\s*\d{2}:\d{2}\s*[-]\s*\d{2}:\d{2})*$/.test(s.trim()) || s.trim() === '24/7';

const AreaForm = () => {
  const navigate   = useNavigate();
  const { areaId } = useParams();
  const location   = useLocation();
  const { user }   = useAuth();

  const isEdit  = !!areaId;
  const area    = location.state?.area;
  const agency  = user?.agency;
  const isAdmin = user?.role === 'admin';

  // Redirect if edit mode without area state
  useEffect(() => {
    if (isEdit && !area) navigate('/restricted-areas', { replace: true });
  }, [isEdit, area, navigate]);

  // Schedule management
  const [schedules,     setSchedules]     = useState(() => readSchedules(agency));
  const [allowCustom,   setAllowCustom]   = useState(() => readAllowCustom(agency));
  const [schedEditId,   setSchedEditId]   = useState(null);
  const [schedEditForm, setSchedEditForm] = useState({ label: '', value: '' });
  const [newSched,      setNewSched]      = useState({ label: '', value: '' });
  const [showAddSched,  setShowAddSched]  = useState(false);

  // Form values
  const [nombre,       setNombre]       = useState('');
  const [riskLevel,    setRiskLevel]    = useState('Bajo');
  const [schedule,     setSchedule]     = useState('');
  const [scheduleMode, setScheduleMode] = useState('preset');
  const [agencias,     setAgencias]     = useState([]);
  const [agenciaId,    setAgenciaId]    = useState(null);
  const [saving,       setSaving]       = useState(false);

  // Initialize edit values
  useEffect(() => {
    if (!isEdit || !area) return;
    setRiskLevel(area.riskLevel || 'Bajo');
    const fresh    = readSchedules(agency);
    const isPreset = fresh.some(s => s.value === area.schedule && s.active);
    setSchedule(area.schedule || '');
    setScheduleMode(isPreset ? 'preset' : 'custom');
  }, [isEdit, area, agency]);

  // Load agencies for create mode
  useEffect(() => {
    if (isEdit) return;
    apiClient.get('/agencias').then(res => {
      setAgencias(res.data);
      if (agency) {
        const match = res.data.find(ag => ag.id === agency);
        if (match) setAgenciaId(match.id_agencia);
      }
    }).catch(console.error);
  }, [isEdit, agency]);

  /* ── Schedule helpers ── */
  const persistSchedules = (updated) => {
    setSchedules(updated);
    localStorage.setItem(agencyKey(SCHED_KEY, agency), JSON.stringify(updated));
    const sel = updated.find(s => s.value === schedule);
    if (sel && !sel.active) { setSchedule(''); setScheduleMode('preset'); }
  };

  const toggleSchedActive = (id) =>
    persistSchedules(schedules.map(s => s.id === id ? { ...s, active: !s.active } : s));

  const startSchedEdit = (s) => { setSchedEditId(s.id); setSchedEditForm({ label: s.label, value: s.value }); };

  const saveSchedEdit = (id) => {
    const label = schedEditForm.label.trim();
    const value = schedEditForm.value.trim();
    if (!label || !value) return;
    if (schedules.some(s => s.id !== id && s.value === value)) {
      Swal.fire({ icon: 'warning', title: 'Valor duplicado', text: `Ya existe un horario "${value}".`, background: '#ffffff', color: '#1e293b' }); return;
    }
    const updated = schedules.map(s => s.id === id ? { ...s, label, value } : s);
    persistSchedules(updated);
    if (schedule === schedules.find(s => s.id === id)?.value) setSchedule(value);
    setSchedEditId(null);
  };

  const deleteSchedule = (id) => persistSchedules(schedules.filter(s => s.id !== id));

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
    if (!next && scheduleMode === 'custom') { setScheduleMode('preset'); setSchedule(''); }
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && nombre.trim().length < 2) {
      Swal.fire({ icon: 'warning', title: 'Nombre inválido', text: 'El nombre debe tener al menos 2 caracteres.', background: '#ffffff', color: '#1e293b' }); return;
    }
    if (!schedule) {
      Swal.fire({ icon: 'warning', title: 'Horario requerido', text: 'Selecciona o ingresa un horario válido.', background: '#ffffff', color: '#1e293b' }); return;
    }
    if (scheduleMode === 'custom' && !validateSchedule(schedule)) {
      Swal.fire({ icon: 'warning', title: 'Formato inválido', text: 'Usa el formato HH:MM - HH:MM o 24/7.', background: '#ffffff', color: '#1e293b' }); return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await apiClient.put(`/areas/${areaId}`, { nivel_riesgo: riskLevel, horario: schedule });
        try {
          const histKey = agencyKey(HISTORY_KEY, agency);
          const prev    = JSON.parse(localStorage.getItem(histKey) || '[]');
          localStorage.setItem(histKey, JSON.stringify([{
            id: Date.now(), areaId: area.id, areaName: area.name,
            timestamp: new Date().toISOString(), user: user?.name || 'Sistema',
            changes: `Actualizado: Riesgo(${riskLevel}), Horario(${schedule})`,
          }, ...prev]));
        } catch {}
        Swal.fire({ icon: 'success', title: 'Área Actualizada', timer: 1500, showConfirmButton: false, background: '#ffffff', color: '#1e293b' });
      } else {
        await apiClient.post('/areas', { nombre: nombre.trim(), nivel_riesgo: riskLevel, horario: schedule, id_agencia: agenciaId || null });
        Swal.fire({ icon: 'success', title: 'Área Creada', timer: 1500, showConfirmButton: false, background: '#ffffff', color: '#1e293b' });
      }
      navigate('/restricted-areas');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'Error al guardar el área.', background: '#ffffff', color: '#1e293b' });
    } finally {
      setSaving(false);
    }
  };

  const selectPreset = (s) => { if (s.active) { setSchedule(s.value); setScheduleMode('preset'); } };

  /* ── Eliminar área ── */
  const handleDelete = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar área?',
      html: `Esta acción eliminará permanentemente el área <strong>${area?.name}</strong> y no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      background: '#ffffff',
      color: '#1e293b',
    });
    if (!result.isConfirmed) return;
    try {
      await apiClient.delete(`/areas/${areaId}`);
      Swal.fire({ icon: 'success', title: 'Área Eliminada', timer: 1500, showConfirmButton: false, background: '#ffffff', color: '#1e293b' });
      navigate('/restricted-areas');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'No se pudo eliminar el área.', background: '#ffffff', color: '#1e293b' });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/restricted-areas')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold shrink-0">
          <MdArrowBack size={20} /> Volver
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">
            {isEdit ? `Editar Área: ${area?.name ?? ''}` : 'Nueva Área Restringida'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEdit ? 'Modifica el nivel de riesgo y el horario de acceso.' : 'Completa los datos para registrar una nueva área restringida.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Información general ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Información General</p>

          {!isEdit && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Nombre del Área <span className="text-red-400">*</span>
              </label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Bóveda Principal, Sala de Servidores..."
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30 focus:border-[#84cc16]" />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Nivel de Riesgo</label>
            <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30 focus:border-[#84cc16]">
              <option>Bajo</option><option>Medio</option><option>Alto</option><option>Crítico</option>
            </select>
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Agencia</label>
              <select value={agenciaId ?? ''} onChange={e => setAgenciaId(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30 focus:border-[#84cc16]">
                <option value="">Sin agencia asignada</option>
                {agencias.map(ag => (
                  <option key={ag.id_agencia} value={ag.id_agencia}>
                    {ag.name}{ag.id && ag.id !== `AG-${ag.id_agencia}` ? ` (${ag.id})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Horario ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Horario Permitido <span className="text-red-400">*</span>
            </p>
            {isAdmin && isEdit && (
              <p className="text-[10px] text-slate-400 text-right">
                Lápiz para editar · toggle para activar/desactivar · basura para eliminar
              </p>
            )}
          </div>

          <div className="space-y-2">
            {schedules.filter(s => isAdmin || s.active).map(s => (
              <div key={s.id}
                className={`rounded-xl border transition-all ${s.active ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200 opacity-40'}`}>

                {isAdmin && schedEditId === s.id ? (
                  /* Fila en edición */
                  <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
                    <input autoFocus type="text" value={schedEditForm.label}
                      onChange={e => setSchedEditForm({ ...schedEditForm, label: e.target.value })}
                      placeholder="Nombre"
                      className="flex-1 min-w-[120px] border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#84cc16]" />
                    <input type="text" value={schedEditForm.value}
                      onChange={e => setSchedEditForm({ ...schedEditForm, value: e.target.value.replace(/[^0-9:\-/, ]/g, '') })}
                      placeholder="08:00 - 17:00"
                      className="w-36 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#84cc16]" />
                    <button type="button" onClick={() => saveSchedEdit(s.id)}
                      className="p-2 rounded-lg bg-[#84cc16] hover:bg-[#65a30d] text-white transition-colors">
                      <MdCheck size={16} />
                    </button>
                    <button type="button" onClick={() => setSchedEditId(null)}
                      className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors">
                      <MdClose size={16} />
                    </button>
                  </div>
                ) : (
                  /* Fila normal */
                  <div className="flex items-center gap-3 px-4 py-3">
                    <input type="radio"
                      checked={scheduleMode === 'preset' && schedule === s.value}
                      disabled={!s.active}
                      onChange={() => selectPreset(s)}
                      className="accent-[#84cc16] shrink-0 cursor-pointer w-4 h-4" />
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => selectPreset(s)}>
                      <p className="text-sm font-bold text-slate-700">{s.label}</p>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">{s.value}</p>
                    </div>
                    {isAdmin && isEdit && (
                      <>
                        <button type="button"
                          onClick={() => toggleSchedActive(s.id)}
                          title={s.active ? 'Desactivar' : 'Activar'}
                          className={`relative w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer ${s.active ? 'bg-[#84cc16]' : 'bg-slate-300'}`}>
                          <span className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${s.active ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <button type="button" onClick={() => startSchedEdit(s)}
                          className="p-1.5 rounded text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                          <MdEdit size={14} />
                        </button>
                        <button type="button" onClick={() => deleteSchedule(s.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <MdDelete size={14} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Horario personalizado */}
            {(isAdmin || allowCustom) && (
              <div className={`rounded-xl border transition-all ${allowCustom ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200 opacity-40'}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <input type="radio"
                    checked={scheduleMode === 'custom'}
                    disabled={!allowCustom}
                    onChange={() => { if (allowCustom) { setScheduleMode('custom'); setSchedule(''); } }}
                    className="accent-[#84cc16] shrink-0 cursor-pointer w-4 h-4" />
                  <div className="flex-1 flex items-center gap-2 cursor-pointer"
                    onClick={() => { if (allowCustom) { setScheduleMode('custom'); setSchedule(''); } }}>
                    <MdTune size={15} className={allowCustom ? 'text-[#65a30d]' : 'text-slate-400'} />
                    <span className="text-sm font-bold text-slate-700">Horario Personalizado</span>
                  </div>
                  {isAdmin && isEdit && (
                    <button type="button" onClick={toggleAllowCustom}
                      title={allowCustom ? 'Desactivar opción personalizado' : 'Activar opción personalizado'}
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 cursor-pointer ${allowCustom ? 'bg-[#84cc16]' : 'bg-slate-300'}`}>
                      <span className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${allowCustom ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  )}
                </div>
                {scheduleMode === 'custom' && allowCustom && (
                  <div className="px-4 pb-4">
                    <input autoFocus type="text" value={schedule}
                      onChange={e => setSchedule(e.target.value.replace(/[^0-9:\-/, ]/g, ''))}
                      placeholder="Ej: 09:00 - 13:00, 14:00 - 17:00"
                      className="w-full border border-[#84cc16] rounded-xl px-4 py-3 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30" />
                  </div>
                )}
              </div>
            )}

            {/* Agregar nuevo horario — solo admin en modo edición */}
            {isAdmin && isEdit && (!showAddSched ? (
              <button type="button" onClick={() => setShowAddSched(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-300 text-sm font-bold text-slate-400 hover:border-[#84cc16] hover:text-[#65a30d] transition-all">
                <MdAdd size={16} /> Agregar nuevo horario
              </button>
            ) : (
              <div className="p-4 rounded-xl border border-[#84cc16]/40 bg-[#84cc16]/5 space-y-3">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Nuevo horario</p>
                <div className="flex gap-3 flex-wrap">
                  <input type="text" value={newSched.label} autoFocus
                    onChange={e => setNewSched({ ...newSched, label: e.target.value })}
                    placeholder="Nombre"
                    className="flex-1 min-w-[120px] border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#84cc16]" />
                  <input type="text" value={newSched.value}
                    onChange={e => setNewSched({ ...newSched, value: e.target.value.replace(/[^0-9:\-/, ]/g, '') })}
                    placeholder="22:00 - 06:00"
                    className="w-36 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#84cc16]" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowAddSched(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-sm font-bold text-slate-600 transition-colors">
                    Cancelar
                  </button>
                  <button type="button" onClick={addSchedule}
                    className="px-4 py-2 rounded-xl bg-[#84cc16] hover:bg-[#65a30d] text-sm font-bold text-white transition-colors">
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Acciones ── */}
        <div className="flex items-center justify-between gap-3 pb-6">
          {/* Eliminar — solo en modo edición */}
          {isEdit ? (
            <button type="button" onClick={handleDelete}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-sm font-bold text-red-600 transition-all">
              <MdDelete size={16} /> Eliminar Área
            </button>
          ) : <span />}

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/restricted-areas')}
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#84cc16] hover:bg-[#65a30d] disabled:opacity-60 rounded-xl text-sm font-bold text-white shadow-md transition-all">
              <MdSave size={18} />
              {saving ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Crear Área')}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default AreaForm;
