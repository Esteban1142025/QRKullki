import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/apiClient';
import { MdCheckCircle, MdLockClock, MdShield } from 'react-icons/md';

const DashboardEmpleado = () => {
  const { user } = useAuth();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/areas')
      .then(res => setAreas(res.data))
      .catch(err => console.error('Error al cargar áreas:', err))
      .finally(() => setLoading(false));
  }, []);

  const userRole = user?.role || 'empleado';
  const assignedAreas = areas.filter(area =>
    (area.allowedRoles || []).includes('all') || (area.allowedRoles || []).includes(userRole)
  );

  return (
    <div className="space-y-6">

      {/* ── WELCOME BANNER ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#8DC63F]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#facc15]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-[#79ac34] font-bold uppercase tracking-widest mb-1">Cooperativa Kullki Wasi — Módulo Personal</p>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 font-['Outfit'] leading-tight">
              Mis Permisos de Acceso
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xl leading-relaxed">
              Bienvenido, <strong className="text-slate-700">{user?.name}</strong>. Aquí puedes visualizar las áreas a las que estás autorizado ingresar en{' '}
              <strong className="text-[#79ac34]">{user?.agencyDisplayName || user?.agencyName || (user?.agency === 'MAT' ? 'Matriz Ambato' : user?.agency)}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shrink-0 shadow-sm">
            <MdCheckCircle className="text-[#8DC63F]" size={16} />
            <span className="text-xs font-bold text-[#8DC63F] uppercase tracking-wide">Credencial Activa</span>
          </div>
        </div>
      </div>

      {/* ── ASSIGNED AREAS GRID ────────────────────── */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-300 pb-2">
          Áreas Asignadas ({loading ? '…' : assignedAreas.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-[#8DC63F] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assignedAreas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedAreas.map(area => (
              <div key={area.id} className="p-5 rounded-2xl glass-panel border-2 border-transparent hover:border-[#8DC63F]/40 flex flex-col justify-between transition-all">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#8DC63F]/15 flex items-center justify-center text-[#79ac34]">
                      <MdShield size={20} />
                    </div>
                    <span className="inline-block px-2 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-bold uppercase">
                      Acceso Autorizado
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-slate-800 font-['Outfit']">{area.name}</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Nivel de Riesgo: {area.riskLevel}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 flex items-center gap-2 text-slate-600">
                  <MdLockClock size={16} className="text-[#79ac34]" />
                  <span className="text-xs font-bold">Horario: {area.schedule}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
            <MdShield size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-sm">No tienes áreas asignadas con tu rol actual.</p>
            <p className="text-xs mt-1">Contacta a Talento Humano si crees que hay un error.</p>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-500 font-medium">Cualquier inconsistencia en sus permisos, contacte a Talento Humano.</p>
      </div>

    </div>
  );
};

export default DashboardEmpleado;
