import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  MdPerson, MdSave, MdCheckCircle, MdWarning, MdLock,
  MdEmail, MdBadge, MdVpnKey,
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/apiClient';

const Profile = () => {
  const { user } = useAuth();

  const perms = user?.permissions || [];
  const canEdit =
    user?.role === 'admin' ||
    user?.role === 'talento_humano' ||
    perms.includes('all') ||
    perms.includes('gestionar_usuarios');

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName:       user?.name?.split(' ')[0] || '',
    lastName:        user?.name?.split(' ').slice(1).join(' ') || '',
    email:           user?.email || '',
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, color: 'bg-slate-200', text: '' };
    if (pass.length < 6) return { score: 25, color: 'bg-red-500',    text: 'Débil'   };
    if (pass.length < 8) return { score: 50, color: 'bg-orange-500', text: 'Regular' };
    if (pass.match(/[A-Z]/) && pass.match(/[0-9]/))
      return { score: 100, color: 'bg-emerald-500', text: 'Fuerte' };
    return { score: 75, color: 'bg-[#84cc16]', text: 'Buena' };
  };
  const pwStrength = getPasswordStrength(form.newPassword);

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      Swal.fire({ icon: 'error', title: 'Contraseñas distintas', text: 'La nueva contraseña y su confirmación no coinciden.' });
      return;
    }
    if (form.newPassword && !form.currentPassword) {
      Swal.fire({ icon: 'warning', title: 'Contraseña requerida', text: 'Debes ingresar tu contraseña actual para poder cambiarla.' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombres:          form.firstName.trim(),
        apellidos:        form.lastName.trim(),
        email:            form.email.trim() || null,
        current_password: form.currentPassword || null,
        new_password:     form.newPassword     || null,
      };
      const res = await apiClient.patch(`/auth/profile/${user.dni}`, payload);
      const stored = JSON.parse(localStorage.getItem('kw_user') || '{}');
      localStorage.setItem('kw_user', JSON.stringify({ ...stored, name: res.data.name, email: res.data.email }));
      setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
      Swal.fire({
        icon: 'success', title: 'Perfil Actualizado',
        text: `Los datos de ${res.data.name} han sido guardados en la base de datos.`,
        timer: 2000, showConfirmButton: false,
        background: '#ffffff', color: '#1e293b',
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error al guardar', text: err.response?.data?.detail || 'No se pudo actualizar el perfil.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Mi Perfil</h2>
        <p className="text-sm text-slate-500 mt-1">
          {canEdit
            ? 'Administra tu información personal y contraseña de acceso.'
            : 'Consulta tu información institucional. Solo lectura.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Main card */}
        <div className="md:col-span-8 card-corporate p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
            <div className="p-2 bg-[#84cc16]/10 rounded-lg text-[#65a30d]"><MdPerson size={24} /></div>
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider font-['Outfit']">Información Personal</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {canEdit
                  ? 'Los cambios se guardan directamente en la base de datos.'
                  : 'Solo el Administrador o Talento Humano pueden modificar este perfil.'}
              </p>
            </div>
          </div>

          {canEdit ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="form-label">Nombres</label>
                  <input type="text" value={form.firstName} required
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    className="form-input w-full" placeholder="Ej: Carlos" />
                </div>
                <div className="space-y-1.5">
                  <label className="form-label">Apellidos</label>
                  <input type="text" value={form.lastName} required
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    className="form-input w-full" placeholder="Ej: Ruiz" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="form-label">Correo Electrónico</label>
                  <input type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="form-input w-full" placeholder="correo@kullkiwasi.com" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                  Cambiar Contraseña{' '}
                  <span className="font-normal text-slate-400 normal-case">(opcional — dejar vacío para mantener la actual)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="form-label">Contraseña Actual</label>
                    <input type="password" value={form.currentPassword}
                      onChange={e => setForm({ ...form, currentPassword: e.target.value })}
                      placeholder="••••••••" className="form-input w-full" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="form-label flex justify-between">
                      <span>Nueva Contraseña</span>
                      {pwStrength.text && <span className="text-[10px] text-slate-400">{pwStrength.text}</span>}
                    </label>
                    <input type="password" value={form.newPassword}
                      onChange={e => setForm({ ...form, newPassword: e.target.value })}
                      placeholder="••••••••" className="form-input w-full" />
                    {form.newPassword && (
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all ${pwStrength.color}`} style={{ width: `${pwStrength.score}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="form-label">Confirmar Nueva</label>
                    <input type="password" value={form.confirmPassword}
                      onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder="••••••••" className="form-input w-full" />
                    {form.confirmPassword && form.newPassword && (
                      <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${form.newPassword === form.confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                        {form.newPassword === form.confirmPassword
                          ? <><MdCheckCircle size={12} /> Coinciden</>
                          : <><MdWarning size={12} /> No coinciden</>}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 text-right">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                  <MdSave size={18} />
                  {saving ? 'GUARDANDO…' : 'GUARDAR PERFIL'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  ['Nombres',              user?.name?.split(' ')[0] || '—',                     false],
                  ['Apellidos',            user?.name?.split(' ').slice(1).join(' ') || '—',     false],
                  ['Correo Electrónico',   user?.email || '—',                                   true ],
                  ['Identificación (DNI)', user?.dni   || '—',                                   false],
                ].map(([label, value, fullWidth]) => (
                  <div key={label} className={`space-y-1.5${fullWidth ? ' sm:col-span-2' : ''}`}>
                    <p className="form-label">{label}</p>
                    <div className="form-input w-full bg-slate-50 text-slate-600 cursor-not-allowed select-none">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-medium">
                <MdLock size={14} className="text-slate-400 shrink-0" />
                Tu perfil solo puede ser modificado por el Administrador o Talento Humano.
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="md:col-span-4 space-y-5">

          {/* Avatar + role */}
          <div className="card-corporate p-6 flex flex-col items-center gap-3 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl text-slate-900 bg-gradient-to-br from-[#84cc16] to-[#facc15] shadow-lg border-4 border-white ring-2 ring-[#84cc16]/40">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-base font-black text-slate-800">{user?.name}</p>
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded border border-[#84cc16]/40 bg-[#84cc16]/10 text-[#65a30d] font-bold uppercase tracking-wider">
                {user?.roleName}
              </span>
            </div>
          </div>

          {/* Account details */}
          <div className="card-corporate p-5 space-y-3">
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-3 flex items-center gap-2">
              <MdBadge size={15} className="text-[#84cc16]" /> Cuenta
            </h4>
            {[
              ['Rol',     user?.roleName || '—',                                                          MdVpnKey],
              ['Agencia', user?.agency === 'MAT' ? 'Casa Matriz — Ambato' : `Sucursal ${user?.agency}`,  MdBadge ],
              ['Correo',  user?.email || '—',                                                             MdEmail ],
            ].map(([label, val, Icon]) => (
              <div key={label} className="flex items-start gap-2.5">
                <Icon size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">{label}</p>
                  <p className="text-xs text-slate-700 font-semibold mt-0.5 break-all">{val}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
