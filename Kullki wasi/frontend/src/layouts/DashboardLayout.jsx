import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../data/mockData';
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
  MdNotifications,
  MdWatchLater,
  MdLayers,
  MdSwapHoriz,
  MdClose,
  MdShield
} from 'react-icons/md';

const MENU_ITEMS = [
  { label: 'Dashboard',         path: '/dashboard',        icon: MdDashboard,     roles: [] },
  { label: 'Colaboradores',     path: '/employees',        icon: MdPeople,        roles: ['admin', 'talento_humano'] },
  { label: 'Roles y Permisos',  path: '/rbac',             icon: MdLayers,        roles: ['admin'] },
  { label: 'Control QR',        path: '/qr-scanner',       icon: MdQrCodeScanner, roles: ['admin', 'seguridad_fisica', 'jefe_agencia', 'tecnico_ti'] },
  { label: 'Áreas Críticas',    path: '/restricted-areas', icon: MdShield,        roles: ['admin', 'riesgos', 'seguridad_fisica'] },
  { label: 'Bitácora',          path: '/logs',             icon: MdHistory,       roles: ['admin', 'riesgos', 'auditor', 'tecnico_ti'] },
  { label: 'Auditoría',         path: '/audit',            icon: MdVerifiedUser,  roles: ['admin', 'auditor'] },
  { label: 'Monitoreo Red',     path: '/monitoring',       icon: MdCellTower,     roles: ['admin', 'tecnico_ti', 'seguridad_fisica'] },
  { label: 'Alertas',           path: '/security',         icon: MdWarning,       roles: ['admin', 'riesgos', 'seguridad_fisica'] },
  { label: 'Agencias',          path: '/agencies',         icon: MdStore,         roles: ['admin', 'jefe_agencia'] },
  { label: 'Configuración',     path: '/settings',         icon: MdSettings,      roles: ['admin'] },
];

const DashboardLayout = () => {
  const { user, logout, loginAsRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed]         = useState(false);
  const [mobileOpen, setMobileOpen]           = useState(false);
  const [currentTime, setCurrentTime]         = useState(new Date());
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Acceso denegado en Bóveda Principal', time: 'Hace 5 min',  type: 'error' },
    { id: 2, text: 'Lector QR Servidores en línea',       time: 'Hace 10 min', type: 'success' },
    { id: 3, text: 'Alerta de red en Agencia Salcedo',    time: 'Hace 1 hora', type: 'warning' },
  ]);

  // Reloj institucional en tiempo real
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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
    setShowNotifications(false);
    setShowRoleSwitcher(false);
  }, [location.pathname]);

  const filteredMenu = MENU_ITEMS.filter(item =>
    item.roles.length === 0 || item.roles.includes(user?.role)
  );

  const activeLabel = MENU_ITEMS.find(i => i.path === location.pathname)?.label ?? 'Detalle';
  const breadcrumb  = location.pathname === '/dashboard' ? 'Panel Principal' : activeLabel;

  const agencyLabel = user?.agency === 'MAT'
    ? 'Casa Matriz — Ambato'
    : `Sucursal ${user?.agency ?? ''}`;

  return (
    <div className="flex min-h-screen bg-[#070b13] bg-grid text-slate-200 overflow-hidden">

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <motion.aside
        animate={{ width: isCollapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden md:flex flex-col fixed top-0 bottom-0 left-0 bg-[#0d1424] border-r border-slate-800/70 z-20 overflow-hidden shrink-0"
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/60 bg-[#080c17] shrink-0">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 overflow-hidden"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8DC63F] to-[#6aa832] flex items-center justify-center font-black text-[#0d2347] text-sm shrink-0">
                KW
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-black tracking-widest text-[#8DC63F] uppercase block leading-none">KULLKI WASI</span>
                <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">Control de Accesos</span>
              </div>
            </motion.div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8DC63F] to-[#6aa832] flex items-center justify-center font-black text-[#0d2347] text-sm mx-auto">
              KW
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(v => !v)}
            className="p-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors ml-2 shrink-0"
          >
            <MdChevronLeft className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} size={16} />
          </button>
        </div>

        {/* User Avatar */}
        <div className="p-3.5 border-b border-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`rounded-full flex items-center justify-center font-bold text-[#0d2347] bg-gradient-to-br from-[#8DC63F] to-[#6aa832] border-2 border-[#8DC63F]/40 transition-all shrink-0 ${isCollapsed ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-lg'}`}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate leading-snug">{user?.name}</p>
                <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded border border-[#8DC63F]/30 bg-[#8DC63F]/10 text-[#8DC63F] font-bold uppercase tracking-wider">
                  {user?.roleName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          {filteredMenu.map(({ label, path, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                title={isCollapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                  active
                    ? 'bg-gradient-to-r from-[#0d2347] to-[#0f2a54] text-[#8DC63F] shadow-inner'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#8DC63F] rounded-r-full" />
                )}
                <Icon size={18} className={`shrink-0 ${active ? 'text-[#8DC63F]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2.5 border-t border-slate-800/60 shrink-0">
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Cerrar Sesión' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <MdPowerSettingsNew size={18} className="shrink-0" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT ─────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'}`}>

        {/* TOPBAR */}
        <header className="h-16 border-b border-slate-800/60 bg-[#0d1424]/90 backdrop-blur-md sticky top-0 z-10 px-4 md:px-6 flex items-center justify-between gap-4 shrink-0">

          {/* Left: mobile menu + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="p-2 rounded-xl bg-slate-800/40 text-slate-400 hover:text-slate-100 md:hidden transition-colors"
            >
              <MdMenu size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">Kullki Wasi Portal</p>
              <p className="text-sm font-semibold text-slate-200 font-['Outfit'] leading-snug">{breadcrumb}</p>
            </div>
          </div>

          {/* Right: clock, agency, notifications, avatar */}
          <div className="flex items-center gap-3">

            {/* Reloj digital */}
            <div className="hidden xl:flex items-center gap-2 bg-[#070b13]/70 px-3 py-1.5 rounded-lg border border-slate-800/80">
              <MdWatchLater className="text-[#8DC63F]" size={14} />
              <span className="text-[11px] font-mono font-bold text-slate-200">
                {currentTime.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              <span className="text-slate-700">│</span>
              <span className="text-[10px] text-slate-400">
                {currentTime.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Agencia activa */}
            <div className="hidden lg:block text-right leading-tight">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Agencia</p>
              <p className="text-[11px] font-bold text-[#8DC63F]">{agencyLabel}</p>
            </div>

            {/* Notificaciones */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(v => !v); setShowRoleSwitcher(false); }}
                className="relative p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-all"
              >
                <MdNotifications size={18} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-[#0d1424]" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 glass-panel border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Centro de Eventos</span>
                      <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                          <button onClick={() => setNotifications([])} className="text-[10px] text-slate-500 hover:text-red-400 font-semibold transition-colors">
                            Limpiar
                          </button>
                        )}
                        <button onClick={() => setShowNotifications(false)} className="text-slate-500 hover:text-slate-300">
                          <MdClose size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} className="px-4 py-3 border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                          <p className="text-xs text-slate-300 font-medium leading-snug">{n.text}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{n.time}</p>
                        </div>
                      )) : (
                        <div className="p-5 text-center text-xs text-slate-500">Sin alertas recientes</div>
                      )}
                    </div>
                    <Link to="/security" onClick={() => setShowNotifications(false)} className="block px-4 py-2.5 text-center text-[11px] font-bold text-[#8DC63F] hover:text-[#79ac34] border-t border-slate-800/60 transition-colors">
                      Ver todas las alertas →
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar / Perfil desktop */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[#0d2347] bg-[#8DC63F] border border-[#8DC63F]/30 hidden md:flex shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>

            {/* Avatar móvil */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[#0d2347] bg-[#8DC63F] border border-[#8DC63F]/30 md:hidden shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto w-full animate-fade-in-up">
            <Outlet />
          </div>
        </main>
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
              className="fixed top-0 bottom-0 left-0 w-64 bg-[#0d1424] border-r border-slate-800/70 z-40 md:hidden flex flex-col"
            >
              <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/60 bg-[#080c17] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8DC63F] to-[#6aa832] flex items-center justify-center font-black text-[#0d2347] text-sm">KW</div>
                  <div>
                    <span className="text-[11px] font-black text-[#8DC63F] tracking-widest uppercase block leading-none">KULLKI WASI</span>
                    <span className="text-[9px] text-slate-500 uppercase">Accesos</span>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg bg-slate-800/40 text-slate-400">
                  <MdClose size={16} />
                </button>
              </div>
              <div className="p-3.5 border-b border-slate-800/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[#0d2347] bg-[#8DC63F] border-2 border-[#8DC63F]/40 shrink-0">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
                    <span className="text-[9px] text-[#8DC63F] font-bold uppercase">{user?.roleName}</span>
                  </div>
                </div>
              </div>
              <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
                {filteredMenu.map(({ label, path, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 transition-all"
                  >
                    <Icon size={18} className="text-slate-500 shrink-0" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>
              <div className="p-2.5 border-t border-slate-800/60 shrink-0">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400/80 hover:bg-red-500/10 hover:text-red-300 transition-all">
                  <MdPowerSettingsNew size={18} className="shrink-0" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── ROLE SWITCHER FLOTANTE ───────────────────── */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => { setShowRoleSwitcher(v => !v); setShowNotifications(false); }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0d1424] border border-[#8DC63F]/50 text-slate-200 shadow-2xl hover:bg-[#0d2347] hover:border-[#8DC63F] transition-all glow-green"
        >
          <MdSwapHoriz size={18} className="text-[#8DC63F]" />
          <span className="text-xs font-bold uppercase tracking-wider font-['Outfit']">Cambiar Rol</span>
        </button>

        <AnimatePresence>
          {showRoleSwitcher && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 bottom-12 w-64 glass-panel border border-slate-800/80 rounded-2xl p-3 shadow-2xl"
            >
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1 pb-2 border-b border-slate-800/60 mb-2">
                Simulador — 8 Perfiles
              </p>
              <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
                {Object.values(ROLES).map(role => (
                  <button
                    key={role.id}
                    onClick={() => handleQuickSwitch(role.id)}
                    className={`w-full text-left text-xs px-2.5 py-2 rounded-lg transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      user?.role === role.id
                        ? 'bg-[#0d2347] text-[#8DC63F] border border-[#8DC63F]/30 font-bold'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{role.name}</span>
                    {user?.role === role.id && <span className="w-1.5 h-1.5 rounded-full bg-[#8DC63F] shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default DashboardLayout;
