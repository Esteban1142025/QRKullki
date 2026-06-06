import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { MdSettings, MdSave, MdBackup, MdRestore, MdVpnKey } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [recentActivities, setRecentActivities] = useState([]);

  React.useEffect(() => {
    try {
      const dyn = JSON.parse(localStorage.getItem('kw_dynamic_logs') || '[]');
      const myLogs = dyn.filter(l => l.employeeId === user?.email || l.employeeId === user?.id || l.name === user?.name).slice(0, 3);
      setRecentActivities(myLogs);
    } catch(e) {}
  }, [user]);

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, color: 'bg-slate-200', text: '' };
    if (pass.length < 6) return { score: 25, color: 'bg-red-500', text: 'Débil' };
    if (pass.length < 8) return { score: 50, color: 'bg-orange-500', text: 'Regular' };
    if (pass.match(/[A-Z]/) && pass.match(/[0-9]/)) return { score: 100, color: 'bg-emerald-500', text: 'Fuerte' };
    return { score: 75, color: 'bg-[#84cc16]', text: 'Buena' };
  };
  const pwStrength = getPasswordStrength(profileForm.newPassword);

  const [config, setConfig] = useState({
    theme: 'light',
    sessionTimeout: '30',
    twoFactor: true,
    apiEndpoint: 'https://api.kullkiwasi.com.ec/v1',
    logRetention: '90'
  });

  const handleSaveConfig = (e) => {
    e.preventDefault();
    Swal.fire({
      icon: 'success', title: 'Configuración Guardada',
      text: 'Los parámetros del sistema han sido actualizados localmente.',
      timer: 1500, showConfirmButton: false,
      background: '#ffffff', color: '#1e293b'
    });
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden' });
      return;
    }
    Swal.fire({
      icon: 'success', title: 'Perfil Actualizado',
      text: 'Tus datos personales se han actualizado correctamente.',
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

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`pb-3 text-sm font-bold transition-all ${activeTab === 'profile' ? 'border-b-2 border-[#84cc16] text-[#84cc16]' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Mi Perfil
        </button>
        <button 
          onClick={() => setActiveTab('system')} 
          className={`pb-3 text-sm font-bold transition-all ${activeTab === 'system' ? 'border-b-2 border-[#84cc16] text-[#84cc16]' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Sistema
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-6">
        
        {/* Main Settings Form */}
        <div className="md:col-span-8 card-corporate p-6 sm:p-8">
          
          {activeTab === 'profile' && (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2 bg-[#84cc16]/10 rounded-lg text-[#65a30d]">
                  <MdVpnKey size={24} />
                </div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider font-['Outfit']">Información Personal</h3>
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="form-label">Nombre Completo</label>
                    <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} required className="form-input" />
                  </div>
                  <div className="space-y-2">
                    <label className="form-label">Correo Electrónico</label>
                    <input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} required className="form-input" />
                  </div>
                  <div className="space-y-2">
                    <label className="form-label flex justify-between">
                      <span>Nueva Contraseña</span>
                      {pwStrength.text && <span className="text-[10px] text-slate-400">{pwStrength.text}</span>}
                    </label>
                    <input type="password" placeholder="Dejar en blanco para mantener" value={profileForm.newPassword} onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})} className="form-input" />
                    {profileForm.newPassword && (
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className={`h-full transition-all ${pwStrength.color}`} style={{ width: `${pwStrength.score}%` }}></div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="form-label">Confirmar Contraseña</label>
                    <input type="password" placeholder="Confirma tu nueva contraseña" value={profileForm.confirmPassword} onChange={e => setProfileForm({...profileForm, confirmPassword: e.target.value})} className="form-input" />
                  </div>
                </div>
                <div className="pt-6 text-right">
                  <button type="submit" className="btn-primary">
                    <MdSave size={20} />
                    GUARDAR PERFIL
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2 bg-[#84cc16]/10 rounded-lg text-[#65a30d]">
                  <MdSettings size={24} />
                </div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider font-['Outfit']">Ajustes Globales</h3>
              </div>
              <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="form-label">Tiempo de Sesión (Minutos)</label>
                <input 
                  type="number" value={config.sessionTimeout} onChange={e => setConfig({...config, sessionTimeout: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Retención de Bitácoras (Días)</label>
                <input 
                  type="number" value={config.logRetention} onChange={e => setConfig({...config, logRetention: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="form-label">Endpoint API Backend</label>
                <input 
                  type="text" value={config.apiEndpoint} onChange={e => setConfig({...config, apiEndpoint: e.target.value})}
                  className="form-input font-mono"
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
              <button type="submit" className="btn-primary">
                <MdSave size={20} />
                APLICAR CAMBIOS
              </button>
            </div>
              </form>
            </div>
          )}
        </div>

        {/* Mantenimiento */}
        <div className="md:col-span-4 space-y-6">
          <div className="card-corporate p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-4 flex items-center gap-3">
              <MdBackup size={20} className="text-[#84cc16]" /> Mantenimiento
            </h3>
            
            <button onClick={handleBackup} className="w-full flex justify-between items-center px-5 py-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#84cc16] hover:shadow-md rounded-xl transition-all group cursor-pointer">
              <div className="text-left">
                <span className="block text-sm font-bold text-slate-800">Respaldo Manual</span>
                <span className="block text-xs text-slate-500 mt-1">Exportar DB y config</span>
              </div>
              <MdBackup size={22} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>

            <button className="w-full flex justify-between items-center px-5 py-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#84cc16] hover:shadow-md rounded-xl transition-all group cursor-pointer">
              <div className="text-left">
                <span className="block text-sm font-bold text-slate-800">Restaurar Sistema</span>
                <span className="block text-xs text-slate-500 mt-1">Cargar snapshot local</span>
              </div>
              <MdRestore size={22} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
            </button>
            
            <button className="w-full flex justify-between items-center px-5 py-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-red-500 hover:shadow-md rounded-xl transition-all group cursor-pointer">
              <div className="text-left">
                <span className="block text-sm font-bold text-slate-800">Rotar Llaves API</span>
                <span className="block text-xs text-slate-500 mt-1">Invalidar tokens actuales</span>
              </div>
              <MdVpnKey size={22} className="text-slate-400 group-hover:text-red-500 transition-colors" />
            </button>
          </div>

          <div className="card-corporate p-6 space-y-4">
             <h3 className="text-sm font-black text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-4">
              Actividades Recientes
            </h3>
            <div className="space-y-3">
              {recentActivities.length > 0 ? recentActivities.map(act => (
                <div key={act.id} className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="font-bold text-slate-700">{act.details || act.status}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(act.timestamp).toLocaleString()}</p>
                </div>
              )) : (
                <p className="text-xs text-slate-500 text-center py-4">No hay actividades registradas recientemente.</p>
              )}
            </div>
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
