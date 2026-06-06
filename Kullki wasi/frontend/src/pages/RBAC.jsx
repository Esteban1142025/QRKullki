import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../data/mockData';
import Swal from 'sweetalert2';
import {
  MdSecurity, MdCheckCircle, MdCancel, MdSave, MdInfoOutline, MdLockOpen, MdShield
} from 'react-icons/md';

const PERMISSIONS = [
  { id: 'all',             label: 'Acceso Total (SuperAdmin)',     category: 'Sistema'   },
  { id: 'read_employees',  label: 'Ver Colaboradores',             category: 'Personal'  },
  { id: 'write_employees', label: 'Modificar Colaboradores',       category: 'Personal'  },
  { id: 'read_logs',       label: 'Consultar Bitácoras',           category: 'Auditoría' },
  { id: 'read_alerts',     label: 'Ver Alertas Críticas',          category: 'Seguridad' },
  { id: 'write_security',  label: 'Resolver Incidentes',           category: 'Seguridad' },
  { id: 'validate_qr',     label: 'Simular Escaneo QR',            category: 'Accesos'   },
  { id: 'read_reports',    label: 'Generar Reportes PDF/XLS',      category: 'Auditoría' },
];

const CATEGORY_COLORS = {
  Sistema:   'text-red-600 bg-red-100 border-red-200',
  Personal:  'text-blue-600 bg-blue-100 border-blue-200',
  Auditoría: 'text-purple-600 bg-purple-100 border-purple-200',
  Seguridad: 'text-orange-600 bg-orange-100 border-orange-200',
  Accesos:   'text-[#65a30d] bg-[#84cc16]/20 border-[#84cc16]/30',
};

const RBAC = () => {
  const { user } = useAuth();
  const [rolesData, setRolesData] = useState(() => {
    try {
      const stored = localStorage.getItem('kw_dynamic_roles');
      return stored ? JSON.parse(stored) : ROLES;
    } catch { return ROLES; }
  });
  const [activeRoleId, setActiveRoleId] = useState('admin');

  const saveRoles = (updated) => {
    setRolesData(updated);
    localStorage.setItem('kw_dynamic_roles', JSON.stringify(updated));
  };

  const togglePermission = (roleId, permId) => {
    const role = rolesData[roleId];
    let perms = [...role.permissions];

    if (permId === 'all') {
      perms = perms.includes('all') ? [] : ['all'];
    } else {
      perms = perms.filter(p => p !== 'all');
      perms = perms.includes(permId) ? perms.filter(p => p !== permId) : [...perms, permId];
    }

    const updated = { ...rolesData, [roleId]: { ...role, permissions: perms } };
    saveRoles(updated);

    // Audit log
    const log = {
      id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(),
      employeeId: user?.id, name: user?.name, role: user?.role,
      agency: user?.agency, area: 'Módulo RBAC', device: 'Navegador',
      status: 'Autorizado', details: `Permisos actualizados para rol '${role.name}': [${perms.join(', ')}]`, risk: 'Alto',
    };
    const existing = JSON.parse(localStorage.getItem('kw_dynamic_logs') || '[]');
    localStorage.setItem('kw_dynamic_logs', JSON.stringify([log, ...existing]));
  };

  const handleSave = () => {
    Swal.fire({
      icon: 'success', title: 'Políticas RBAC Guardadas',
      text: 'La matriz de permisos ha sido compilada y distribuida a los terminales QR.',
      confirmButtonColor: '#0d2347', background: '#ffffff', color: '#1e293b',
    });
  };

  const activeRole = rolesData[activeRoleId];
  const isSuperAdmin = activeRole.permissions.includes('all');

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Roles y Permisos</h2>
          <p className="text-sm text-slate-500 mt-1">Configure los privilegios de cada perfil institucional y la visibilidad de módulos.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 rounded-xl text-sm font-bold text-white tracking-wider transition-all cursor-pointer shadow-lg shrink-0"
        >
          <MdSave size={18} className="text-[#84cc16]" />
          COMPILAR POLÍTICAS RBAC
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-5 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/30 shadow-sm">
        <MdInfoOutline size={22} className="text-[#65a30d] shrink-0 mt-0.5" />
        <p className="text-sm text-slate-700 leading-relaxed font-medium">
          <strong className="text-slate-900 font-bold">Cambios en tiempo real.</strong> Las modificaciones de permisos se propagan inmediatamente a empleados con sesiones activas. Tenga especial cuidado al otorgar{' '}
          <span className="text-red-600 font-bold">Acceso Total</span> o{' '}
          <span className="text-[#65a30d] font-bold">Resolver Incidentes</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── SELECTOR DE ROL ──────────────────────── */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Perfiles Institucionales</p>
          <div className="space-y-2.5">
            {Object.values(rolesData).map(role => {
              const active = activeRoleId === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRoleId(role.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-white border-l-4 border-l-[#84cc16] border-y-slate-200 border-r-slate-200 shadow-md transform translate-x-1'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-black text-sm font-['Outfit'] ${active ? 'text-[#65a30d]' : 'text-slate-700'}`}>
                      {role.name}
                    </span>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                      active ? 'bg-[#84cc16]/20 text-[#65a30d]' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {role.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{role.description}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <MdLockOpen size={14} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-500">
                      {role.permissions.includes('all') ? 'Todos los privilegios' : `${role.permissions.length} privilegio(s)`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MATRIZ DE PERMISOS ───────────────────── */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white shadow-lg border border-slate-200">

          {/* Header del rol activo */}
          <div className="flex items-start justify-between pb-5 border-b border-slate-200 mb-5 gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-800 font-['Outfit']">
                Permisos: {activeRole.name}
              </h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">Haga clic en un permiso para activar o revocar.</p>
            </div>
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 font-mono text-slate-600 shrink-0 font-bold">
              <MdShield size={16} className="text-[#84cc16]" />
              {isSuperAdmin ? 'SUPER ADMIN' : `${activeRole.permissions.length} activos`}
            </div>
          </div>

          {/* Permissions list */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
            {PERMISSIONS.map(({ id, label, category }) => {
              const hasPerm = isSuperAdmin || activeRole.permissions.includes(id);
              const catStyle = CATEGORY_COLORS[category] ?? 'text-slate-500 bg-slate-100 border-slate-200';

              return (
                <div
                  key={id}
                  onClick={() => togglePermission(activeRoleId, id)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                    hasPerm
                      ? 'bg-[#84cc16]/5 border-[#84cc16]/40 hover:border-[#84cc16]'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      hasPerm ? 'bg-[#84cc16]/20 text-[#65a30d]' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <MdSecurity size={20} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${hasPerm ? 'text-slate-800' : 'text-slate-600'}`}>{label}</p>
                      <span className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${catStyle}`}>
                        {category}
                      </span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 text-sm font-bold shrink-0 ${hasPerm ? 'text-[#84cc16]' : 'text-slate-400'}`}>
                    {hasPerm ? <MdCheckCircle size={22} /> : <MdCancel size={22} />}
                    <span className="text-xs uppercase tracking-wider hidden sm:inline">
                      {hasPerm ? 'Permitido' : 'Denegado'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Cooperativa Kullki Wasi Ltda.</span>
            <span className="font-mono bg-slate-100 px-2 py-1 rounded">Hash SHA-256 simulado</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RBAC;
