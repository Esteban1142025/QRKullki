import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/apiClient';
import Swal from 'sweetalert2';
import {
  MdSecurity, MdCheckCircle, MdCancel, MdSave, MdInfoOutline,
  MdLockOpen, MdShield, MdRefresh
} from 'react-icons/md';

// Metadatos visuales de cada rol (no provienen de DB, son constantes de UI)
const ROLE_DISPLAY = {
  admin:           { displayName: 'Administrador General',    description: 'Acceso total y configuración del sistema' },
  talento_humano:  { displayName: 'Talento Humano',           description: 'Gestión de empleados, permisos laborales y reportes' },
  riesgos:         { displayName: 'Oficial de Riesgos',       description: 'Evaluación de bitácoras de seguridad e incidentes' },
  seguridad_fisica:{ displayName: 'Seguridad Física',         description: 'Validación QR y control de garita' },
  auditor:         { displayName: 'Auditor Interno',          description: 'Consulta de bitácoras y trazabilidad completa' },
  jefe_agencia:    { displayName: 'Jefe de Agencia',          description: 'Administración local de sucursal y accesos temporales' },
  tecnico_ti:      { displayName: 'Técnico TI',               description: 'Gestión técnica de dispositivos QR, red y servidores' },
  empleado:        { displayName: 'Empleado',                 description: 'Consulta de permisos propios y descarga de credencial QR' },
};

// IDs deben coincidir EXACTAMENTE con codigo_permiso en la tabla permisos de la BD
const PERMISSIONS = [
  { id: 'all',                label: 'Acceso Total (SuperAdmin)',        category: 'Sistema'   },
  { id: 'acceso_total',       label: 'Acceso Total a Áreas Restringidas',category: 'Accesos'   },
  { id: 'gestionar_usuarios', label: 'Gestionar Colaboradores',          category: 'Personal'  },
  { id: 'ver_reportes',       label: 'Ver Reportes de Accesos',          category: 'Auditoría' },
  { id: 'acceso_boveda',      label: 'Acceso a la Bóveda Principal',     category: 'Seguridad' },
  { id: 'acceso_cajas',       label: 'Acceso al Área de Cajas',          category: 'Accesos'   },
  { id: 'acceso_servidores',  label: 'Acceso al Cuarto de Servidores',   category: 'Accesos'   },
  { id: 'acceso_archivo',     label: 'Acceso al Archivo General',        category: 'Auditoría' },
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
  const [rolesData, setRolesData]       = useState({});  // { roleName: { id_rol, name, displayName, permissions: [] } }
  const [activeRoleId, setActiveRoleId] = useState('admin');
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/roles');
      const map = {};
      res.data.forEach(r => {
        const meta = ROLE_DISPLAY[r.name] || { displayName: r.name, description: r.description || '' };
        map[r.name] = {
          id:          r.name,
          id_rol:      r.id,
          name:        meta.displayName,
          description: meta.description,
          permissions: r.permissions || [],
        };
      });
      setRolesData(map);
      // Seleccionar el primer rol disponible si "admin" no existe
      if (!map['admin'] && Object.keys(map).length > 0) {
        setActiveRoleId(Object.keys(map)[0]);
      }
    } catch (err) {
      console.error('Error al cargar roles:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la lista de roles.', background: '#ffffff', color: '#1e293b' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const togglePermission = (roleId, permId) => {
    const role = rolesData[roleId];
    if (!role) return;
    let perms = [...role.permissions];

    if (permId === 'all') {
      perms = perms.includes('all') ? [] : ['all'];
    } else {
      perms = perms.filter(p => p !== 'all');
      perms = perms.includes(permId)
        ? perms.filter(p => p !== permId)
        : [...perms, permId];
    }

    setRolesData(prev => ({
      ...prev,
      [roleId]: { ...prev[roleId], permissions: perms },
    }));
  };

  const handleSave = async () => {
    const role = rolesData[activeRoleId];
    if (!role) return;

    setSaving(true);
    try {
      const res = await apiClient.put(`/roles/${role.id_rol}`, { permissions: role.permissions });
      const savedPerms = res.data.permissions || role.permissions;
      const permLabels = savedPerms.length
        ? savedPerms.map(p => PERMISSIONS.find(x => x.id === p)?.label || p).join(', ')
        : 'Ninguno';

      Swal.fire({
        icon: 'success',
        title: 'Políticas RBAC Guardadas',
        html: `<p style="font-size:13px;color:#475569;margin-bottom:8px">
                 Rol: <strong>${role.name}</strong>
               </p>
               <p style="font-size:12px;color:#64748b">
                 Permisos activos: <strong>${permLabels}</strong>
               </p>
               <p style="font-size:11px;color:#94a3b8;margin-top:8px">
                 Los cambios aplican en el próximo inicio de sesión del colaborador.
               </p>`,
        confirmButtonColor: '#0d2347',
        background: '#ffffff',
        color: '#1e293b',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Error al guardar',
        text: err.response?.data?.detail || 'No se pudo actualizar los permisos.',
        background: '#ffffff', color: '#1e293b',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#8DC63F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Cargando roles y permisos...</p>
        </div>
      </div>
    );
  }

  const activeRole = rolesData[activeRoleId];
  if (!activeRole) return null;

  const isSuperAdmin = activeRole.permissions.includes('all');

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Roles y Permisos</h2>
          <p className="text-sm text-slate-500 mt-1">Configure los privilegios de cada perfil institucional y la visibilidad de módulos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadRoles} className="btn-icon" title="Recargar roles">
            <MdRefresh size={18} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 rounded-xl text-sm font-bold text-white tracking-wider transition-all cursor-pointer shadow-lg shrink-0"
          >
            <MdSave size={18} className="text-[#84cc16]" />
            {saving ? 'GUARDANDO...' : 'COMPILAR POLÍTICAS RBAC'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-5 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/30 shadow-sm">
        <MdInfoOutline size={22} className="text-[#65a30d] shrink-0 mt-0.5" />
        <p className="text-sm text-slate-700 leading-relaxed font-medium">
          <strong className="text-slate-900 font-bold">Cambios persistentes.</strong> Las modificaciones de permisos se guardan en la base de datos y se aplican en el siguiente inicio de sesión de cada empleado. Tenga especial cuidado al otorgar{' '}
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
            <span className="font-mono bg-slate-100 px-2 py-1 rounded">DB: {Object.keys(rolesData).length} roles cargados</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RBAC;
