import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ACCESS_LOGS, AGENCIES } from '../data/mockData';
import Swal from 'sweetalert2';
import { MdSearch, MdFileDownload, MdRefresh, MdFilterList } from 'react-icons/md';

const RISK_COLORS = {
  Alto:  'bg-red-50 text-red-600 border-red-200',
  Medio: 'bg-orange-50 text-orange-600 border-orange-200',
  Bajo:  'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_COLORS = {
  Autorizado: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Denegado:   'bg-red-50 text-red-600 border-red-200',
};

const Logs = () => {
  const { user } = useAuth();
  const [logs, setLogs]             = useState([]);
  const [search, setSearch]         = useState('');
  const [filterAgency, setAgency]   = useState('ALL');
  const [filterStatus, setStatus]   = useState('ALL');
  const [filterRisk, setRisk]       = useState('ALL');

  const loadLogs = useCallback(() => {
    try {
      const dyn = localStorage.getItem('kw_dynamic_logs');
      const dynamic = dyn ? JSON.parse(dyn) : [];
      // Deduplicate by id
      const seen = new Set();
      const merged = [...dynamic, ...ACCESS_LOGS].filter(l => {
        if (seen.has(l.id)) return false;
        seen.add(l.id); return true;
      });
      setLogs(merged);
    } catch { setLogs(ACCESS_LOGS); }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchQ = l.name.toLowerCase().includes(q) || l.employeeId.toLowerCase().includes(q) || (l.id ?? '').toLowerCase().includes(q);
    return matchQ
      && (filterAgency === 'ALL' || l.agency === filterAgency)
      && (filterStatus === 'ALL' || l.status === filterStatus)
      && (filterRisk   === 'ALL' || l.risk   === filterRisk);
  });

  const handleRefresh = () => {
    loadLogs();
    Swal.fire({ icon: 'success', title: 'Bitácora sincronizada', timer: 900, showConfirmButton: false, background: '#0d1424', color: '#f1f5f9' });
  };

  const handleExport = () => {
    Swal.fire({
      title: 'Generando reporte…', allowOutsideClick: false,
      background: '#0d1424', color: '#f1f5f9',
      didOpen: () => {
        Swal.showLoading();
        setTimeout(() => {
          const headers = ['ID Bitácora','Timestamp','ID Colaborador','Nombre','Cargo','Agencia','Área','Dispositivo','Estado','Detalle','Riesgo'];
          const rows = filtered.map(l => [
            l.id, l.timestamp, l.employeeId, l.name, l.role,
            l.agency, l.area, l.device, l.status, l.details, l.risk,
          ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));

          const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
          const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
          const a   = Object.assign(document.createElement('a'), { href: url, download: `trazabilidad_kullki_wasi_${new Date().toISOString().slice(0,10)}.csv` });
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);

          Swal.fire({ icon: 'success', title: 'Reporte descargado', text: 'Archivo CSV guardado en su dispositivo.', confirmButtonColor: '#8DC63F', background: '#0d1424', color: '#f1f5f9' });
        }, 1000);
      },
    });
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 font-['Outfit']">Bitácora Institucional de Accesos</h2>
          <p className="text-xs text-slate-500 mt-0.5">Trazabilidad completa y auditoría centralizada del flujo de personal.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-[#79ac34] transition-all cursor-pointer shadow-sm"
            title="Refrescar">
            <MdRefresh size={18} />
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#79ac34] rounded-xl text-xs font-bold text-slate-700 tracking-wider transition-all cursor-pointer shadow-sm">
            <MdFileDownload size={16} className="text-[#79ac34]" />
            EXPORTAR CSV
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Total Registros', logs.length, 'text-slate-800'],
          ['Autorizados', logs.filter(l => l.status === 'Autorizado').length, 'text-emerald-600'],
          ['Denegados', logs.filter(l => l.status === 'Denegado').length, 'text-red-600'],
          ['Riesgo Alto', logs.filter(l => l.risk === 'Alto').length, 'text-orange-600'],
        ].map(([label, val, color]) => (
          <div key={label} className="p-3.5 rounded-xl glass-panel border border-slate-200">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-black font-['Outfit'] mt-0.5 ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl glass-panel border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <MdSearch size={12} /> Buscar
          </label>
          <div className="relative">
            <MdSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <input type="text" placeholder="Nombre, ID o código..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Agencia</label>
          <select value={filterAgency} onChange={e => setAgency(e.target.value)}>
            <option value="ALL">Todas las Agencias</option>
            {AGENCIES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estado</label>
          <select value={filterStatus} onChange={e => setStatus(e.target.value)}>
            <option value="ALL">Todos</option>
            <option value="Autorizado">Autorizado</option>
            <option value="Denegado">Denegado</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nivel de Riesgo</label>
          <select value={filterRisk} onChange={e => setRisk(e.target.value)}>
            <option value="ALL">Todos</option>
            <option value="Bajo">Bajo</option>
            <option value="Medio">Medio</option>
            <option value="Alto">Alto</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl glass-panel border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs data-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['ID', 'Fecha / Hora', 'Colaborador', 'Área / Dispositivo', 'Agencia', 'Estado', 'Riesgo'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-600 text-[10px] whitespace-nowrap">{log.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-slate-800 font-mono">{new Date(log.timestamp).toLocaleDateString('es-EC')}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{log.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{log.employeeId}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-slate-800 truncate">{log.area}</p>
                    <p className="text-[10px] text-slate-500 truncate">{log.device}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.agency}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${STATUS_COLORS[log.status] ?? ''}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${RISK_COLORS[log.risk] ?? RISK_COLORS.Bajo}`}>
                      {log.risk}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No hay registros de trazabilidad con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[10px] text-slate-500">
          <span>Mostrando <strong className="text-slate-700">{filtered.length}</strong> de <strong className="text-slate-700">{logs.length}</strong> registros</span>
          <span className="font-mono">Kullki Wasi — Bitácora Institucional</span>
        </div>
      </div>

    </div>
  );
};

export default Logs;
