import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/apiClient';
import Swal from 'sweetalert2';
import {
  MdSecurity, MdCheckCircle, MdCancel, MdSave, MdInfoOutline,
  MdLockOpen, MdShield, MdRefresh, MdApps, MdDoorFront,
  MdAdd, MdDelete, MdClose
} from 'react-icons/md';
import { logPermissionChanges } from '../utils/eventLogger';

// Metadatos visuales de cada rol
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

// Permisos de módulos del sistema (estáticos)
const MODULE_PERMISSIONS = [
  {
    id: 'all',
    label: 'Super Administrador',
    desc: 'Acceso completo a todos los módulos, configuración y ajustes del sistema.',
    category: 'Sistema',
    categoryStyle: 'text-red-700 bg-red-100 border-red-200',
  },
  {
    id: 'gestionar_usuarios',
    label: 'Módulo: Colaboradores',
    desc: 'Permite ver, crear y editar expedientes de empleados de la cooperativa.',
    category: 'Gestión',
    categoryStyle: 'text-blue-700 bg-blue-100 border-blue-200',
  },
  {
    id: 'ver_reportes',
    label: 'Módulo: Bitácora',
    desc: 'Acceso al historial completo de registros de entrada y salida del personal.',
    category: 'Reportes',
    categoryStyle: 'text-violet-700 bg-violet-100 border-violet-200',
  },
  {
    id: 'modulo_areas_criticas',
    label: 'Módulo: Áreas Críticas y Alertas',
    desc: 'Monitoreo de zonas de alto riesgo, gestión de incidentes y alertas de seguridad.',
    category: 'Seguridad',
    categoryStyle: 'text-orange-700 bg-orange-100 border-orange-200',
  },
  {
    id: 'modulo_auditoria',
    label: 'Módulo: Auditoría',
    desc: 'Trazabilidad completa de eventos institucionales y herramientas de auditoría interna.',
    category: 'Auditoría',
    categoryStyle: 'text-purple-700 bg-purple-100 border-purple-200',
  },
  {
    id: 'modulo_control_qr',
    label: 'Módulo: Control QR',
    desc: 'Operación del escáner de acceso QR para validar entradas y salidas en garita.',
    category: 'Accesos',
    categoryStyle: 'text-[#65a30d] bg-[#84cc16]/15 border-[#84cc16]/30',
  },
];

// Colores por agencia
const AGENCY_STYLES = {
  MAT: 'text-blue-700 bg-blue-100 border-blue-200',
  PEL: 'text-emerald-700 bg-emerald-100 border-emerald-200',
  PIL: 'text-violet-700 bg-violet-100 border-violet-200',
  SAL: 'text-orange-700 bg-orange-100 border-orange-200',
  BAN: 'text-red-700 bg-red-100 border-red-200',
};

const RISK_LABELS = {
  Crítico: { style: 'text-red-700 bg-red-100 border-red-200',    dot: 'bg-red-500' },
  Alto:    { style: 'text-orange-700 bg-orange-100 border-orange-200', dot: 'bg-orange-500' },
  Medio:   { style: 'text-amber-700 bg-amber-100 border-amber-200',   dot: 'bg-amber-400' },
  Bajo:    { style: 'text-emerald-700 bg-emerald-100 border-emerald-200', dot: 'bg-emerald-500' },
};

const SYSTEM_ROLES = new Set(['admin','talento_humano','riesgos','seguridad_fisica','auditor','jefe_agencia','tecnico_ti','empleado']);

const RBAC = () => {
  const { user } = useAuth();
  const [rolesData, setRolesData]       = useState({});
  const [areas, setAreas]               = useState([]);
  const [activeRoleId, setActiveRoleId] = useState('admin');
  const [activeTab, setActiveTab]       = useState('modulos');
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);

  // Estado para modal de nuevo rol
  const [showNewRole, setShowNewRole]   = useState(false);
  const [newRoleForm, setNewRoleForm]   = useState({ nombre: '', descripcion: '' });
  const [creatingRole, setCreatingRole] = useState(false);

  const originalPermsRef = useRef({});

  // Filtrar áreas por la agencia del usuario activo
  const agencyAreas = useMemo(
    () => areas.filter(a => a.agency === user?.agency && a.permiso_codigo),
    [areas, user?.agency]
  );

  // Construir la lista dinámica de permisos de área desde las áreas cargadas
  const dynamicAreaPermissions = useMemo(() => {
    const items = agencyAreas
      .map(a => ({
        id:            a.permiso_codigo,
        label:         a.name,
        desc:          `Nivel de riesgo: ${a.riskLevel || 'Medio'} · Horario: ${a.schedule || '08:00 - 18:00'}`,
        category:      a.agency || 'Cooperativa',
        categoryStyle: AGENCY_STYLES[a.agency] || 'text-slate-700 bg-slate-100 border-slate-200',
        riskLevel:     a.riskLevel,
        agencia:       a.agency,
      }));

    return [
      {
        id: '__all_areas__',
        isSelectAll: true,
        label: 'Acceso a Todas las Áreas',
        desc: 'Ingreso irrestricto a cualquier área física de la cooperativa. Activa o desactiva todos los accesos de esta sección a la vez.',
        category: 'Máximo Nivel',
        categoryStyle: 'text-orange-700 bg-orange-100 border-orange-200',
      },
      ...items,
    ];
  }, [agencyAreas]);

  // IDs reales de permisos de área para la agencia activa (excluye __all_areas__)
  const dynamicRealAreaIds = useMemo(
    () => agencyAreas.map(a => a.permiso_codigo),
    [agencyAreas]
  );

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, areasRes] = await Promise.all([
        apiClient.get('/roles'),
        apiClient.get('/areas'),
      ]);

      setAreas(areasRes.data);

      const map = {};
      const snapshot = {};
      rolesRes.data.forEach(r => {
        const meta = ROLE_DISPLAY[r.name] || { displayName: r.name, description: r.description || '' };
        map[r.name] = {
          id:          r.name,
          id_rol:      r.id,
          name:        meta.displayName,
          description: meta.description,
          permissions: r.permissions || [],
        };
        snapshot[r.name] = [...(r.permissions || [])];
      });
      originalPermsRef.current = snapshot;
      setRolesData(map);
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
    } else if (permId === '__all_areas__') {
      // Toggle acceso_total + all specific area codes
      const allActive = perms.includes('acceso_total') || dynamicRealAreaIds.every(id => perms.includes(id));
      if (allActive) {
        perms = perms.filter(id => id !== 'acceso_total' && !dynamicRealAreaIds.includes(id));
      } else {
        const toAdd = dynamicRealAreaIds.filter(id => !perms.includes(id));
        perms = [...perms.filter(id => id !== 'acceso_total'), 'acceso_total', ...toAdd];
      }
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

  const handleCreateRole = async (e) => {
    e.preventDefault();
    const nombre = newRoleForm.nombre.trim().toLowerCase().replace(/\s+/g, '_');
    if (!nombre) return;
    setCreatingRole(true);
    try {
      const res = await apiClient.post('/roles', { nombre, descripcion: newRoleForm.descripcion.trim() });
      await loadRoles();
      setActiveRoleId(res.data.name);
      setShowNewRole(false);
      setNewRoleForm({ nombre: '', descripcion: '' });
      Swal.fire({
        icon: 'success', title: 'Rol Creado',
        html: `<p style="font-size:13px;color:#475569">El rol <strong>${res.data.name}</strong> fue creado. Ahora puedes asignarle permisos y utilizarlo en los expedientes de colaboradores.</p>`,
        confirmButtonColor: '#84cc16', background: '#ffffff', color: '#1e293b',
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'No se pudo crear el rol.', background: '#ffffff', color: '#1e293b' });
    } finally {
      setCreatingRole(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    const role = rolesData[roleId];
    if (!role) return;
    const confirm = await Swal.fire({
      icon: 'warning',
      title: `¿Eliminar rol "${role.name}"?`,
      html: `<p style="font-size:13px;color:#475569">Esta acción es irreversible. Solo se puede eliminar si ningún colaborador tiene este rol asignado.</p>`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444', cancelButtonColor: '#334155',
      background: '#ffffff', color: '#1e293b',
    });
    if (!confirm.isConfirmed) return;
    try {
      await apiClient.delete(`/roles/${role.id_rol}`);
      setActiveRoleId('admin');
      await loadRoles();
      Swal.fire({ icon: 'success', title: 'Rol eliminado', timer: 1500, showConfirmButton: false, background: '#ffffff', color: '#1e293b' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: err.response?.data?.detail || 'Error al eliminar el rol.', background: '#ffffff', color: '#1e293b' });
    }
  };

  const handleSave = async () => {
    const role = rolesData[activeRoleId];
    if (!role) return;

    const prevPerms = [...(originalPermsRef.current[activeRoleId] || [])];

    setSaving(true);
    try {
      const res = await apiClient.put(`/roles/${role.id_rol}`, { permissions: role.permissions });
      const savedPerms = res.data.permissions || role.permissions;

      // Construir mapa de labels para permisos dinámicos de área
      const areaLabelMap = {};
      agencyAreas.forEach(a => { if (a.permiso_codigo) areaLabelMap[a.permiso_codigo] = a.name; });
      logPermissionChanges(user, activeRoleId, activeRole.name, prevPerms, savedPerms, areaLabelMap);
      originalPermsRef.current = { ...originalPermsRef.current, [activeRoleId]: [...savedPerms] };

      const moduleLabels = savedPerms
        .map(p => MODULE_PERMISSIONS.find(x => x.id === p)?.label)
        .filter(Boolean);
      const areaLabels = savedPerms
        .map(p => dynamicAreaPermissions.find(x => x.id === p)?.label)
        .filter(Boolean);

      const moduleHtml = moduleLabels.length
        ? `<li style="margin-bottom:2px"><strong>Módulos:</strong> ${moduleLabels.join(', ')}</li>`
        : '';
      const areaHtml = areaLabels.length
        ? `<li><strong>Áreas físicas:</strong> ${areaLabels.join(', ')}</li>`
        : '';

      Swal.fire({
        icon: 'success',
        title: 'Políticas RBAC Guardadas',
        html: `<p style="font-size:13px;color:#475569;margin-bottom:8px">
                 Rol: <strong>${role.name}</strong>
               </p>
               ${(moduleHtml || areaHtml)
                 ? `<ul style="font-size:12px;color:#64748b;text-align:left;padding-left:16px;line-height:1.7">
                      ${moduleHtml}${areaHtml}
                    </ul>`
                 : `<p style="font-size:12px;color:#94a3b8">Sin permisos asignados</p>`}
               <p style="font-size:11px;color:#94a3b8;margin-top:10px">
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

  const isSuperAdmin  = activeRole.permissions.includes('all');
  const hasAllAreas   = activeRole.permissions.includes('acceso_total');
  const activePerms   = activeRole.permissions;

  const moduleCount = isSuperAdmin
    ? MODULE_PERMISSIONS.length
    : MODULE_PERMISSIONS.filter(p => activePerms.includes(p.id)).length;

  const areaCount = isSuperAdmin || hasAllAreas
    ? dynamicRealAreaIds.length
    : dynamicRealAreaIds.filter(id => activePerms.includes(id)).length;

  const currentList = activeTab === 'modulos' ? MODULE_PERMISSIONS : dynamicAreaPermissions;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Roles y Permisos</h2>
          <p className="text-sm text-slate-500 mt-1">Configure los privilegios de cada perfil institucional.</p>
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
            {saving ? 'GUARDANDO...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Crear nuevo rol */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#84cc16]/15 border border-[#84cc16]/30 flex items-center justify-center shrink-0">
            <MdAdd size={20} className="text-[#65a30d]" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Roles personalizados</p>
            <p className="text-xs text-slate-500">Crea roles adicionales y asígnalos a colaboradores desde el módulo de Colaboradores.</p>
          </div>
        </div>
        <button
          onClick={() => setShowNewRole(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#84cc16] hover:bg-[#79ac34] rounded-xl text-sm font-bold text-white tracking-wider transition-all cursor-pointer shadow shrink-0"
        >
          <MdAdd size={16} /> Crear Rol
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── SELECTOR DE ROL ──────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Perfiles Institucionales</p>
          <div className="space-y-2">
            {Object.values(rolesData).map(role => {
              const active        = activeRoleId === role.id;
              const roleSuperAdmin = role.permissions.includes('all');
              const roleAllAreas  = role.permissions.includes('acceso_total');
              const modCount  = roleSuperAdmin ? MODULE_PERMISSIONS.length : MODULE_PERMISSIONS.filter(p => role.permissions.includes(p.id)).length;
              const aCount    = roleSuperAdmin || roleAllAreas
                ? dynamicRealAreaIds.length
                : dynamicRealAreaIds.filter(id => role.permissions.includes(id)).length;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRoleId(role.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-white border-l-4 border-l-[#84cc16] border-y-slate-200 border-r-slate-200 shadow-md translate-x-1'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-black text-sm font-['Outfit'] ${active ? 'text-[#65a30d]' : 'text-slate-700'}`}>
                      {role.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        active ? 'bg-[#84cc16]/20 text-[#65a30d]' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {role.id}
                      </span>
                      {!SYSTEM_ROLES.has(role.id) && (
                        <button
                          onClick={ev => { ev.stopPropagation(); handleDeleteRole(role.id); }}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar rol"
                        >
                          <MdDelete size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">{role.description}</p>
                  {roleSuperAdmin ? (
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <MdShield size={13} className="text-[#84cc16]" />
                      <span className="text-[11px] font-bold text-[#65a30d]">Todos los privilegios</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex items-center gap-1">
                        <MdApps size={12} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">{modCount} módulo{modCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MdDoorFront size={12} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">{aCount} área{aCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── PANEL DE PERMISOS ─────────────────────────────────────────────── */}
        <div className="lg:col-span-8 rounded-2xl bg-white shadow-lg border border-slate-200 overflow-hidden">

          {/* Cabecera del panel */}
          <div className="px-6 pt-6 pb-0">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 font-['Outfit']">
                  {activeRole.name}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5 font-medium">Haga clic en un permiso para activar o revocar.</p>
              </div>
              <div className="flex items-center gap-2 text-xs px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 font-mono text-slate-600 shrink-0 font-bold">
                <MdShield size={15} className="text-[#84cc16]" />
                {isSuperAdmin ? 'SUPER ADMIN' : `${moduleCount}M · ${areaCount}A`}
              </div>
            </div>

            {/* Tabs: Módulos / Áreas */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-0">
              <button
                onClick={() => setActiveTab('modulos')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'modulos'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <MdApps size={16} className={activeTab === 'modulos' ? 'text-[#84cc16]' : ''} />
                Módulos del Sistema
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  activeTab === 'modulos' ? 'bg-[#84cc16]/20 text-[#65a30d]' : 'bg-slate-200 text-slate-500'
                }`}>{moduleCount}</span>
              </button>
              <button
                onClick={() => setActiveTab('areas')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'areas'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <MdDoorFront size={16} className={activeTab === 'areas' ? 'text-[#84cc16]' : ''} />
                Áreas de la Agencia
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  activeTab === 'areas' ? 'bg-[#84cc16]/20 text-[#65a30d]' : 'bg-slate-200 text-slate-500'
                }`}>{areaCount}</span>
              </button>
            </div>
          </div>

          {/* Lista de permisos */}
          <div className="p-5 space-y-2.5 max-h-[520px] overflow-y-auto">
            <p className="text-[11px] text-slate-400 font-medium pb-1">
              {activeTab === 'modulos'
                ? 'Estos permisos determinan qué módulos del panel lateral puede ver y acceder este rol.'
                : 'Estos permisos controlan a qué áreas físicas puede ingresar el colaborador al pasar su QR.'}
            </p>

            {currentList.map(({ id, label, desc, category, categoryStyle, isSelectAll, riskLevel, agencia }) => {
              const allAreasActive = hasAllAreas || dynamicRealAreaIds.every(rid => activePerms.includes(rid));
              const hasPerm = isSuperAdmin
                || (isSelectAll
                  ? allAreasActive
                  : (hasAllAreas || activePerms.includes(id)));
              const risk = RISK_LABELS[riskLevel];
              return (
                <div
                  key={`${activeTab}-${id}`}
                  onClick={() => togglePermission(activeRoleId, id)}
                  className={`flex items-start justify-between p-4 rounded-xl border-2 cursor-pointer transition-all select-none gap-3 ${
                    hasPerm
                      ? 'bg-[#84cc16]/5 border-[#84cc16]/40 hover:border-[#84cc16]'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      hasPerm ? 'bg-[#84cc16]/20 text-[#65a30d]' : 'bg-slate-200 text-slate-400'
                    }`}>
                      {activeTab === 'modulos' ? <MdApps size={18} /> : <MdDoorFront size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-bold leading-snug ${hasPerm ? 'text-slate-800' : 'text-slate-600'}`}>
                          {label}
                        </p>
                        {agencia && (
                          <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded border ${AGENCY_STYLES[agencia] || 'text-slate-600 bg-slate-100 border-slate-200'}`}>
                            {agencia}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-medium">{desc}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${categoryStyle}`}>
                          {category}
                        </span>
                        {risk && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${risk.style}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                            {riskLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 shrink-0 mt-1 ${hasPerm ? 'text-[#84cc16]' : 'text-slate-300'}`}>
                    {hasPerm
                      ? <MdCheckCircle size={22} />
                      : <MdCancel size={22} />}
                  </div>
                </div>
              );
            })}

            {activeTab === 'areas' && dynamicAreaPermissions.length <= 1 && (
              <p className="text-center text-slate-400 text-sm py-6">
                No hay áreas críticas registradas. Crea áreas en el módulo Áreas Críticas.
              </p>
            )}
          </div>

          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium bg-slate-50/50">
            <span>Cooperativa Kullki Wasi Ltda.</span>
            <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200">
              DB: {Object.keys(rolesData).length} roles · {agencyAreas.length} áreas ({user?.agency})
            </span>
          </div>
        </div>

      </div>

      {/* ── MODAL: CREAR ROL ──────────────────────────── */}
      {showNewRole && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <MdAdd size={20} className="text-[#84cc16]" />
                <span className="font-black text-slate-800 text-sm uppercase tracking-wider">Crear Nuevo Rol</span>
              </div>
              <button onClick={() => { setShowNewRole(false); setNewRoleForm({ nombre: '', descripcion: '' }); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <MdClose size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="form-label">Nombre del Rol <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={newRoleForm.nombre}
                  onChange={e => setNewRoleForm(f => ({ ...f, nombre: e.target.value }))}
                  className="form-input w-full"
                  placeholder="ej: supervisor_ventas"
                  required
                  autoFocus
                />
                <p className="text-[10px] text-slate-400">Se convertirá a minúsculas con guiones bajos. Ej: "Supervisor Ventas" → <code className="bg-slate-100 px-1 rounded">supervisor_ventas</code></p>
              </div>

              <div className="space-y-1.5">
                <label className="form-label">Descripción</label>
                <input
                  type="text"
                  value={newRoleForm.descripcion}
                  onChange={e => setNewRoleForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="form-input w-full"
                  placeholder="ej: Supervisión de operaciones de ventas"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium">
                Después de crear el rol, podrás asignarle permisos de módulos y áreas desde esta misma pantalla, y asignarlo a colaboradores desde el módulo de Colaboradores.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowNewRole(false); setNewRoleForm({ nombre: '', descripcion: '' }); }} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={creatingRole || !newRoleForm.nombre.trim()} className="btn-primary disabled:opacity-50">
                  <MdAdd size={16} /> {creatingRole ? 'Creando…' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RBAC;
