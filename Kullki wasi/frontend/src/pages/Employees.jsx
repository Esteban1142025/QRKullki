import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { EMPLOYEES, ROLES, AGENCIES } from '../data/mockData';
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2';
import {
  MdSearch, MdAdd, MdEdit, MdDelete, MdQrCode,
  MdClose, MdSave, MdPrint, MdPeople, MdBadge
} from 'react-icons/md';

const DEPARTMENTS = [
  'Tecnología e Información', 'Talento Humano', 'Gestión de Riesgos',
  'Seguridad y Vigilancia', 'Auditoría Interna', 'Operaciones Financieras',
  'Caja y Servicios', 'Negocios y Microcrédito',
];

const BLANK_FORM = {
  id: '', dni: '', name: '', role: 'empleado', department: 'Caja y Servicios',
  agency: 'MAT', email: '', phone: '', status: 'Activo',
  photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  hireDate: '',
};

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState(() => {
    try {
      const raw = localStorage.getItem('kw_dynamic_employees');
      return raw ? JSON.parse(raw) : EMPLOYEES;
    } catch { return EMPLOYEES; }
  });

  const [search, setSearch]           = useState('');
  const [filterAgency, setFilterAgency]   = useState('ALL');
  const [filterDept, setFilterDept]     = useState('ALL');
  const [filterStatus, setFilterStatus]   = useState('ALL');
  const [showForm, setShowForm]         = useState(false);
  const [showQR, setShowQR]           = useState(false);
  const [editing, setEditing]           = useState(null);   // employee being edited
  const [qrEmployee, setQrEmployee]     = useState(null);
  const [form, setForm]               = useState(BLANK_FORM);

  // ── helpers ──────────────────────────────────────
  const persist = (list) => {
    setEmployees(list);
    localStorage.setItem('kw_dynamic_employees', JSON.stringify(list));
  };

  const auditLog = (details, risk = 'Bajo') => {
    const log = {
      id: `LOG-${Date.now()}`, timestamp: new Date().toISOString(),
      employeeId: user?.id, name: user?.name, role: user?.role,
      agency: user?.agency, area: 'Módulo Personal', device: 'Navegador',
      status: 'Autorizado', details, risk,
    };
    const existing = JSON.parse(localStorage.getItem('kw_dynamic_logs') || '[]');
    localStorage.setItem('kw_dynamic_logs', JSON.stringify([log, ...existing]));
  };

  const fireSwal = (opts) => Swal.fire({ background: '#0d1424', color: '#f1f5f9', ...opts });

  // ── filters ──────────────────────────────────────
  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchQ = e.name.toLowerCase().includes(q) || e.dni.includes(q) || e.id.toLowerCase().includes(q);
    return matchQ
      && (filterAgency === 'ALL' || e.agency === filterAgency)
      && (filterDept   === 'ALL' || e.department === filterDept)
      && (filterStatus === 'ALL' || e.status === filterStatus);
  });

  const departments = [...new Set(employees.map(e => e.department))];

  // ── CRUD ─────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...BLANK_FORM, id: `KW-0${String(employees.length + 1).padStart(2, '0')}`, hireDate: new Date().toISOString().split('T')[0] });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (emp) => {
    setForm({ ...emp });
    setEditing(emp);
    setShowForm(true);
  };

  const handleDelete = (emp) => {
    fireSwal({
      title: '¿Dar de baja?',
      text: `Se eliminará a ${emp.name} del registro institucional.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    }).then(res => {
      if (res.isConfirmed) {
        persist(employees.filter(e => e.id !== emp.id));
        auditLog(`Baja del colaborador ${emp.name} (${emp.id}).`, 'Medio');
        fireSwal({ icon: 'success', title: 'Registro eliminado', timer: 1400, showConfirmButton: false });
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.dni || !form.name || !form.email) {
      fireSwal({ icon: 'error', title: 'Campos requeridos', text: 'Cédula, Nombre y Correo son obligatorios.' });
      return;
    }

    // Verificar duplicados (excluyendo al empleado actual si se está editando)
    const duplicate = employees.find(emp => 
      emp.id !== form.id && (emp.dni === form.dni || emp.email.toLowerCase() === form.email.toLowerCase())
    );
    if (duplicate) {
      fireSwal({ icon: 'error', title: 'Datos Duplicados', text: 'Ya existe otro colaborador con esta Cédula o Correo.' });
      return;
    }

    // Generar o actualizar QR Code
    const idSufix = form.id.includes('-') ? form.id.split('-')[1] : form.id;
    const qrCode = `KULLKIWASI-${form.role.toUpperCase()}-${form.dni}-${idSufix}`;
    const formWithQR = { ...form, qrCode };

    let updated;
    if (editing) {
      updated = employees.map(e => e.id === form.id ? formWithQR : e);
      auditLog(`Edición de expediente de ${form.name} (${form.id}).`);
    } else {
      updated = [formWithQR, ...employees];
      auditLog(`Alta de nuevo colaborador ${form.name} (${form.id}).`, 'Medio');
    }

    persist(updated);
    setShowForm(false);
    fireSwal({ icon: 'success', title: editing ? 'Actualizado' : 'Guardado', text: `Expediente de ${form.name} registrado.`, timer: 1600, showConfirmButton: false });
  };

  const field = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 font-['Outfit']">Expedientes de Colaboradores</h2>
          <p className="text-xs text-slate-500 mt-0.5">Administre el personal, cargos, departamentos y credenciales QR de acceso.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-[#8DC63F]/50 hover:border-[#8DC63F] rounded-xl text-xs font-bold text-slate-700 tracking-wider transition-all cursor-pointer shadow-md shrink-0">
          <MdAdd size={16} className="text-[#8DC63F]" />
          AGREGAR COLABORADOR
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Total', employees.length, 'text-slate-800'],
          ['Activos', employees.filter(e => e.status === 'Activo').length, 'text-emerald-600'],
          ['Inactivos', employees.filter(e => e.status !== 'Activo').length, 'text-red-500'],
          ['Agencias', new Set(employees.map(e => e.agency)).size, 'text-[#79ac34]'],
        ].map(([label, val, color]) => (
          <div key={label} className="p-3 rounded-xl glass-panel flex items-center gap-3">
            <MdPeople size={20} className="text-slate-500 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{label}</p>
              <p className={`text-xl font-black font-['Outfit'] ${color}`}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl glass-panel grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div className="lg:col-span-2 space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Buscar</label>
          <div className="relative">
            <MdSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input type="text" placeholder="Nombre, cédula o ID..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Agencia</label>
          <select value={filterAgency} onChange={e => setFilterAgency(e.target.value)}>
            <option value="ALL">Todas</option>
            {AGENCIES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Departamento</label>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="ALL">Todos</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estado</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="ALL">Todos</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Colaborador', 'Cédula / ID', 'Cargo', 'Sucursal', 'Estado', 'QR', 'Acciones'].map(h => (
                  <th key={h} className={`px-4 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${h === 'QR' || h === 'Acciones' ? 'text-center' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? filtered.map(emp => {
                const role = ROLES[emp.role] ?? { name: emp.role, badgeColor: 'bg-slate-100 text-slate-500 border-slate-200' };
                return (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-[#8DC63F] border border-[#8DC63F]/30 shrink-0">
                          {emp.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{emp.name}</p>
                          <p className="text-[10px] text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <p className="text-slate-700">{emp.dni}</p>
                      <p className="text-[10px] text-slate-500">{emp.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800 font-semibold">{emp.department}</p>
                      <span className={`inline-block mt-0.5 text-[8px] font-bold uppercase px-1.5 py-0.25 rounded border ${role.badgeColor}`}>
                        {role.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {emp.agency === 'MAT' ? 'Matriz' : emp.agency}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        emp.status === 'Activo'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => { setQrEmployee(emp); setShowQR(true); }}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-[#8DC63F] text-slate-400 hover:text-[#8DC63F] transition-all cursor-pointer shadow-sm">
                        <MdQrCode size={16} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEdit(emp)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 transition-all cursor-pointer shadow-sm">
                          <MdEdit size={13} />
                        </button>
                        <button onClick={() => handleDelete(emp)}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 transition-all cursor-pointer shadow-sm">
                          <MdDelete size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No se encontraron colaboradores con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-500">
          <span>Mostrando {filtered.length} de {employees.length} registros</span>
          <span>Cooperativa Kullki Wasi — Segmento 1</span>
        </div>
      </div>

      {/* ── MODAL: FORM ─────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl my-4">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 font-['Outfit'] uppercase tracking-wider">
                {editing ? 'Editar Expediente' : 'Nuevo Colaborador'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <MdClose size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Cédula de Identidad', 'dni', 'text', '1804293840'],
                  ['Nombre Completo', 'name', 'text', 'Ej: Luis Morales Quispe'],
                  ['Correo Institucional', 'email', 'email', 'lmorales@kullkiwasi.com.ec'],
                  ['Teléfono', 'phone', 'text', '0987654321'],
                ].map(([label, key, type, ph]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{label}</label>
                    <input type={type} placeholder={ph} value={form[key]} onChange={e => field(key, e.target.value)} />
                  </div>
                ))}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rol de Sistema</label>
                  <select value={form.role} onChange={e => field('role', e.target.value)}>
                    {Object.entries(ROLES).map(([id, r]) => <option key={id} value={id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Departamento</label>
                  <select value={form.department} onChange={e => field('department', e.target.value)}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Agencia Asignada</label>
                  <select value={form.agency} onChange={e => field('agency', e.target.value)}>
                    {AGENCIES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estado Laboral</label>
                  <select value={form.status} onChange={e => field('status', e.target.value)}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-all cursor-pointer">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-[#8DC63F]/50 hover:border-[#8DC63F] rounded-xl text-xs font-bold text-[#79ac34] shadow-sm transition-all cursor-pointer">
                  <MdSave size={14} /> Guardar Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: QR CREDENTIAL ────────────────────── */}
      {showQR && qrEmployee && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <MdBadge size={18} className="text-[#8DC63F]" />
                <span className="text-xs font-bold uppercase tracking-wider">Credencial de Acceso QR</span>
              </div>
              <button onClick={() => setShowQR(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <MdClose size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-5">
              {/* ID card */}
              <div className="w-full p-5 rounded-2xl bg-white border border-slate-200 flex flex-col items-center gap-4 shadow-sm relative overflow-hidden">
                {/* Brand header */}
                <div className="flex items-center gap-2 w-full">
                  <img src="https://play-lh.googleusercontent.com/G-uc06_SBqaE8a-M7JKQCD-Hpfkvxb1g9X3VPmyngldtTRS-pr69QPW_4zDBe9_6qEw" alt="Logo" className="w-7 h-7 rounded-lg shadow-sm object-cover border border-slate-100" />
                  <div>
                    <p className="text-[10px] font-black text-[#79ac34] tracking-widest uppercase leading-none">KULLKI WASI</p>
                    <p className="text-[8px] text-slate-500 uppercase">Credencial de Acceso</p>
                  </div>
                </div>

                {/* QR code */}
                <div className="p-3 bg-white rounded-xl shadow-md border border-slate-100">
                  <QRCodeSVG value={qrEmployee.qrCode ?? 'KW-NO-QR'} size={150} fgColor="#1e293b" level="H" />
                </div>

                {/* Info */}
                <div className="text-center">
                  <p className="font-bold text-slate-800 text-sm">{qrEmployee.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{qrEmployee.department}</p>
                  <span className="inline-block mt-1.5 text-[9px] bg-slate-100 text-[#79ac34] font-mono px-2 py-0.5 rounded border border-slate-200 font-bold uppercase">
                    {qrEmployee.id}
                  </span>
                </div>

                <div className="w-full pt-3 border-t border-slate-100 text-center">
                  <p className="text-[8px] text-slate-400 font-mono break-all">{qrEmployee.qrCode}</p>
                </div>
              </div>

              {/* Actions */}
              <button onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 shadow-sm transition-all cursor-pointer">
                <MdPrint size={16} className="text-[#8DC63F]" />
                Imprimir Credencial
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Employees;
