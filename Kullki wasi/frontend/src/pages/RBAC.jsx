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
  { id: 'read_monitoring', label: 'Monitorear Terminales QR',      category: 'Monitoreo' },
  { id: 'write_devices',   label: 'Configurar Dispositivos',       category: 'Monitoreo' },
  { id: 'validate_qr',     label: 'Simular Escaneo QR',            category: 'Accesos'   },
  { id: 'read_reports',    label: 'Generar Reportes PDF/XLS',      category: 'Auditoría' },
];

const CATEGORY_COLORS = {
  Sistema:   'text-red-400 bg-red-500/10 border-red-500/25',
  Personal:  'text-blue-400 bg-blue-500/10 border-blue-500/25',
  Auditoría: 'text-purple-400 bg-purple-500/10 border-purple-500/25',
  Seguridad: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
  Monitoreo: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
  Accesos:   'text-[#8DC63F] bg-[#8DC63F]/10 border-[#8DC63F]/25',
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
      confirmButtonColor: '#0d2347', background: '#0d1424', color: '#f1f5f9',
    });
  };

  const activeRole = rolesData[activeRoleId];
  const isSuperAdmin = activeRole.permissions.includes('all');

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 font-['Outfit']">Control de Acceso Basado en Roles</h2>
          <p className="text-xs text-slate-400 mt-0.5">Configure los privilegios de cada perfil institucional y la visibilidad de módulos.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0d2347] hover:bg-[#163668] border border-[#8DC63F]/35 hover:border-[#8DC63F] rounded-xl text-xs font-bold text-slate-200 tracking-wider transition-all cursor-pointer shadow-lg shrink-0"
        >
          <MdSave size={15} className="text-[#8DC63F]" />
          COMPILAR POLÍTICAS RBAC
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#0d2347]/30 border border-[#8DC63F]/15">
        <MdInfoOutline size={18} className="text-[#8DC63F] shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">Cambios en tiempo real.</strong> Las modificaciones de permisos se propagan inmediatamente a empleados con sesiones activas. Tenga especial cuidado al otorgar{' '}
          <span className="text-red-400 font-bold">Acceso Total</span> o{' '}
          <span className="text-[#8DC63F] font-bold">Resolver Incidentes</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── SELECTOR DE ROL ──────────────────────── */}
        <div className="lg:col-span-4 space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Perfiles Institucionales</p>
          <div className="space-y-1.5">
            {Object.values(rolesData).map(role => {
              const active = activeRoleId === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRoleId(role.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-[#0d1424] border-[#8DC63F]/40 shadow-lg shadow-[#8DC63F]/5'
                      : 'bg-[#0d1424]/40 border-slate-800/50 hover:bg-[#0d1424]/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-bold text-xs font-['Outfit'] ${active ? 'text-[#8DC63F]' : 'text-slate-300'}`}>
                      {role.name}
                    </span>
                    <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                      active ? 'bg-[#8DC63F]/15 text-[#8DC63F] border-[#8DC63F]/30' : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}>
                      {role.id}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{role.description}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <MdLockOpen size={12} className="text-slate-600" />
                    <span className="text-[9px] text-slate-600">
                      {role.permissions.includes('all') ? 'Todos los privilegios' : `${role.permissions.length} privilegio(s)`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MATRIZ DE PERMISOS ───────────────────── */}
        <div className="lg:col-span-8 p-5 rounded-2xl glass-panel border border-slate-800/70">

          {/* Header del rol activo */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800/60 mb-4 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">
                Permisos: {activeRole.name}
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Haga clic en un permiso para activar o revocar.</p>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] px-2.5 py-1 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-slate-400 shrink-0">
              <MdShield size={13} className="text-[#8DC63F]" />
              {isSuperAdmin ? 'SUPER ADMIN' : `${activeRole.permissions.length} activos`}
            </div>
          </div>

          {/* Permissions list */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {PERMISSIONS.map(({ id, label, category }) => {
              const hasPerm = isSuperAdmin || activeRole.permissions.includes(id);
              const catStyle = CATEGORY_COLORS[category] ?? 'text-slate-400 bg-slate-800 border-slate-700';

              return (
                <div
                  key={id}
                  onClick={() => togglePermission(activeRoleId, id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none ${
                    hasPerm
                      ? 'bg-[#8DC63F]/5 border-[#8DC63F]/20 hover:border-[#8DC63F]/40'
                      : 'bg-slate-950/50 border-slate-800/50 hover:bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      hasPerm ? 'bg-[#8DC63F]/10 text-[#8DC63F]' : 'bg-slate-900 text-slate-600'
                    }`}>
                      <MdSecurity size={15} />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${hasPerm ? 'text-slate-200' : 'text-slate-400'}`}>{label}</p>
                      <span className={`inline-block mt-0.5 text-[9px] font-bold uppercase px-1.5 py-0.25 rounded border ${catStyle}`}>
                        {category}
                      </span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 text-xs font-bold shrink-0 ${hasPerm ? 'text-[#8DC63F]' : 'text-slate-700'}`}>
                    {hasPerm ? <MdCheckCircle size={16} /> : <MdCancel size={16} />}
                    <span className="text-[9px] uppercase tracking-wider hidden sm:inline">
                      {hasPerm ? 'Permitido' : 'Denegado'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-600">
            <span>Cooperativa Kullki Wasi Ltda.</span>
            <span className="font-mono">Hash SHA-256 simulado</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RBAC;
