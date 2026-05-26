import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../data/mockData';
import Swal from 'sweetalert2';
import { MdLockOutline, MdBadge, MdArrowForward, MdPlayArrow, MdShield } from 'react-icons/md';

const Login = () => {
  const { login, loginAsRole } = useAuth();
  const navigate = useNavigate();
  const [dniOrEmail, setDniOrEmail] = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [loadingRole, setLoadingRole] = useState(null);

  const fireSwalDark = (opts) =>
    Swal.fire({ background: '#0d1424', color: '#f1f5f9', ...opts });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dniOrEmail || !password) {
      fireSwalDark({ icon: 'warning', title: 'Campos incompletos', text: 'Ingrese sus credenciales institucionales.' });
      return;
    }
    setLoading(true);
    try {
      await login(dniOrEmail, password);
      fireSwalDark({ icon: 'success', title: 'Sesión Iniciada', text: 'Bienvenido al Sistema de Accesos Kullki Wasi.', timer: 1400, showConfirmButton: false });
      navigate('/dashboard');
    } catch (err) {
      fireSwalDark({ icon: 'error', title: 'Error de Autenticación', text: err.message, confirmButtonColor: '#ef4444' });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (roleId) => {
    setLoadingRole(roleId);
    try {
      await loginAsRole(roleId);
      navigate('/dashboard');
    } catch (err) {
      fireSwalDark({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#ef4444' });
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 bg-[#070b13] bg-grid overflow-y-auto"
      style={{
        backgroundImage: [
          'linear-gradient(135deg, rgba(7,11,19,0.96) 0%, rgba(13,20,36,0.94) 100%)',
        ].join(', '),
      }}
    >
      {/* Ambient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0d2347]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#8DC63F]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT: Branding + Demo Roles ──────────── */}
        <div className="lg:col-span-7 flex flex-col justify-between p-7 rounded-2xl glass-panel border border-[#8DC63F]/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d2347]/20 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8DC63F] to-[#6aa832] flex items-center justify-center font-black text-[#0d2347] text-xl shadow-lg shadow-[#8DC63F]/20 font-['Outfit']">
                KW
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-100 tracking-widest uppercase font-['Outfit']">Kullki Wasi</h1>
                <p className="text-[10px] font-bold text-[#8DC63F] tracking-widest uppercase">Cooperativa de Ahorro y Crédito</p>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-slate-100 font-['Outfit'] leading-tight mb-3">
              Sistema de Control de Accesos y Trazabilidad
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
              Plataforma institucional para el monitoreo en tiempo real, validación QR, administración RBAC y auditoría del personal de la Cooperativa Kullki Wasi — Segmento 1 del Ecuador.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['Control RBAC', 'Trazabilidad QR', 'Auditoría SEPS', 'Monitoreo en Tiempo Real'].map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-[#8DC63F]/20 text-[#8DC63F] bg-[#8DC63F]/5 uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Demo Grid */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8DC63F] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8DC63F]" />
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Simulación Institucional — 8 Perfiles de Acceso
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(ROLES).map((role) => {
                const isLoading = loadingRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleDemoLogin(role.id)}
                    disabled={!!loadingRole}
                    className="flex items-center justify-between text-left p-2.5 rounded-xl bg-slate-900/60 hover:bg-[#0d2347]/60 border border-slate-800/60 hover:border-[#8DC63F]/35 transition-all text-[11px] font-medium text-slate-400 hover:text-slate-100 disabled:opacity-50 disabled:pointer-events-none group cursor-pointer"
                  >
                    <span className="truncate leading-snug">{role.name}</span>
                    {isLoading
                      ? <div className="w-3 h-3 border border-slate-500 border-t-[#8DC63F] rounded-full animate-spin shrink-0 ml-1" />
                      : <MdPlayArrow size={14} className="text-slate-600 group-hover:text-[#8DC63F] transition-colors shrink-0 ml-1" />
                    }
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Login Form ─────────────────────── */}
        <div className="lg:col-span-5 flex flex-col justify-center p-7 rounded-2xl glass-panel border border-slate-800/70 relative">

          {/* Header form */}
          <div className="mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#0d2347] border border-[#8DC63F]/20 flex items-center justify-center text-[#8DC63F] mb-4">
              <MdShield size={22} />
            </div>
            <h3 className="text-lg font-black text-slate-100 font-['Outfit']">Ingreso de Personal</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">Credenciales de seguridad institucionales requeridas.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* DNI / Email */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Cédula o Correo Institucional
              </label>
              <div className="relative">
                <MdBadge size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="1804293840 o usuario@kullkiwasi.com.ec"
                  value={dniOrEmail}
                  onChange={e => setDniOrEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#030508] border border-slate-800 rounded-xl focus:border-[#8DC63F] focus:ring-2 focus:ring-[#8DC63F]/15 outline-none text-xs text-slate-100 transition-all placeholder:text-slate-600 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <MdLockOutline size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#030508] border border-slate-800 rounded-xl focus:border-[#8DC63F] focus:ring-2 focus:ring-[#8DC63F]/15 outline-none text-xs text-slate-100 transition-all placeholder:text-slate-600 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Remember + forgot */}
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="rounded border-slate-700 bg-[#030508] text-[#8DC63F] focus:ring-0" />
                <span>Recordar sesión</span>
              </label>
              <button type="button" className="hover:text-[#8DC63F] transition-colors">¿Olvidó su contraseña?</button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#0d2347] to-[#163668] hover:from-[#163668] hover:to-[#1c4080] border border-[#8DC63F]/30 hover:border-[#8DC63F]/60 rounded-xl font-bold text-slate-100 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg disabled:opacity-50 disabled:pointer-events-none text-sm font-['Outfit'] tracking-wider"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                  Verificando credenciales...
                </>
              ) : (
                <>
                  Autenticar Acceso
                  <MdArrowForward size={16} className="text-[#8DC63F]" />
                </>
              )}
            </button>
          </form>

          {/* Legal notice */}
          <div className="mt-5 p-3 bg-[#030508] rounded-xl border border-slate-900/80 text-[10px] text-slate-600 leading-relaxed">
            ⚠️ <strong className="text-slate-500">AVISO LEGAL:</strong> Acceso exclusivo para personal autorizado de la Cooperativa Kullki Wasi Ltda. Cada sesión es auditada conforme a la normativa SEPS.
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
