import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdBlock, MdArrowBack, MdLockOutline } from 'react-icons/md';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#070b13] bg-grid">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 max-w-md w-full glass-panel border border-red-500/20 rounded-3xl p-8 text-center shadow-2xl shadow-red-900/10">
        
        <div className="w-24 h-24 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 shadow-inner border border-red-500/20">
          <MdBlock size={48} className="animate-pulse" />
        </div>
        
        <h1 className="text-2xl font-black text-slate-100 font-['Outfit'] uppercase tracking-wider mb-2">Acceso Restringido</h1>
        
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Las políticas de seguridad <strong className="text-red-400">RBAC</strong> de la cooperativa impiden que su perfil actual (<span className="text-slate-300 font-bold">{user?.roleName || 'Desconocido'}</span>) acceda a este módulo.
        </p>

        <div className="p-4 bg-[#030508] border border-slate-800 rounded-xl mb-8 flex items-start gap-3 text-left">
          <MdLockOutline size={20} className="text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
            Incidente registrado. Este intento de acceso ha sido guardado en la bitácora de seguridad institucional bajo la IP local.
          </p>
        </div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
        >
          <MdArrowBack size={16} />
          Volver al Panel de Control
        </button>

      </div>
    </div>
  );
};

export default Unauthorized;
