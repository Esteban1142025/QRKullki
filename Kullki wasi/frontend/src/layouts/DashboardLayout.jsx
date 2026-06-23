import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdDashboard,
  MdPeople,
  MdSecurity,
  MdQrCodeScanner,
  MdHistory,
  MdVerifiedUser,
  MdCellTower,
  MdWarning,
  MdSettings,
  MdStore,
  MdPowerSettingsNew,
  MdMenu,
  MdChevronLeft,
  MdWatchLater,
  MdLayers,
  MdSwapHoriz,
  MdClose,
  MdShield,
  MdPerson,
  MdEventNote,
} from 'react-icons/md';

// roles: acceso por rol (hardcoded). permission: código de permiso en BD que TAMBIÉN otorga acceso.
// Un módulo es visible si user.role está en roles[], O si user.permissions incluye el campo permission.
const MENU_ITEMS = [
  { label: 'Dashboard',         path: '/dashboard',        icon: MdDashboard,     roles: [],                                                           permission: null              },
  { label: 'Colaboradores',     path: '/employees',        icon: MdPeople,        roles: ['admin', 'talento_humano'],                                  permission: 'gestionar_usuarios' },
  { label: 'Roles y Permisos',  path: '/rbac',             icon: MdLayers,        roles: ['admin'],                                                    permission: 'all'             },
  { label: 'Control QR',        path: '/qr-scanner',       icon: MdQrCodeScanner, roles: ['admin', 'seguridad_fisica', 'jefe_agencia', 'tecnico_ti'],  permission: 'modulo_control_qr'      },
  { label: 'Áreas Críticas',    path: '/restricted-areas', icon: MdShield,        roles: ['admin', 'riesgos', 'seguridad_fisica'],                     permission: 'modulo_areas_criticas'  },
  { label: 'Bitácora',          path: '/logs',             icon: MdHistory,       roles: ['admin', 'riesgos', 'auditor', 'tecnico_ti', 'seguridad_fisica'], permission: 'ver_reportes'      },
  { label: 'Auditoría',         path: '/audit',            icon: MdVerifiedUser,  roles: ['admin', 'auditor', 'jefe_agencia'],                         permission: 'modulo_auditoria'       },
  { label: 'Alertas',           path: '/security',         icon: MdWarning,       roles: ['admin', 'riesgos', 'seguridad_fisica', 'auditor'],          permission: 'modulo_areas_criticas'  },
  { label: 'Eventos',           path: '/events',           icon: MdEventNote,     roles: ['admin'],                                                    permission: 'all'             },
  { label: 'Agencias',          path: '/agencies',         icon: MdStore,         roles: ['admin', 'jefe_agencia'],                                    permission: null              },
  { label: 'Mi Perfil',         path: '/profile',          icon: MdPerson,        roles: [],                                                           permission: null              },
  { label: 'Configuración',     path: '/settings',         icon: MdSettings,      roles: ['admin', 'talento_humano'],                                  permission: 'all'             },
];

const DashboardLayout = () => {
  const { user, logout, loginAsRole, switchAgency } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed]             = useState(false);
  const [mobileOpen, setMobileOpen]               = useState(false);
  const [currentTime, setCurrentTime]             = useState(new Date());
  const [showRoleSwitcher, setShowRoleSwitcher]   = useState(false);
  const [showAgencySwitcher, setShowAgencySwitcher] = useState(false);
  const [activeAgencies, setActiveAgencies]       = useState([]);

  // Reloj institucional en tiempo real
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Cargar agencias al montar y cada vez que se abre el switcher (para reflejar cambios en tiempo real)
  const fetchAgencies = () => {
    apiClient.get('/agencias')
      .then(res => setActiveAgencies(res.data))
      .catch(() => {});
  };
  useEffect(() => { fetchAgencies(); }, []);
  useEffect(() => { if (showAgencySwitcher) fetchAgencies(); }, [showAgencySwitcher]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickSwitch = async (roleId) => {
    try {
      await loginAsRole(roleId);
      setShowRoleSwitcher(false);
      navigate('/dashboard');
    } catch (e) {
      console.error('Error switching role:', e);
    }
  };

  // Cerrar dropdowns al navegar
  useEffect(() => {
    setMobileOpen(false);
    setShowRoleSwitcher(false);
    setShowAgencySwitcher(false);
  }, [location.pathname]);

  const userPerms = user?.permissions || [];
  const isSuperUser = userPerms.includes('all');

  const filteredMenu = MENU_ITEMS.filter(item => {
    // Dashboard y módulos sin restricción: siempre visibles
    if (item.roles.length === 0 && !item.permission) return true;
    // SuperAdmin ve todo
    if (isSuperUser) return true;
    // Acceso por rol (hardcoded)
    if (item.roles.length > 0 && item.roles.includes(user?.role)) return true;
    // Acceso por permiso de BD (asignado dinámicamente desde RBAC)
    if (item.permission && userPerms.includes(item.permission)) return true;
    return false;
  });

  const activeLabel = MENU_ITEMS.find(i => i.path === location.pathname)?.label ?? 'Detalle';
  const breadcrumb  = location.pathname === '/dashboard' ? 'Panel Principal' : activeLabel;

  const currentAgency = activeAgencies.find(a => a.id === user?.agency);
  const agencyLabel = user?.agencyDisplayName
    || currentAgency?.name
    || user?.agencyName
    || (user?.agency === 'MAT' ? 'Casa Matriz — Ambato' : `Sucursal ${user?.agency ?? ''}`);

  const ROLES_CON_CAMBIO_AGENCIA = ['admin', 'talento_humano', 'riesgos', 'seguridad_fisica', 'auditor', 'tecnico_ti'];
  const canSwitchAgency = ROLES_CON_CAMBIO_AGENCIA.includes(user?.role);

  return (
    <div 
      className="flex min-h-screen text-slate-800 overflow-hidden relative bg-[#0b1121]"
    >
      {/* Overlay oscuro/translúcido para la imagen de fondo */}
      <div className="absolute inset-0 bg-[#0b1121]" />

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <motion.aside
        animate={{ width: isCollapsed ? 76 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col fixed top-0 bottom-0 left-0 sidebar-dark z-20 overflow-hidden shrink-0"
      >
        {/* Logo / Brand */}
        <div className="flex h-[72px] items-center justify-between px-5 border-b border-white/10 shrink-0">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 overflow-hidden"
            >
              <img src="https://play-lh.googleusercontent.com/G-uc06_SBqaE8a-M7JKQCD-Hpfkvxb1g9X3VPmyngldtTRS-pr69QPW_4zDBe9_6qEw" alt="Logo" className="w-9 h-9 rounded-xl shadow-sm object-cover shrink-0 border border-white/20" />
              <div className="min-w-0 flex flex-col justify-center">
                <span className="text-[15px] font-black tracking-widest text-white uppercase block leading-none drop-shadow-md">KULLKI WASI</span>
                <span className="text-[10px] text-[#84cc16] font-bold tracking-widest uppercase mt-0.5">Control Corporativo</span>
              </div>
            </motion.div>
          )}
          {isCollapsed && (
            <img src="https://play-lh.googleusercontent.com/G-uc06_SBqaE8a-M7JKQCD-Hpfkvxb1g9X3VPmyngldtTRS-pr69QPW_4zDBe9_6qEw" alt="Logo" className="w-9 h-9 rounded-xl shadow-sm object-cover mx-auto border border-white/20" />
          )}
          <button
            onClick={() => setIsCollapsed(v => !v)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors ml-2 shrink-0"
          >
            <MdChevronLeft className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} size={18} />
          </button>
        </div>

        {/* User Avatar — sidebar desktop */}
        <div className="p-3.5 border-b border-white/10 shrink-0">
          <Link to="/profile" className="flex items-center gap-3 group" title="Editar perfil">
            <div className={`rounded-full flex items-center justify-center font-bold text-slate-900 bg-gradient-to-br from-[#84cc16] to-[#facc15] border border-white/20 transition-all shrink-0 shadow-[0_0_15px_rgba(132,204,34,0.3)] group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(132,204,34,0.5)] ${isCollapsed ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-xl'}`}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate leading-snug group-hover:text-[#84cc16] transition-colors">{user?.name}</p>
                <span className="inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded border border-[#84cc16]/40 bg-[#84cc16]/10 text-[#84cc16] font-bold uppercase tracking-wider">
                  {user?.roleName}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredMenu.map(({ label, path, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                title={isCollapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-bold transition-all group relative ${
                  active
                    ? 'nav-item-active text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon size={20} className={`shrink-0 transition-colors ${active ? 'text-[#84cc16]' : 'text-slate-500 group-hover:text-[#84cc16]'}`} />
                {!isCollapsed && <span className="truncate tracking-wide">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10 shrink-0">
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Cerrar Sesión' : undefined}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <MdPowerSettingsNew size={20} className="shrink-0" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT SHELL ─────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 z-10 ${isCollapsed ? 'md:ml-[76px]' : 'md:ml-[280px]'} p-0 md:py-3 md:pr-3`}>
        <div className="flex-1 flex flex-col bg-[#f8fafc] md:rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-hidden relative border border-white/10 md:border-slate-200">
          
          {/* TOPBAR */}
          <header className="h-[76px] border-b border-slate-200/50 bg-white/60 backdrop-blur-2xl sticky top-0 z-10 px-5 md:px-8 flex items-center justify-between gap-4 shrink-0">

          {/* Left: mobile menu + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="p-2 rounded-xl bg-slate-200 text-slate-600 hover:text-slate-900 md:hidden transition-colors"
            >
              <MdMenu size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Kullki Wasi Portal</p>
              <p className="text-lg font-black text-slate-800 font-['Outfit'] leading-snug">{breadcrumb}</p>
            </div>
          </div>

          {/* Right: clock, agency, notifications, avatar */}
          <div className="flex items-center gap-3">

            {/* Reloj digital */}
            <div className="hidden xl:flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <MdWatchLater className="text-[#84cc16]" size={16} />
              <span className="text-[13px] font-mono font-bold text-slate-700">
                {currentTime.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              <span className="text-slate-300">│</span>
              <span className="text-[12px] text-slate-500 font-semibold">
                {currentTime.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Agencia activa — switcher (solo roles con acceso multisucursal) */}
            <div className="relative hidden lg:block">
              {canSwitchAgency ? (
              <button
                onClick={() => { setShowAgencySwitcher(v => !v); setShowRoleSwitcher(false); }}
                className="text-right leading-tight px-3 py-2 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all group cursor-pointer"
                title="Cambiar agencia"
              >
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-end gap-1">
                  Agencia
                  <MdSwapHoriz size={13} className="text-slate-400 group-hover:text-[#84cc16] transition-colors" />
                </p>
                <p className="text-[13px] font-black text-[#84cc16] group-hover:text-[#65a30d] transition-colors">{agencyLabel}</p>
              </button>
              ) : (
              <div className="text-right leading-tight px-3 py-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Agencia</p>
                <p className="text-[13px] font-black text-[#84cc16]">{agencyLabel}</p>
              </div>
              )}

              <AnimatePresence>
                {canSwitchAgency && showAgencySwitcher && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MdSwapHoriz size={14} className="text-[#84cc16]" /> Cambiar Agencia
                      </span>
                      <button onClick={() => setShowAgencySwitcher(false)} className="text-slate-400 hover:text-slate-600">
                        <MdClose size={14} />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1.5">
                      {activeAgencies.length > 0 ? activeAgencies.map(ag => {
                        const isCurrent = ag.id === user?.agency;
                        const isInactive = ag.status !== 'Activo';
                        return (
                          <button
                            key={ag.id}
                            onClick={() => { switchAgency(ag.id, ag.name); setShowAgencySwitcher(false); }}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 ${isCurrent ? 'bg-[#84cc16]/5' : ''} ${isInactive ? 'opacity-60' : ''}`}
                          >
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isCurrent ? 'text-[#65a30d]' : isInactive ? 'text-slate-400' : 'text-slate-700'}`}>{ag.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{ag.id} · {ag.type}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isInactive && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                                  INACTIVA
                                </span>
                              )}
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#84cc16]/15 text-[#65a30d] border border-[#84cc16]/30">
                                  ACTUAL
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="px-4 py-6 text-center text-xs text-slate-400 font-medium">
                          No hay agencias disponibles.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar / Perfil desktop */}
            <Link to="/profile" title="Editar perfil"
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 bg-gradient-to-br from-[#8DC63F] to-[#facc15] shadow-sm hidden md:flex shrink-0 hover:scale-110 hover:shadow-md transition-all cursor-pointer">
              {user?.name?.charAt(0) || 'U'}
            </Link>

            {/* Avatar móvil */}
            <Link to="/profile" title="Editar perfil"
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 bg-gradient-to-br from-[#8DC63F] to-[#facc15] shadow-sm md:hidden shrink-0 hover:scale-110 transition-all cursor-pointer">
              {user?.name?.charAt(0) || 'U'}
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-5 md:p-8 overflow-y-auto bg-grid">
          <div className="max-w-[1600px] mx-auto w-full animate-fade-in-up">
            <Outlet />
          </div>
        </main>

        </div>
      </div>

      {/* ── MOBILE SIDEBAR ───────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            />
              <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 bottom-0 left-0 w-64 bg-slate-100 border-r border-slate-300 z-40 md:hidden flex flex-col shadow-2xl"
            >
              <div className="flex h-16 items-center justify-between px-4 border-b border-slate-300/60 bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <img src="https://play-lh.googleusercontent.com/G-uc06_SBqaE8a-M7JKQCD-Hpfkvxb1g9X3VPmyngldtTRS-pr69QPW_4zDBe9_6qEw" alt="Logo" className="w-8 h-8 rounded-lg shadow-md object-cover border border-slate-200" />
                  <div>
                    <span className="text-[11px] font-black text-[#79ac34] tracking-widest uppercase block leading-none">KULLKI WASI</span>
                    <span className="text-[9px] text-slate-500 uppercase font-bold">Accesos</span>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg bg-slate-200 text-slate-500 hover:text-slate-800">
                  <MdClose size={16} />
                </button>
              </div>
              <div className="p-3.5 border-b border-slate-300/60 shrink-0 bg-slate-50/50">
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 group" title="Editar perfil">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-slate-900 bg-gradient-to-br from-[#8DC63F] to-[#facc15] shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#65a30d] transition-colors">{user?.name}</p>
                    <span className="text-[9px] text-[#79ac34] font-black uppercase">{user?.roleName}</span>
                  </div>
                </Link>
              </div>
              <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
                {filteredMenu.map(({ label, path, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 transition-all"
                  >
                    <Icon size={18} className="text-slate-400 shrink-0" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>
              <div className="p-2.5 border-t border-slate-300/60 shrink-0 bg-slate-50/50">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-700 transition-all">
                  <MdPowerSettingsNew size={18} className="shrink-0" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>



    </div>
  );
};

export default DashboardLayout;
