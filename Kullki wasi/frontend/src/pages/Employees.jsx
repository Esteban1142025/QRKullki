import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../data/mockData';
import apiClient from '../services/api/apiClient';
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2';
import {
  MdSearch, MdAdd, MdEdit, MdDelete, MdQrCode,
  MdClose, MdSave, MdPrint, MdPeople, MdBadge, MdRefresh
} from 'react-icons/md';

const DEPARTMENTS = [
  'Tecnología e Información', 'Talento Humano', 'Gestión de Riesgos',
  'Seguridad y Vigilancia', 'Auditoría Interna', 'Operaciones Financieras',
  'Caja y Servicios', 'Negocios y Microcrédito', 'Administración General',
];

const BLANK_FORM = {
  id: '', id_empleado: null, dni: '', name: '', role: 'empleado',
  department: 'Caja y Servicios', agency: 'MAT', email: '', phone: '',
  status: 'Activo', hireDate: '',
};

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch]         = useState('');
  const [filterAgency, setFilterAgency] = useState('ALL');
  const [filterDept, setFilterDept]   = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showForm, setShowForm]       = useState(false);
  const [showQR, setShowQR]           = useState(false);
  const [editing, setEditing]         = useState(null);
  const [qrEmployee, setQrEmployee]   = useState(null);
  const [form, setForm]               = useState(BLANK_FORM);

  const fireSwal = (opts) => Swal.fire({ background: '#0d1424', color: '#f1f5f9', ...opts });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, agRes, rolRes] = await Promise.all([
        apiClient.get('/empleados'),
        apiClient.get('/agencias'),
        apiClient.get('/roles'),
      ]);
      setEmployees(empRes.data);
      setAgencies(agRes.data);
      setRoles(rolRes.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      fireSwal({ icon: 'error', title: 'Error de conexión', text: 'No se pudo cargar la información desde el servidor.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchQ = (e.name || '').toLowerCase().includes(q) ||
                   (e.dni || '').includes(q) ||
                   (e.id || '').toLowerCase().includes(q);
    return matchQ
      && (filterAgency === 'ALL' || e.agency === filterAgency)
      && (filterDept   === 'ALL' || e.department === filterDept)
      && (filterStatus === 'ALL' || e.status === filterStatus);
  });

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const openAdd = () => {
    setForm({ ...BLANK_FORM, hireDate: new Date().toISOString().split('T')[0] });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (emp) => {
    setForm({
      id: emp.id,
      id_empleado: emp.id_empleado,
      dni: emp.dni,
      name: emp.name,
      role: emp.role,
      department: emp.department || 'Caja y Servicios',
      agency: emp.agency || 'MAT',
      email: emp.email || '',
      phone: emp.phone || '',
      status: emp.status,
      hireDate: emp.hireDate || '',
    });
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
    }).then(async res => {
      if (res.isConfirmed) {
        try {
          await apiClient.delete(`/empleados/${emp.id_empleado}`);
          await fetchData();
          fireSwal({ icon: 'success', title: 'Registro eliminado', timer: 1400, showConfirmButton: false });
        } catch (err) {
          fireSwal({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'No se pudo eliminar el colaborador.' });
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.dni || !form.name || !form.email) {
      fireSwal({ icon: 'error', title: 'Campos requeridos', text: 'Cédula, Nombre y Correo son obligatorios.' });
      return;
    }

    const parts = form.name.trim().split(' ');
    const nombres = parts[0];
    const apellidos = parts.slice(1).join(' ') || parts[0];

    const agencyObj = agencies.find(a => a.id === form.agency);
    const id_agencia_base = agencyObj ? agencyObj.id_agencia : 1;

    const roleObj = roles.find(r => r.name === form.role);
    const role_ids = roleObj ? [roleObj.id] : [];

    const payload = {
      identificacion: form.dni,
      nombres,
      apellidos,
      email: form.email,
      id_agencia_base,
      departamento: form.department,
      estado_laboral: form.status === 'Activo' ? 'ACTIVO' : 'INACTIVO',
      role_ids,
    };

    try {
      if (editing) {
        await apiClient.put(`/empleados/${editing.id_empleado}`, payload);
      } else {
        await apiClient.post('/empleados', payload);
      }
      await fetchData();
      setShowForm(false);
      fireSwal({
        icon: 'success',
        title: editing ? 'Actualizado' : 'Guardado',
        text: `Expediente de ${form.name} registrado.`,
        timer: 1600, showConfirmButton: false
      });
    } catch (err) {
      fireSwal({ icon: 'error', title: 'Error', text: err.response?.data?.detail || 'Error al guardar el expediente.' });
    }
  };

  const field = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#8DC63F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Cargando colaboradores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 font-['Outfit']">Expedientes de Colaboradores</h2>
          <p className="text-xs text-slate-500 mt-0.5">Administre el personal, cargos, departamentos y credenciales QR de acceso.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-icon" title="Actualizar">
            <MdRefresh size={18} />
          </button>
          <button onClick={openAdd} className="btn-primary shrink-0">
            <MdAdd size={16} />
            AGREGAR COLABORADOR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Total', employees.length, 'text-slate-800'],
          ['Activos', employees.filter(e => e.status === 'Activo').length, 'text-emerald-600'],
          ['Inactivos', employees.filter(e => e.status !== 'Activo').length, 'text-red-500'],
          ['Agencias', new Set(employees.map(e => e.agency)).size, 'text-[#79ac34]'],
        ].map(([label, val, color]) => (
          <div key={label} className="card-corporate p-4 flex items-center gap-3">
            <MdPeople size={20} className="text-slate-500 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{label}</p>
              <p className={`text-xl font-black font-['Outfit'] ${color}`}>{val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card-corporate p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="lg:col-span-2 space-y-1">
          <label className="form-label">Buscar</label>
          <input type="text" placeholder="Nombre, cédula o ID..." value={search} onChange={e => setSearch(e.target.value)} className="w-full" />
        </div>
        <div className="space-y-1">
          <label className="form-label">Agencia</label>
          <select value={filterAgency} onChange={e => setFilterAgency(e.target.value)} className="w-full">
            <option value="ALL">Todas</option>
            {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="form-label">Departamento</label>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="w-full">
            <option value="ALL">Todos</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="form-label">Estado</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full">
            <option value="ALL">Todos</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="card-corporate overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {['Colaborador', 'Cédula / ID', 'Cargo', 'Sucursal', 'Estado', 'QR', 'Acciones'].map(h => (
                  <th key={h} className={h === 'QR' || h === 'Acciones' ? 'text-center' : ''}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(emp => {
                const role = ROLES[emp.role] ?? { name: emp.role, badgeColor: 'bg-slate-100 text-slate-500 border-slate-200' };
                return (
                  <tr key={emp.id}>
                    <td>
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
                    <td className="font-mono">
                      <p className="text-slate-700">{emp.dni}</p>
                      <p className="text-[10px] text-slate-500">{emp.id}</p>
                    </td>
                    <td>
                      <p className="text-slate-800 font-semibold">{emp.department}</p>
                      <span className={`inline-block mt-0.5 text-[8px] font-bold uppercase px-1.5 py-0.25 rounded border ${role.badgeColor}`}>
                        {role.name}
                      </span>
                    </td>
                    <td className="text-slate-600">
                      {emp.agency === 'MAT' ? 'Matriz' : emp.agencyName || emp.agency}
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'Activo' ? 'badge-active' : 'badge-inactive'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <button onClick={() => { setQrEmployee(emp); setShowQR(true); }} className="btn-icon text-[#8DC63F]">
                        <MdQrCode size={16} />
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEdit(emp)} className="btn-icon">
                          <MdEdit size={13} />
                        </button>
                        <button onClick={() => handleDelete(emp)} className="btn-icon text-red-500 hover:text-red-600 hover:bg-red-50 border-transparent">
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

      {/* MODAL: FORM */}
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
                    <label className="form-label">{label}</label>
                    <input type={type} placeholder={ph} value={form[key]} onChange={e => field(key, e.target.value)} className="form-input" />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="form-label">Rol de Sistema</label>
                  <select value={form.role} onChange={e => field('role', e.target.value)} className="form-input">
                    {roles.length > 0
                      ? roles.map(r => <option key={r.id} value={r.name}>{ROLES[r.name]?.name || r.name}</option>)
                      : Object.entries(ROLES).map(([id, r]) => <option key={id} value={id}>{r.name}</option>)
                    }
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="form-label">Departamento</label>
                  <select value={form.department} onChange={e => field('department', e.target.value)} className="form-input">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="form-label">Agencia Asignada</label>
                  <select value={form.agency} onChange={e => field('agency', e.target.value)} className="form-input">
                    {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="form-label">Estado Laboral</label>
                  <select value={form.status} onChange={e => field('status', e.target.value)} className="form-input">
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">
                  <MdSave size={16} /> Guardar Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR CREDENTIAL */}
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
              <div className="print-area w-full p-5 rounded-2xl bg-white border border-slate-200 flex flex-col items-center gap-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 w-full">
                  <img src="https://play-lh.googleusercontent.com/G-uc06_SBqaE8a-M7JKQCD-Hpfkvxb1g9X3VPmyngldtTRS-pr69QPW_4zDBe9_6qEw" alt="Logo" className="w-7 h-7 rounded-lg shadow-sm object-cover border border-slate-100" />
                  <div>
                    <p className="text-[10px] font-black text-[#79ac34] tracking-widest uppercase leading-none">KULLKI WASI</p>
                    <p className="text-[8px] text-slate-500 uppercase">Credencial de Acceso</p>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-md border border-slate-100">
                  <QRCodeSVG value={qrEmployee.qrCode ?? 'KW-NO-QR'} size={150} fgColor="#1e293b" level="H" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800 text-sm">{qrEmployee.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{qrEmployee.department}</p>
                  <span className="inline-block mt-1.5 text-[9px] bg-slate-100 text-[#79ac34] font-mono px-2 py-0.5 rounded border border-slate-200 font-bold uppercase">
                    {qrEmployee.id}
                  </span>
                </div>
                <div className="w-full text-center space-y-1">
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-slate-500">
                    <span>Emisión:</span>
                    <span className="font-bold text-slate-700">{qrEmployee.hireDate ? new Date(qrEmployee.hireDate).toLocaleDateString('es-EC') : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[8px] uppercase tracking-wider text-slate-500">
                    <span>Estado:</span>
                    <span className={`font-bold ${qrEmployee.status === 'Activo' ? 'text-[#8DC63F]' : 'text-red-500'}`}>{qrEmployee.status}</span>
                  </div>
                </div>
                <div className="w-full pt-3 border-t border-slate-100 text-center">
                  <p className="text-[8px] text-slate-400 font-mono break-all">{qrEmployee.qrCode}</p>
                </div>
              </div>
              <button onClick={() => window.print()} className="btn-secondary w-full justify-center">
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
