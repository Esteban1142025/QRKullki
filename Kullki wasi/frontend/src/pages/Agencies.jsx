import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api/apiClient';
import Swal from 'sweetalert2';
import { MdStore, MdLocationOn, MdPhone, MdAdd, MdEdit, MdDelete, MdClose, MdSave, MdRefresh } from 'react-icons/md';

const Agencies = () => {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id: '', id_agencia: null, name: '', address: '', phone: '', type: 'Sucursal', status: 'Activo' });

  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/agencias');
      setAgencies(res.data);
    } catch (err) {
      console.error('Error al cargar agencias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgencies(); }, [fetchAgencies]);

  const openAdd = () => {
    setForm({ id: '', id_agencia: null, name: '', address: '', phone: '', type: 'Sucursal', status: 'Activo' });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (agency) => {
    setForm({ ...agency });
    setEditing(agency);
    setShowForm(true);
  };

  const handleDelete = (agency) => {
    Swal.fire({
      title: '¿Eliminar Sucursal?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#ffffff',
      color: '#1e293b'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiClient.delete(`/agencias/${agency.id_agencia}`);
          await fetchAgencies();
          Swal.fire({ icon: 'success', title: 'Agencia Eliminada', timer: 1500, showConfirmButton: false });
        } catch (err) {
          Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'No se pudo eliminar la agencia.' });
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedId   = form.id.trim().toUpperCase();
    const trimmedName = form.name.trim();

    if (!editing && (!trimmedId || trimmedId.length < 2 || trimmedId.length > 5)) {
      Swal.fire({ icon: 'error', title: 'Código inválido', text: 'El código debe tener entre 2 y 5 caracteres alfanuméricos.', background: '#ffffff', color: '#1e293b' });
      return;
    }
    if (trimmedName.length < 2) {
      Swal.fire({ icon: 'error', title: 'Nombre inválido', text: 'El nombre de la agencia debe tener al menos 2 caracteres.', background: '#ffffff', color: '#1e293b' });
      return;
    }

    const payload = {
      nombre: trimmedName,
      codigo: trimmedId || undefined,
      direccion: form.address.trim() || undefined,
      telefono: form.phone || undefined,
      tipo: form.type,
      estado: form.status === 'Activo',
    };

    try {
      if (editing) {
        await apiClient.put(`/agencias/${editing.id_agencia}`, payload);
      } else {
        await apiClient.post('/agencias', payload);
      }
      await fetchAgencies();
      setShowForm(false);
      Swal.fire({ icon: 'success', title: 'Agencia Guardada', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'Error al guardar la agencia.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#8DC63F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Cargando agencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Red de Sucursales</h2>
          <p className="text-sm text-slate-500 mt-1">Gestione las agencias físicas y puntos de extensión de la cooperativa.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAgencies} className="btn-icon" title="Actualizar">
            <MdRefresh size={18} />
          </button>
          <button onClick={openAdd} className="btn-primary shrink-0">
            <MdAdd size={18} />
            NUEVA AGENCIA
          </button>
        </div>
      </div>

      {/* Mapa Operativo */}
      <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#84cc16]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-2 mb-6">
          <MdLocationOn size={20} className="text-[#84cc16]" />
          <h3 className="font-bold font-['Outfit'] tracking-wider uppercase text-sm">Mapa Operativo en Tiempo Real</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 relative z-10">
          {agencies.map(agency => {
            const active = agency.status === 'Activo';
            const statusColor = active ? 'bg-emerald-500 shadow-emerald-500/40 text-emerald-950' : 'bg-slate-600 shadow-slate-600/40 text-slate-100';
            const pingColor = active ? 'bg-emerald-400' : 'bg-slate-500';
            const statusText = active ? 'Normal' : 'Desconectado';
            return (
              <div key={agency.id} className={`${statusColor} rounded-xl p-3 shadow-lg flex flex-col justify-between aspect-video transition-all`}>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{agency.id}</span>
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${pingColor}`}></span>
                  </span>
                </div>
                <div>
                  <p className="font-bold text-xs truncate" title={agency.name}>{agency.name}</p>
                  <p className="text-[9px] font-bold uppercase mt-0.5 opacity-80">{statusText}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agencies.map(agency => (
          <div key={agency.id} className="card-corporate p-6 flex flex-col justify-between h-full group hover:-translate-y-1 transition-transform duration-300">
            <div className="mb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#84cc16] to-[#facc15] flex items-center justify-center text-white shadow-md">
                    <MdStore size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{agency.name}</h3>
                    <span className="text-[11px] text-[#65a30d] font-bold tracking-widest uppercase bg-[#84cc16]/10 px-2 py-0.5 rounded border border-[#84cc16]/20">{agency.id}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 mt-5 text-sm">
                {agency.address && (
                  <div className="flex items-start gap-2 text-slate-500">
                    <MdLocationOn size={18} className="shrink-0 mt-0.5 text-slate-400" />
                    <span className="leading-relaxed font-medium">{agency.address}</span>
                  </div>
                )}
                {agency.phone && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <MdPhone size={18} className="shrink-0 text-slate-400" />
                    <span className="font-mono font-bold">{agency.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${agency.status === 'Activo' ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${agency.status === 'Activo' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{agency.status}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(agency)} className="btn-icon">
                  <MdEdit size={16} />
                </button>
                <button onClick={() => handleDelete(agency)} className="btn-icon text-red-500 hover:bg-red-50 hover:text-red-600 border-transparent">
                  <MdDelete size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 font-['Outfit'] uppercase tracking-wider">
                  {editing ? 'Editar Agencia' : 'Nueva Agencia'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {editing ? 'Modifica los datos de la agencia seleccionada' : 'Complete los campos para registrar una nueva agencia'}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <MdClose size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Fila 1: Código + Tipo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="form-label">ID / Código</label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={e => setForm({...form, id: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 5)})}
                    placeholder="Ej: MAT, PEL, PIL..."
                    maxLength={5}
                    disabled={!!editing}
                    className="form-input disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-400">2–5 caracteres alfanuméricos. No editable tras crear.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="form-label">Tipo de Agencia</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="form-input">
                    <option value="Principal">Principal</option>
                    <option value="Sucursal">Sucursal</option>
                    <option value="Extensión">Extensión</option>
                  </select>
                </div>
              </div>

              {/* Fila 2: Nombre (ancho completo) */}
              <div className="space-y-1.5">
                <label className="form-label">Nombre de la Agencia</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Ej: Matriz Ambato, Agencia Pelileo..."
                  className="form-input"
                />
              </div>

              {/* Fila 3: Dirección (ancho completo) */}
              <div className="space-y-1.5">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="Ej: Av. Celedonio Toledo & Quis Quis"
                  className="form-input"
                />
              </div>

              {/* Fila 4: Teléfono + Estado */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '').slice(0, 15)})}
                    placeholder="Ej: 032821234"
                    maxLength={15}
                    className="form-input"
                  />
                  <p className="text-[10px] text-slate-400">Solo dígitos, máximo 15</p>
                </div>
                <div className="space-y-1.5">
                  <label className="form-label">Estado Operacional</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="form-input">
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <MdSave size={18} /> Guardar Agencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agencies;
