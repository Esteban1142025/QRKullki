import React, { useState, useRef, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import {
  MdSettings, MdSave, MdBackup, MdRestore,
  MdCloudDownload, MdUploadFile, MdAdd, MdDelete, MdBusiness,
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/apiClient';

const SETTINGS_KEY = 'kw_system_config';
const DEFAULT_CONFIG = {
  sessionTimeout: '30',
  apiEndpoint: window.location.origin.replace('3000', '3001') || 'http://localhost:3001',
  logRetention: '90',
};

const Settings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canManageDepts = isAdmin || user?.role === 'talento_humano';

  const [restoringFile, setRestoringFile] = useState(null);
  const [restoring, setRestoring]         = useState(false);
  const fileInputRef = useRef(null);

  /* ── Departamentos ───────────────────────────────────── */
  const [departments, setDepartments]   = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [newDeptName, setNewDeptName]   = useState('');
  const [savingDept, setSavingDept]     = useState(false);

  const loadDepartments = useCallback(async () => {
    setLoadingDepts(true);
    try {
      const res = await apiClient.get('/departamentos');
      setDepartments(res.data);
    } catch {
      /* silencioso */
    } finally {
      setLoadingDepts(false);
    }
  }, []);

  useEffect(() => { loadDepartments(); }, [loadDepartments]);

  const handleAddDept = async (e) => {
    e.preventDefault();
    const nombre = newDeptName.trim();
    if (!nombre) return;
    setSavingDept(true);
    try {
      await apiClient.post('/departamentos', { nombre });
      setNewDeptName('');
      await loadDepartments();
      Swal.fire({ icon: 'success', title: 'Departamento creado', text: `"${nombre}" fue agregado correctamente.`, timer: 1500, showConfirmButton: false, background: '#ffffff', color: '#1e293b' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'No se pudo crear el departamento.', background: '#ffffff', color: '#1e293b' });
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDept = async (dept) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar departamento?',
      html: `<p style="font-size:13px;color:#475569">Se eliminará <strong>${dept.nombre}</strong>.<br/>Esta acción no afecta a los colaboradores existentes pero el departamento dejará de aparecer en el formulario.</p>`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444', cancelButtonColor: '#334155',
      background: '#ffffff', color: '#1e293b',
    });
    if (!confirm.isConfirmed) return;
    try {
      await apiClient.delete(`/departamentos/${dept.id}`);
      await loadDepartments();
      Swal.fire({ icon: 'success', title: 'Eliminado', text: `"${dept.nombre}" eliminado correctamente.`, timer: 1400, showConfirmButton: false, background: '#ffffff', color: '#1e293b' });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'No se pudo eliminar el departamento.', background: '#ffffff', color: '#1e293b' });
    }
  };

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

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
      const now   = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      const url   = URL.createObjectURL(res.data);
      const a     = Object.assign(document.createElement('a'), { href: url, download: `backup_kullki_${stamp}.json` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Swal.fire({
        icon: 'success', title: 'Respaldo Descargado',
        html: `<p style="font-size:13px;color:#475569">Archivo <strong>backup_kullki_${stamp}.json</strong> guardado en tu equipo.<br/>
               Guárdalo en un lugar seguro para poder restaurar el sistema si es necesario.</p>`,
        confirmButtonColor: '#84cc16', background: '#ffffff', color: '#1e293b',
      });
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo generar el respaldo. Verifica la conexión con el backend.' });
    }
  };

  /* ── Restaurar ───────────────────────────────────────── */
  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.json')) {
      Swal.fire({ icon: 'error', title: 'Archivo inválido', text: 'Solo se aceptan archivos .json generados por esta plataforma.' });
      e.target.value = '';
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      Swal.fire({ icon: 'error', title: 'Archivo demasiado grande', text: 'El archivo de respaldo no puede superar 10 MB.' });
      e.target.value = '';
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
      confirmButtonText: 'Sí, restaurar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444', cancelButtonColor: '#334155',
      background: '#ffffff', color: '#1e293b',
    });
    if (!confirm.isConfirmed) return;

    setRestoring(true);
    Swal.fire({
      title: 'Restaurando sistema…', text: 'Importando datos a la base de datos.',
      allowOutsideClick: false, background: '#ffffff', color: '#1e293b',
      didOpen: () => Swal.showLoading(),
    });
    try {
      const formData = new FormData();
      formData.append('file', restoringFile);
      await apiClient.post('/restore/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setRestoringFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      Swal.fire({
        icon: 'success', title: 'Sistema Restaurado',
        html: `<p style="font-size:13px;color:#475569">Los datos han sido restaurados exitosamente.<br/>
               Cierra sesión e inicia de nuevo para reflejar los cambios.</p>`,
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

  /* ── Guardar config ──────────────────────────────────── */
  const handleSaveConfig = (e) => {
    e.preventDefault();
    const timeout = parseInt(config.sessionTimeout, 10);
    if (isNaN(timeout) || timeout < 1 || timeout > 480) {
      Swal.fire({ icon: 'warning', title: 'Valor inválido', text: 'El tiempo de sesión debe estar entre 1 y 480 minutos.', background: '#ffffff', color: '#1e293b' });
      return;
    }
    const retention = parseInt(config.logRetention, 10);
    if (isNaN(retention) || retention < 1 || retention > 3650) {
      Swal.fire({ icon: 'warning', title: 'Valor inválido', text: 'La retención de bitácoras debe estar entre 1 y 3650 días.', background: '#ffffff', color: '#1e293b' });
      return;
    }
    try {
      const prev = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...config, sessionTimeout: String(timeout), logRetention: String(retention) }));
      if (prev.sessionTimeout !== String(timeout)) {
        window.dispatchEvent(new CustomEvent('kw:config-changed', { detail: { sessionTimeout: timeout } }));
      }
      Swal.fire({
        icon: 'success', title: 'Configuración Guardada',
        text: 'Los parámetros han sido actualizados correctamente.',
        timer: 1500, showConfirmButton: false,
        background: '#ffffff', color: '#1e293b',
      });
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la configuración.' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Parámetros del Sistema</h2>
        <p className="text-sm text-slate-500 mt-1">Configuración técnica de la plataforma y políticas globales de seguridad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-6">

        {/* Columna izquierda */}
        <div className="md:col-span-8 space-y-6">

          {/* Ajustes globales — solo admin */}
          {isAdmin && (
            <div className="card-corporate p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2 bg-[#84cc16]/10 rounded-lg text-[#65a30d]"><MdSettings size={24} /></div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider font-['Outfit']">Ajustes Globales</h3>
              </div>
              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="form-label">Tiempo de Sesión (Minutos)</label>
                    <input type="number" value={config.sessionTimeout} min="1" max="480"
                      onChange={e => setConfig({ ...config, sessionTimeout: e.target.value })} className="form-input w-full" />
                    <p className="text-[10px] text-slate-400">Entre 1 y 480 minutos</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="form-label">Retención de Bitácoras (Días)</label>
                    <input type="number" value={config.logRetention} min="1" max="3650"
                      onChange={e => setConfig({ ...config, logRetention: e.target.value })} className="form-input w-full" />
                    <p className="text-[10px] text-slate-400">Entre 1 y 3650 días (máx. 10 años)</p>
                  </div>
                </div>
                <div className="pt-2 text-right">
                  <button type="submit" className="btn-primary"><MdSave size={18} /> APLICAR CAMBIOS</button>
                </div>
              </form>
            </div>
          )}

          {/* Gestión de Departamentos — admin + talento_humano */}
          {canManageDepts && (
            <div className="card-corporate p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="p-2 bg-[#84cc16]/10 rounded-lg text-[#65a30d]"><MdBusiness size={24} /></div>
                <div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-wider font-['Outfit']">Departamentos</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Administra los departamentos disponibles al registrar colaboradores.</p>
                </div>
              </div>

              {/* Formulario agregar */}
              <form onSubmit={handleAddDept} className="flex gap-3 mb-5">
                <input
                  type="text"
                  value={newDeptName}
                  onChange={e => setNewDeptName(e.target.value)}
                  placeholder="Nombre del nuevo departamento…"
                  className="form-input flex-1"
                  maxLength={100}
                />
                <button
                  type="submit"
                  disabled={savingDept || !newDeptName.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#84cc16] hover:bg-[#79ac34] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shrink-0"
                >
                  <MdAdd size={18} /> {savingDept ? 'Guardando…' : 'Agregar'}
                </button>
              </form>

              {/* Lista */}
              {loadingDepts ? (
                <p className="text-sm text-slate-400 text-center py-6">Cargando departamentos…</p>
              ) : departments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No hay departamentos registrados.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {departments.map(dept => (
                    <div key={dept.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white transition-all">
                      <span className="text-sm font-semibold text-slate-700">{dept.nombre}</span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteDept(dept)}
                          className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer p-1 rounded-lg hover:bg-red-50"
                          title="Eliminar departamento"
                        >
                          <MdDelete size={17} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel lateral — Mantenimiento (solo admin) */}
        {isAdmin && (
          <div className="md:col-span-4 space-y-5">
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
                <div className="flex justify-between items-center px-4 py-3.5 bg-slate-50 hover:bg-white transition-all group">
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
                      <MdUploadFile size={14} className="shrink-0" />
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
