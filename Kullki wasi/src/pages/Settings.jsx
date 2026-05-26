import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { MdSettings, MdSave, MdBackup, MdRestore, MdVpnKey } from 'react-icons/md';

const Settings = () => {
  const [config, setConfig] = useState({
    theme: 'dark',
    sessionTimeout: '30',
    twoFactor: true,
    apiEndpoint: 'https://api.kullkiwasi.com.ec/v1',
    logRetention: '90'
  });

  const handleSave = (e) => {
    e.preventDefault();
    Swal.fire({
      icon: 'success', title: 'Configuración Guardada',
      text: 'Los parámetros del sistema han sido actualizados localmente.',
      timer: 1500, showConfirmButton: false,
      background: '#0d1424', color: '#f1f5f9'
    });
  };

  const handleBackup = () => {
    Swal.fire({
      icon: 'info', title: 'Generando Respaldo',
      text: 'Comprimiendo base de datos y configuraciones...',
      timer: 2000, showConfirmButton: false,
      background: '#0d1424', color: '#f1f5f9',
      didOpen: () => Swal.showLoading()
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-slate-100 font-['Outfit']">Parámetros del Sistema</h2>
        <p className="text-xs text-slate-400 mt-0.5">Configuración técnica de la plataforma y políticas globales de seguridad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Main Settings Form */}
        <div className="md:col-span-8 p-6 rounded-2xl glass-panel border border-slate-800/70">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-800/60">
            <MdSettings size={20} className="text-[#8DC63F]" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-['Outfit']">Ajustes Globales</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tiempo de Sesión (Minutos)</label>
                <input 
                  type="number" value={config.sessionTimeout} onChange={e => setConfig({...config, sessionTimeout: e.target.value})}
                  className="w-full bg-[#030508] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-[#8DC63F] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Retención de Bitácoras (Días)</label>
                <input 
                  type="number" value={config.logRetention} onChange={e => setConfig({...config, logRetention: e.target.value})}
                  className="w-full bg-[#030508] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-[#8DC63F] outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Endpoint API Backend</label>
                <input 
                  type="text" value={config.apiEndpoint} onChange={e => setConfig({...config, apiEndpoint: e.target.value})}
                  className="w-full bg-[#030508] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-[#8DC63F] outline-none font-mono"
                />
              </div>

            </div>

            <div className="pt-4 border-t border-slate-800/60 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" checked={config.twoFactor} onChange={e => setConfig({...config, twoFactor: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#8DC63F] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Autenticación de Dos Factores (2FA) Obligatoria</span>
                  <span className="text-[10px] text-slate-500">Exigir a todos los administradores token OTP.</span>
                </div>
              </label>
            </div>

            <div className="pt-5 text-right">
              <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0d2347] hover:bg-[#163668] border border-[#8DC63F]/40 hover:border-[#8DC63F] rounded-xl text-xs font-bold text-slate-200 tracking-wider transition-all shadow-lg">
                <MdSave size={16} className="text-[#8DC63F]" />
                APLICAR CAMBIOS
              </button>
            </div>
          </form>
        </div>

        {/* Mantenimiento */}
        <div className="md:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl glass-panel border border-slate-800/70 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/60 pb-3 flex items-center gap-2">
              <MdBackup size={16} /> Mantenimiento
            </h3>
            
            <button onClick={handleBackup} className="w-full flex justify-between items-center px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group">
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-300">Respaldo Manual</span>
                <span className="block text-[9px] text-slate-500 mt-0.5">Exportar DB y config</span>
              </div>
              <MdBackup size={18} className="text-slate-600 group-hover:text-blue-400" />
            </button>

            <button className="w-full flex justify-between items-center px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group">
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-300">Restaurar Sistema</span>
                <span className="block text-[9px] text-slate-500 mt-0.5">Cargar snapshot local</span>
              </div>
              <MdRestore size={18} className="text-slate-600 group-hover:text-orange-400" />
            </button>
            
            <button className="w-full flex justify-between items-center px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group">
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-300">Rotar Llaves API</span>
                <span className="block text-[9px] text-slate-500 mt-0.5">Invalidar tokens actuales</span>
              </div>
              <MdVpnKey size={18} className="text-slate-600 group-hover:text-red-400" />
            </button>
          </div>

          <div className="p-4 rounded-xl border border-[#8DC63F]/20 bg-[#8DC63F]/5 text-[10px] text-[#8DC63F] leading-relaxed">
            <strong>Información:</strong> El entorno está configurado actualmente en modo <code>PRODUCCIÓN</code>. Los cambios afectan inmediatamente el comportamiento de los clientes.
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
