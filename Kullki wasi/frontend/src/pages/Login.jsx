import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { MdLockOutline, MdOutlinePersonOutline, MdArrowForward } from 'react-icons/md';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [dniOrEmail, setDniOrEmail] = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);

  const fireSwalLight = (opts) =>
    Swal.fire({ background: '#ffffff', color: '#1e293b', confirmButtonColor: '#15803d', ...opts });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dniOrEmail || !password) {
      fireSwalLight({ icon: 'warning', title: 'Campos requeridos', text: 'Por favor, ingrese su usuario y contraseña.' });
      return;
    }
    setLoading(true);
    try {
      await login(dniOrEmail, password);
      navigate('/dashboard');
    } catch (err) {
      fireSwalLight({ icon: 'error', title: 'Acceso Denegado', text: 'Las credenciales ingresadas son incorrectas.', confirmButtonColor: '#ef4444' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url('https://www.sabermassermas.com/wp-content/uploads/2016/07/Cooperativas_interna.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Capa superpuesta (Overlay) gris oscuro neutro, no verde y no totalmente negro para que la imagen se vea perfecta */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-[420px]">
        
        {/* Tarjeta Central */}
        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-8 md:p-10 border border-white/20">
          
          {/* Logo y Encabezado */}
          <div className="flex flex-col items-center mb-8">
            <img 
              src="https://play-lh.googleusercontent.com/G-uc06_SBqaE8a-M7JKQCD-Hpfkvxb1g9X3VPmyngldtTRS-pr69QPW_4zDBe9_6qEw" 
              alt="Kullki Wasi Logo" 
              className="w-24 h-24 object-contain mb-4 drop-shadow-sm" 
            />
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-['Outfit']">Kullki Wasi</h1>
            <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">Portal Institucional</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Input Usuario */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Usuario o Cédula
              </label>
              {/* Uso de Flexbox para agrupar ícono y campo */}
              <div className="flex items-center bg-white border border-slate-300 rounded-xl focus-within:border-[#15803d] focus-within:ring-2 focus-within:ring-[#15803d]/20 transition-all overflow-hidden shadow-sm">
                <div className="pl-4 pr-2 text-slate-400 flex items-center justify-center">
                  <MdOutlinePersonOutline size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Ej: 1804293840"
                  value={dniOrEmail}
                  onChange={e => setDniOrEmail(e.target.value)}
                  disabled={loading}
                  className="w-full py-3.5 pr-4 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Contraseña
                </label>
                <button type="button" className="text-[11px] font-bold text-[#15803d] hover:text-[#166534] transition-colors">
                  ¿Olvidó su clave?
                </button>
              </div>
              <div className="flex items-center bg-white border border-slate-300 rounded-xl focus-within:border-[#15803d] focus-within:ring-2 focus-within:ring-[#15803d]/20 transition-all overflow-hidden shadow-sm">
                <div className="pl-4 pr-2 text-slate-400 flex items-center justify-center">
                  <MdLockOutline size={20} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full py-3.5 pr-4 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400 disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* Mantener sesión */}
            <div className="flex items-center pt-1 pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-[#15803d] focus:ring-[#15803d] bg-white cursor-pointer" 
                />
                <span className="text-sm font-medium text-slate-600 select-none">Recordar sesión</span>
              </label>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#166534] to-[#15803d] hover:from-[#14532d] hover:to-[#166534] text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:shadow-[#15803d]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar al Sistema
                  <MdArrowForward size={20} className="text-[#facc15]" />
                </>
              )}
            </button>

          </form>
        </div>

        {/* Footer Legal adaptado para fondo oscuro (texto blanco/gris claro) */}
        <div className="mt-8 text-center relative z-10">
          <p className="text-xs text-slate-300 font-medium leading-relaxed drop-shadow-md">
            Acceso restringido a personal de <span className="font-bold text-white">Kullki Wasi Ltda.</span><br/>
            Toda actividad es auditada y monitoreada.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
