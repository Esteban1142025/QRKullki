import React, { useState, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  MdSettings, MdSave, MdBackup, MdRestore, MdVpnKey,
  MdCloudDownload, MdUploadFile, MdCheckCircle, MdWarning
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/apiClient';

const Settings = () => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [savingProfile, setSavingProfile] = useState(false);
  const [restoringFile, setRestoringFile] = useState(null);   // File object seleccionado
  const [restoring, setRestoring]         = useState(false);
  const fileInputRef = useRef(null);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
    email:         user?.email || '',
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  const [config, setConfig] = useState({
    sessionTimeout: '30',
    twoFactor: true,
    apiEndpoint: 'https://api.kullkiwasi.com.ec/v1',
    logRetention: '90',
  });

  /* ── Fortaleza de contraseña ─────────────────────────── */
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, color: 'bg-slate-200', text: '' };
    if (pass.length < 6)  return { score: 25,  color: 'bg-red-500',     text: 'Débil' };
    if (pass.length < 8)  return { score: 50,  color: 'bg-orange-500',  text: 'Regular' };
    if (pass.match(/[A-Z]/) && pass.match(/[0-9]/))
      return { score: 100, color: 'bg-emerald-500', text: 'Fuerte' };
    return { score: 75, color: 'bg-[#84cc16]', text: 'Buena' };
  };
  const pwStrength = getPasswordStrength(profileForm.newPassword);

  /* ── Guardar perfil ──────────────────────────────────── */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      Swal.fire({ icon: 'error', title: 'Contraseñas distintas', text: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }
    if (profileForm.newPassword && !profileForm.currentPassword) {
      Swal.fire({ icon: 'warning', title: 'Contraseña requerida', text: 'Debes ingresar tu contraseña actual para poder cambiarla.' });
      return;
    }
    setSavingProfile(true);
    try {
      const payload = {
        nombres:          profileForm.firstName.trim(),
        apellidos:        profileForm.lastName.trim(),
        email:            profileForm.email.trim() || null,
        current_password: profileForm.currentPassword || null,
        new_password:     profileForm.newPassword     || null,
      };
      const res = await apiClient.patch(`/auth/profile/${user.dni}`, payload);

      // Actualizar nombre en localStorage / contexto
      const stored = JSON.parse(localStorage.getItem('kw_user') || '{}');
      const updated = { ...stored, name: res.data.name, email: res.data.email };
      localStorage.setItem('kw_user', JSON.stringify(updated));

      // Limpiar campos de contraseña
      setProfileForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));

      Swal.fire({
        icon: 'success', title: 'Perfil Actualizado',
        text: `Los datos de ${res.data.name} han sido guardados en la base de datos.`,
        timer: 2000, showConfirmButton: false,
        background: '#ffffff', color: '#1e293b',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Error al guardar',
        text: err.response?.data?.detail || 'No se pudo actualizar el perfil.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Respaldo ────────────────────────────────────────── */
  const handleBackup = async () => {
    Swal.fire({
      title: 'Generando respaldo…',
      text: 'Exportando base de datos completa.',
      allowOutsideClick: false,
      background: '#ffffff', color: '#1e293b',
      didOpen: () => Swal.showLoading(),
    });
    try {
      const res = await apiClient.get('/backup', { responseType: 'blob' });
      const now  = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      const url  = URL.createObjectURL(res.data);
      const a    = Object.assign(document.createElement('a'), {
        href: url,
        download: `backup_kullki_${stamp}.json`,
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Swal.fire({
        icon: 'success', title: 'Respaldo Descargado',
        html: `<p style="font-size:13px;color:#475569">Archivo <strong>backup_kullki_${stamp}.json</strong> guardado en tu equipo.<br/>
               Guárdalo en un lugar seguro para poder restaurar el sistema si es necesario.</p>`,
        confirmButtonColor: '#84cc16', background: '#ffffff', color: '#1e293b',
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el respaldo. Verifica la conexión con el backend.' });
    }
  };

  /* ── Restaurar ───────────────────────────────────────── */
  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.json')) {
      Swal.fire({ icon: 'error', title: 'Archivo inválido', text: 'Solo se aceptan archivos .json generados por esta plataforma.' });
      return;
    }
    setRestoringFile(f);
  };

  const handleRestore = async () => {
    if (!restoringFile) return;
    const confirm = await Swal.fire({
      icon: 'warning',
      title: '¿Restaurar sistema?',
      html: `<p style="font-size:13px;color:#475569">
               Se reemplazarán <strong>todos los datos actuales</strong> con el contenido del archivo:<br/>
               <code style="background:#f1f5f9;padding:2px 8px;border-radius:6px;font-size:12px">${restoringFile.name}</code><br/><br/>
               <span style="color:#ef4444;font-weight:bold">Esta acción no se puede deshacer.</span>
             </p>`,
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      background: '#ffffff', color: '#1e293b',
    });
    if (!confirm.isConfirmed) return;

    setRestoring(true);
    Swal.fire({
      title: 'Restaurando sistema…',
      text: 'Importando datos a la base de datos.',
      allowOutsideClick: false,
      background: '#ffffff', color: '#1e293b',
      didOpen: () => Swal.showLoading(),
    });

    try {
      const formData = new FormData();
      formData.append('file', restoringFile);
      await apiClient.post('/restore/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRestoringFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      Swal.fire({
        icon: 'success', title: 'Sistema Restaurado',
        html: `<p style="font-size:13px;color:#475569">
                 Los datos han sido restaurados exitosamente.<br/>
                 Cierra sesión e inicia de nuevo para reflejar los cambios.
               </p>`,
        confirmButtonColor: '#84cc16', background: '#ffffff', color: '#1e293b',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error', title: 'Error al restaurar',
        text: err.response?.data?.detail || 'El archivo no pudo ser procesado. Verifica que sea un respaldo válido.',
      });
    } finally {
      setRestoring(false);
    }
  };

  /* ── Guardar config sistema ──────────────────────────── */
  const handleSaveConfig = (e) => {
    e.preventDefault();
    Swal.fire({
      icon: 'success', title: 'Configuración Guardada',
      text: 'Los parámetros han sido actualizados.',
      timer: 1500, showConfirmButton: false,
      background: '#ffffff', color: '#1e293b',
    });
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Parámetros del Sistema</h2>
        <p className="text-sm text-slate-500 mt-1">Configuración técnica de la plataforma y políticas globales de seguridad.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {['profile','system'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold transition-all ${activeTab === tab ? 'border-b-2 border-[#84cc16] text-[#84cc16]' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab === 'profile' ? 'Mi Perfil' : 'Sistema'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-6">

        {/* ── Formulario principal ─────────────────────── */}
        <div className="md:col-span-8 card-corporate p-6 sm:p-8">

          {/* PERFIL */}
          {activeTab === 'profile' && (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2 bg-[#84cc16]/10 rounded-lg text-[#65a30d]"><MdVpnKey size={24} /></div>
                <div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-wider font-['Outfit']">Información Personal</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Los cambios se guardan directamente en la base de datos.</p>
                </div>
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="form-label">Nombres</label>
                    <input type="text" value={profileForm.firstName}
                      onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                      required className="form-input w-full" placeholder="Ej: Carlos" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="form-label">Apellidos</label>
                    <input type="text" value={profileForm.lastName}
                      onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                      required className="form-input w-full" placeholder="Ej: Ruiz" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="form-label">Correo Electrónico</label>
                    <input type="email" value={profileForm.email}
                      onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                      className="form-input w-full" placeholder="correo@kullkiwasi.com" />
                  </div>
                </div>

                {/* Cambio de contraseña */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Cambiar Contraseña <span className="font-normal text-slate-400 normal-case">(opcional — dejar vacío para mantener la actual)</span></p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-1.5">
                      <label className="form-label">Contraseña Actual</label>
                      <input type="password" value={profileForm.currentPassword}
                        onChange={e => setProfileForm({...profileForm, currentPassword: e.target.value})}
                        placeholder="••••••••" className="form-input w-full" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="form-label flex justify-between">
                        <span>Nueva Contraseña</span>
                        {pwStrength.text && <span className="text-[10px] text-slate-400">{pwStrength.text}</span>}
                      </label>
                      <input type="password" value={profileForm.newPassword}
                        onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})}
                        placeholder="••••••••" className="form-input w-full" />
                      {profileForm.newPassword && (
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full transition-all ${pwStrength.color}`} style={{ width: `${pwStrength.score}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="form-label">Confirmar Nueva</label>
                      <input type="password" value={profileForm.confirmPassword}
                        onChange={e => setProfileForm({...profileForm, confirmPassword: e.target.value})}
                        placeholder="••••••••" className="form-input w-full" />
                      {profileForm.confirmPassword && profileForm.newPassword && (
                        <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${profileForm.newPassword === profileForm.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                          {profileForm.newPassword === profileForm.confirmPassword
                            ? <><MdCheckCircle size={12}/> Coinciden</>
                            : <><MdWarning size={12}/> No coinciden</>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 text-right">
                  <button type="submit" disabled={savingProfile} className="btn-primary disabled:opacity-60">
                    <MdSave size={18} />
                    {savingProfile ? 'GUARDANDO…' : 'GUARDAR PERFIL'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SISTEMA */}
          {activeTab === 'system' && (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2 bg-[#84cc16]/10 rounded-lg text-[#65a30d]"><MdSettings size={24} /></div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider font-['Outfit']">Ajustes Globales</h3>
              </div>
              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="form-label">Tiempo de Sesión (Minutos)</label>
                    <input type="number" value={config.sessionTimeout}
                      onChange={e => setConfig({...config, sessionTimeout: e.target.value})} className="form-input w-full" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="form-label">Retención de Bitácoras (Días)</label>
                    <input type="number" value={config.logRetention}
                      onChange={e => setConfig({...config, logRetention: e.target.value})} className="form-input w-full" />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="form-label">Endpoint API Backend</label>
                    <input type="text" value={config.apiEndpoint}
                      onChange={e => setConfig({...config, apiEndpoint: e.target.value})} className="form-input w-full font-mono" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={config.twoFactor}
                      onChange={e => setConfig({...config, twoFactor: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-300 text-[#84cc16] focus:ring-[#84cc16] cursor-pointer" />
                    <div>
                      <span className="text-sm font-black text-slate-800 block">Autenticación de Dos Factores (2FA) Obligatoria</span>
                      <span className="text-xs text-slate-500 font-medium">Exigir token OTP a todos los administradores al iniciar sesión.</span>
                    </div>
                  </label>
                </div>
                <div className="pt-2 text-right">
                  <button type="submit" className="btn-primary"><MdSave size={18} /> APLICAR CAMBIOS</button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Panel lateral ────────────────────────────── */}
        <div className="md:col-span-4 space-y-5">

          {/* Mantenimiento */}
          <div className="card-corporate p-6 space-y-3">
            <h3 className="text-sm font-black text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-4 flex items-center gap-2">
              <MdBackup size={18} className="text-[#84cc16]" /> Mantenimiento
            </h3>

            {/* Respaldo */}
            <button onClick={handleBackup}
              className="w-full flex justify-between items-center px-4 py-3.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#84cc16] hover:shadow-md rounded-xl transition-all group cursor-pointer">
              <div className="text-left">
                <span className="block text-sm font-bold text-slate-800">Respaldo Manual</span>
                <span className="block text-xs text-slate-500 mt-0.5">Descargar BD completa en JSON</span>
              </div>
              <MdCloudDownload size={22} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
            </button>

            {/* Restaurar */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3.5 bg-slate-50 hover:bg-white hover:border-orange-400 transition-all group">
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-800">Restaurar Sistema</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Cargar un respaldo .json</span>
                </div>
                <MdRestore size={22} className="text-slate-400 group-hover:text-orange-500 transition-colors shrink-0" />
              </div>
              <div className="px-4 pb-4 pt-2 bg-white border-t border-slate-100 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#84cc16]/10 file:text-[#65a30d] hover:file:bg-[#84cc16]/20 cursor-pointer"
                />
                {restoringFile && (
                  <div className="flex items-center gap-2 text-[11px] text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                    <MdUploadFile size={14} className="shrink-0"/>
                    <span className="truncate font-medium">{restoringFile.name}</span>
                  </div>
                )}
                <button
                  onClick={handleRestore}
                  disabled={!restoringFile || restoring}
                  className="w-full py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer">
                  {restoring ? 'RESTAURANDO…' : 'CONFIRMAR RESTAURACIÓN'}
                </button>
              </div>
            </div>

          </div>

          {/* Banner info */}
          <div className="p-4 rounded-xl border border-[#84cc16]/30 bg-[#84cc16]/10 text-sm text-slate-700 leading-relaxed shadow-sm font-medium">
            <strong className="text-[#65a30d] font-black">Entorno:</strong>{' '}
            <code className="bg-white px-2 py-0.5 rounded border border-[#84cc16]/40 text-[#65a30d] text-xs">PRODUCCIÓN</code>
            <p className="text-xs text-slate-500 mt-2">Los cambios afectan inmediatamente el comportamiento del sistema.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
