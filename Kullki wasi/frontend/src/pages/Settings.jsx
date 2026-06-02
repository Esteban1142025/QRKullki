import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { MdSettings, MdSave, MdBackup, MdRestore, MdVpnKey } from 'react-icons/md';

const Settings = () => {
  const [config, setConfig] = useState({
    theme: 'light',
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
      background: '#ffffff', color: '#1e293b'
    });
  };

  const handleBackup = () => {
    Swal.fire({
      icon: 'info', title: 'Generando Respaldo',
      text: 'Comprimiendo base de datos y configuraciones...',
      timer: 2000, showConfirmButton: false,
      background: '#ffffff', color: '#1e293b',
      didOpen: () => Swal.showLoading()
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Parámetros del Sistema</h2>
        <p className="text-sm text-slate-500 mt-1">Configuración técnica de la plataforma y políticas globales de seguridad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Main Settings Form */}
        <div className="md:col-span-8 p-6 sm:p-8 rounded-2xl bg-white shadow-lg border border-slate-200">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
            <div className="p-2 bg-[#84cc16]/10 rounded-lg text-[#65a30d]">
              <MdSettings size={24} />
            </div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider font-['Outfit']">Ajustes Globales</h3>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Tiempo de Sesión (Minutos)</label>
                <input 
                  type="number" value={config.sessionTimeout} onChange={e => setConfig({...config, sessionTimeout: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-[#84cc16] focus:ring-2 focus:ring-[#84cc16]/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Retención de Bitácoras (Días)</label>
                <input 
                  type="number" value={config.logRetention} onChange={e => setConfig({...config, logRetention: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-[#84cc16] focus:ring-2 focus:ring-[#84cc16]/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Endpoint API Backend</label>
                <input 
                  type="text" value={config.apiEndpoint} onChange={e => setConfig({...config, apiEndpoint: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:border-[#84cc16] focus:ring-2 focus:ring-[#84cc16]/20 outline-none font-mono transition-all"
                />
              </div>

            </div>

            <div className="pt-6 border-t border-slate-200 space-y-4">
              <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <input 
                  type="checkbox" checked={config.twoFactor} onChange={e => setConfig({...config, twoFactor: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-[#84cc16] focus:ring-[#84cc16] cursor-pointer"
                />
                <div>
                  <span className="text-sm font-black text-slate-800 block">Autenticación de Dos Factores (2FA) Obligatoria</span>
                  <span className="text-xs text-slate-500 font-medium">Exigir a todos los administradores token OTP al iniciar sesión.</span>
                </div>
              </label>
            </div>

            <div className="pt-6 text-right">
              <button type="submit" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-[#84cc16] border border-slate-800 hover:border-[#84cc16] text-white rounded-xl text-sm font-bold tracking-wider transition-all shadow-md">
                <MdSave size={20} />
                APLICAR CAMBIOS
              </button>
            </div>
          </form>
        </div>

        {/* Mantenimiento */}
        <div className="md:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-white shadow-md border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-4 flex items-center gap-3">
              <MdBackup size={20} className="text-[#84cc16]" /> Mantenimiento
            </h3>
            
            <button onClick={handleBackup} className="w-full flex justify-between items-center px-5 py-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#84cc16] hover:shadow-md rounded-xl transition-all group">
              <div className="text-left">
                <span className="block text-sm font-bold text-slate-800">Respaldo Manual</span>
                <span className="block text-xs text-slate-500 mt-1">Exportar DB y config</span>
              </div>
              <MdBackup size={22} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>

            <button className="w-full flex justify-between items-center px-5 py-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#84cc16] hover:shadow-md rounded-xl transition-all group">
              <div className="text-left">
                <span className="block text-sm font-bold text-slate-800">Restaurar Sistema</span>
                <span className="block text-xs text-slate-500 mt-1">Cargar snapshot local</span>
              </div>
              <MdRestore size={22} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
            </button>
            
            <button className="w-full flex justify-between items-center px-5 py-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-red-500 hover:shadow-md rounded-xl transition-all group">
              <div className="text-left">
                <span className="block text-sm font-bold text-slate-800">Rotar Llaves API</span>
                <span className="block text-xs text-slate-500 mt-1">Invalidar tokens actuales</span>
              </div>
              <MdVpnKey size={22} className="text-slate-400 group-hover:text-red-500 transition-colors" />
            </button>
          </div>

          <div className="p-5 rounded-xl border border-[#84cc16]/30 bg-[#84cc16]/10 text-sm text-slate-700 leading-relaxed shadow-sm font-medium">
            <strong className="text-[#65a30d] font-black">Información:</strong> El entorno está configurado actualmente en modo <code className="bg-white px-2 py-0.5 rounded border border-[#84cc16]/40 text-[#65a30d]">PRODUCCIÓN</code>. Los cambios afectan inmediatamente el comportamiento de los clientes.
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
