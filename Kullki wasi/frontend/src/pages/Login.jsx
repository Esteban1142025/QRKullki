import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { MdLockOutline, MdOutlinePersonOutline, MdArrowForward } from 'react-icons/md';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [cedula, setCedula] = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  
  // Security logic: Lockout
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const attempts = parseInt(localStorage.getItem('kw_failed_attempts') || '0');
    const lockout = localStorage.getItem('kw_lockout_time');
    setFailedAttempts(attempts);
    if (lockout) {
      const lockDate = new Date(lockout).getTime();
      const now = new Date().getTime();
      if (lockDate > now) {
        setLockoutTime(lockDate);
      } else {
        localStorage.removeItem('kw_failed_attempts');
        localStorage.removeItem('kw_lockout_time');
        setFailedAttempts(0);
      }
    }
  }, []);

  useEffect(() => {
    if (lockoutTime) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        if (lockoutTime > now) {
          setRemainingTime(Math.ceil((lockoutTime - now) / 1000));
        } else {
          setLockoutTime(null);
          setRemainingTime(0);
          localStorage.removeItem('kw_failed_attempts');
          localStorage.removeItem('kw_lockout_time');
          setFailedAttempts(0);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  const fireSwalLight = (opts) =>
    Swal.fire({ background: '#ffffff', color: '#1e293b', confirmButtonColor: '#15803d', ...opts });

  const recordFailedAudit = (userIdentifier) => {
    const log = {
      id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(),
      employeeId: userIdentifier, name: 'Desconocido', role: 'N/A',
      agency: 'N/A', area: 'Plataforma Web', device: 'Navegador Web',
      status: 'Denegado', details: `Intento de inicio de sesión fallido. Credenciales incorrectas.`, risk: 'Alto'
    };
    const logs = JSON.parse(localStorage.getItem('kw_dynamic_logs') || '[]');
    localStorage.setItem('kw_dynamic_logs', JSON.stringify([log, ...logs]));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Error al copiar:', err);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockoutTime) {
      fireSwalLight({ icon: 'error', title: 'Cuenta Bloqueada temporalmente', text: `Espere ${remainingTime} segundos para reintentar.`, confirmButtonColor: '#ef4444' });
      return;
    }

    if (!cedula || !password) {
      fireSwalLight({ icon: 'warning', title: 'Campos requeridos', text: 'Por favor, ingrese su cédula y contraseña.' });
      return;
    }

    if (!/^[0-9]{10}$/.test(cedula)) {
      fireSwalLight({ icon: 'warning', title: 'Cédula inválida', text: 'La cédula debe tener exactamente 10 dígitos numéricos.' });
      return;
    }
    setLoading(true);
    try {
      await login(cedula, password);
      // Success, clear attempts
      localStorage.removeItem('kw_failed_attempts');
      localStorage.removeItem('kw_lockout_time');
      navigate('/dashboard');
    } catch (err) {
      // AuthContext re-lanza el error como new Error(detail), así que el mensaje está en err.message
      const serverDetail = (err?.message || err?.response?.data?.detail || '').toLowerCase();
      const isInactive = serverDetail.includes('inactivo') || serverDetail.includes('inactive');

      recordFailedAudit(cedula);

      if (isInactive) {
        // Cuenta desactivada por administrador — no cuenta como intento fallido ni bloquea
        fireSwalLight({
          icon: 'warning',
          title: 'Cuenta Inactiva',
          text: 'Su cuenta ha sido desactivada por un administrador. Contacte a Talento Humano para más información.',
          confirmButtonColor: '#f59e0b',
        });
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        localStorage.setItem('kw_failed_attempts', newAttempts.toString());

        if (newAttempts >= 3) {
          const blockUntil = new Date().getTime() + 30000;
          setLockoutTime(blockUntil);
          localStorage.setItem('kw_lockout_time', new Date(blockUntil).toISOString());
          fireSwalLight({ icon: 'error', title: 'Bloqueo de Seguridad', text: 'Múltiples intentos fallidos. Sistema bloqueado temporalmente por 30 segundos.', confirmButtonColor: '#ef4444' });
        } else {
          fireSwalLight({ icon: 'error', title: 'Acceso Denegado', text: `Credenciales incorrectas. Intento ${newAttempts} de 3.`, confirmButtonColor: '#ef4444' });
        }
      }
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
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Cuadro de información de usuarios de prueba (temporal para desarrollo) */}
        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-6 border border-white/20 w-full md:w-80">
          <h3 className="text-lg font-bold text-slate-800 mb-4 text-center border-b pb-2">Usuarios de Prueba</h3>
          
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">A</div>
                <span className="font-bold text-green-800 text-xs">Admin</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between cursor-pointer hover:bg-green-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('0987654321', 'Cédula')}>
                  <span className="text-slate-600">Céd:</span>
                  <span className="font-mono font-bold text-slate-800">0987654321</span>
                </div>
                <div className="flex justify-between cursor-pointer hover:bg-green-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('admin123', 'Clave')}>
                  <span className="text-slate-600">Clave:</span>
                  <span className="font-mono font-bold text-slate-800">admin123</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">E</div>
                <span className="font-bold text-blue-800 text-xs">Empleado</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between cursor-pointer hover:bg-blue-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('1712345678', 'Cédula')}>
                  <span className="text-slate-600">Céd:</span>
                  <span className="font-mono font-bold text-slate-800">1712345678</span>
                </div>
                <div className="flex justify-between cursor-pointer hover:bg-blue-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('empleado123', 'Clave')}>
                  <span className="text-slate-600">Clave:</span>
                  <span className="font-mono font-bold text-slate-800">empleado123</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">TH</div>
                <span className="font-bold text-purple-800 text-xs">Talento Humano</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between cursor-pointer hover:bg-purple-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('1234567890', 'Cédula')}>
                  <span className="text-slate-600">Céd:</span>
                  <span className="font-mono font-bold text-slate-800">1234567890</span>
                </div>
                <div className="flex justify-between cursor-pointer hover:bg-purple-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('talento123', 'Clave')}>
                  <span className="text-slate-600">Clave:</span>
                  <span className="font-mono font-bold text-slate-800">talento123</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xs">R</div>
                <span className="font-bold text-orange-800 text-xs">Riesgos</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between cursor-pointer hover:bg-orange-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('2345678901', 'Cédula')}>
                  <span className="text-slate-600">Céd:</span>
                  <span className="font-mono font-bold text-slate-800">2345678901</span>
                </div>
                <div className="flex justify-between cursor-pointer hover:bg-orange-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('riesgos123', 'Clave')}>
                  <span className="text-slate-600">Clave:</span>
                  <span className="font-mono font-bold text-slate-800">riesgos123</span>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs">SF</div>
                <span className="font-bold text-red-800 text-xs">Seguridad Física</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between cursor-pointer hover:bg-red-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('3456789012', 'Cédula')}>
                  <span className="text-slate-600">Céd:</span>
                  <span className="font-mono font-bold text-slate-800">3456789012</span>
                </div>
                <div className="flex justify-between cursor-pointer hover:bg-red-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('seguridad123', 'Clave')}>
                  <span className="text-slate-600">Clave:</span>
                  <span className="font-mono font-bold text-slate-800">seguridad123</span>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs">AU</div>
                <span className="font-bold text-teal-800 text-xs">Auditor</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between cursor-pointer hover:bg-teal-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('4567890123', 'Cédula')}>
                  <span className="text-slate-600">Céd:</span>
                  <span className="font-mono font-bold text-slate-800">4567890123</span>
                </div>
                <div className="flex justify-between cursor-pointer hover:bg-teal-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('auditor123', 'Clave')}>
                  <span className="text-slate-600">Clave:</span>
                  <span className="font-mono font-bold text-slate-800">auditor123</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">JA</div>
                <span className="font-bold text-indigo-800 text-xs">Jefe Agencia</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between cursor-pointer hover:bg-indigo-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('5678901234', 'Cédula')}>
                  <span className="text-slate-600">Céd:</span>
                  <span className="font-mono font-bold text-slate-800">5678901234</span>
                </div>
                <div className="flex justify-between cursor-pointer hover:bg-indigo-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('jefe123', 'Clave')}>
                  <span className="text-slate-600">Clave:</span>
                  <span className="font-mono font-bold text-slate-800">jefe123</span>
                </div>
              </div>
            </div>

            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-xs">TI</div>
                <span className="font-bold text-cyan-800 text-xs">Técnico TI</span>
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between cursor-pointer hover:bg-cyan-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('6789012345', 'Cédula')}>
                  <span className="text-slate-600">Céd:</span>
                  <span className="font-mono font-bold text-slate-800">6789012345</span>
                </div>
                <div className="flex justify-between cursor-pointer hover:bg-cyan-100 rounded px-1 py-0.5 transition-colors" onClick={() => copyToClipboard('tecnico123', 'Clave')}>
                  <span className="text-slate-600">Clave:</span>
                  <span className="font-mono font-bold text-slate-800">tecnico123</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t text-center">
            <p className="text-xs text-slate-500 italic">Información temporal para pruebas</p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl p-8 md:p-10 border border-white/20">
          
          <div className="flex flex-col items-center mb-8">
            <img 
              src="https://play-lh.googleusercontent.com/G-uc06_SBqaE8a-M7JKQCD-Hpfkvxb1g9X3VPmyngldtTRS-pr69QPW_4zDBe9_6qEw" 
              alt="Kullki Wasi Logo" 
              className="w-24 h-24 object-contain mb-4 drop-shadow-sm" 
            />
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-['Outfit']">Kullki Wasi</h1>
            <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">Portal Institucional</p>
          </div>

          {lockoutTime ? (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center mb-6 shadow-sm">
              <p className="font-bold text-sm mb-1">Bloqueo de Seguridad Activo</p>
              <p className="text-xs">Por favor espere <strong>{remainingTime}s</strong> para intentar de nuevo.</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Cédula
              </label>
              <div className="flex items-center bg-white border border-slate-300 rounded-xl focus-within:border-[#15803d] focus-within:ring-2 focus-within:ring-[#15803d]/20 transition-all overflow-hidden shadow-sm">
                <div className="pl-4 pr-2 text-slate-400 flex items-center justify-center">
                  <MdOutlinePersonOutline size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Ej: 0987654321"
                  value={cedula}
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 10) {
                      setCedula(value);
                    }
                  }}
                  disabled={loading || lockoutTime !== null}
                  className="w-full py-3.5 pr-4 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400 disabled:bg-slate-50"
                  maxLength={10}
                />
              </div>
            </div>

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
                  disabled={loading || lockoutTime !== null}
                  className="w-full py-3.5 pr-4 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400 disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-center pt-1 pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-[#15803d] focus:ring-[#15803d] bg-white cursor-pointer" 
                />
                <span className="text-sm font-medium text-slate-600 select-none">Recordar sesión</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || lockoutTime !== null}
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

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Acceso restringido a personal de <span className="font-bold text-slate-700">Kullki Wasi</span><br/>
              Toda actividad es auditada y monitoreada.
            </p>
          </div>
        </div>

        {/* Espacio vacío para balancear el grid y centrar el login */}
        <div className="hidden md:block"></div>

      </div>
    </div>
  );
};

export default Login;
