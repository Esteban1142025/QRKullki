import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import {
  MdHistory, MdSearch, MdRefresh, MdDeleteForever,
  MdCheckCircle, MdCancel, MdFilterList, MdShield, MdPerson,
} from 'react-icons/md';
import { readEvents, clearEvents } from '../utils/eventLogger';

const ROLE_NAMES = {
  admin:            'Administrador General',
  talento_humano:   'Talento Humano',
  riesgos:          'Oficial de Riesgos',
  seguridad_fisica: 'Seguridad Física',
  auditor:          'Auditor Interno',
  jefe_agencia:     'Jefe de Agencia',
  tecnico_ti:       'Técnico TI',
  empleado:         'Empleado',
};

const fmt = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  };
};

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents]         = useState([]);
  const [search, setSearch]         = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterAction, setFilterAction] = useState('ALL');

  const agency = user?.agency;

  const load = useCallback(() => setEvents(readEvents(agency)), [agency]);
  useEffect(() => { load(); }, [load]);

  const uniqueRoles = [...new Set(events.map(e => e.role))];

  const filtered = events.filter(e => {
    if (filterRole !== 'ALL' && e.role !== filterRole) return false;
    if (filterAction !== 'ALL' && e.action !== filterAction) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        e.roleName?.toLowerCase().includes(s) ||
        e.permissionLabel?.toLowerCase().includes(s) ||
        e.by?.toLowerCase().includes(s) ||
        e.permission?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const handleClear = async () => {
    const res = await Swal.fire({
      icon: 'warning',
      title: '¿Limpiar historial?',
      text: 'Se eliminarán todos los eventos de permisos registrados. Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      background: '#ffffff', color: '#1e293b',
    });
    if (!res.isConfirmed) return;
    clearEvents(agency);
    setEvents([]);
    Swal.fire({ icon: 'success', title: 'Historial limpiado', timer: 1400, showConfirmButton: false, background: '#ffffff', color: '#1e293b' });
  };

  const grantedCount = events.filter(e => e.action === 'granted').length;
  const revokedCount = events.filter(e => e.action === 'revoked').length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Eventos de Permisos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Registro de cambios de permisos realizados en la agencia <span className="font-bold text-slate-700">{user?.agencyName || agency}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={load} className="btn-icon" title="Actualizar">
            <MdRefresh size={18} />
          </button>
          <button onClick={handleClear} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-all cursor-pointer">
            <MdDeleteForever size={16} />
            Limpiar historial
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-corporate p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <MdHistory size={22} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Eventos</p>
            <p className="text-2xl font-black text-slate-800 font-['Outfit']">{events.length}</p>
          </div>
        </div>
        <div className="card-corporate p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
            <MdCheckCircle size={22} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Permisos Otorgados</p>
            <p className="text-2xl font-black text-emerald-600 font-['Outfit']">{grantedCount}</p>
          </div>
        </div>
        <div className="card-corporate p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-400 shrink-0">
            <MdCancel size={22} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Permisos Revocados</p>
            <p className="text-2xl font-black text-red-500 font-['Outfit']">{revokedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-corporate p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="sm:col-span-1 space-y-1.5">
          <label className="form-label flex items-center gap-1.5"><MdSearch size={14} /> Buscar</label>
          <input
            type="text"
            placeholder="Permiso, rol, administrador…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input w-full"
          />
        </div>
        <div className="space-y-1.5">
          <label className="form-label flex items-center gap-1.5"><MdShield size={14} /> Rol afectado</label>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="form-input w-full">
            <option value="ALL">Todos los roles</option>
            {uniqueRoles.map(r => (
              <option key={r} value={r}>{ROLE_NAMES[r] || r}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="form-label flex items-center gap-1.5"><MdFilterList size={14} /> Acción</label>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="form-input w-full">
            <option value="ALL">Todas las acciones</option>
            <option value="granted">Solo otorgados</option>
            <option value="revoked">Solo revocados</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card-corporate overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Administrador</th>
                <th>Rol Afectado</th>
                <th>Permiso</th>
                <th className="text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(evt => {
                const { date, time } = fmt(evt.timestamp);
                return (
                  <tr key={evt.id}>
                    <td className="font-mono text-xs whitespace-nowrap">
                      <p className="text-slate-700 font-bold">{date}</p>
                      <p className="text-slate-400 text-[10px]">{time}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-slate-900 bg-gradient-to-br from-[#84cc16] to-[#facc15] shrink-0">
                          {evt.by?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="text-slate-800 font-semibold text-xs">{evt.by}</p>
                          <p className="text-slate-400 text-[10px] font-mono">{evt.by_dni}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-slate-700 font-semibold text-xs">{evt.roleName}</p>
                      <p className="text-slate-400 text-[10px] font-mono">{evt.role}</p>
                    </td>
                    <td>
                      <p className="text-slate-800 text-xs font-medium">{evt.permissionLabel}</p>
                      <p className="text-slate-400 text-[10px] font-mono">{evt.permission}</p>
                    </td>
                    <td className="text-center">
                      {evt.action === 'granted' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <MdCheckCircle size={11} /> OTORGADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                          <MdCancel size={11} /> REVOCADO
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <MdHistory size={40} className="opacity-30" />
                      <p className="text-sm font-medium">
                        {events.length === 0
                          ? 'Aún no hay eventos registrados. Los cambios de permisos en Roles y Permisos aparecerán aquí.'
                          : 'No hay eventos que coincidan con los filtros actuales.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-500">
          <span>Agencia: {agency} — Auditoría RBAC</span>
        </div>
      </div>

    </div>
  );
};

export default Events;
