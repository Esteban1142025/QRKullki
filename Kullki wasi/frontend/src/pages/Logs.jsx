import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api/apiClient';
import Swal from 'sweetalert2';
import { MdSearch, MdFileDownload, MdRefresh, MdPictureAsPdf, MdChevronLeft, MdChevronRight } from 'react-icons/md';

const RISK_COLORS = {
  Alto:  'badge-inactive',
  Medio: 'badge-pending',
  Bajo:  'badge-active',
};

const STATUS_COLORS = {
  Autorizado: 'badge-active',
  Denegado:   'badge-inactive',
};

const Logs = () => {
  const [logs, setLogs]             = useState([]);
  const [agencies, setAgencies]     = useState([]);
  const [areas, setAreas]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterAgency, setAgency]   = useState('ALL');
  const [filterArea, setArea]       = useState('ALL');
  const [filterStatus, setStatus]   = useState('ALL');
  const [filterRisk, setRisk]       = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, agRes, areaRes] = await Promise.all([
        apiClient.get('/audit-logs'),
        apiClient.get('/agencias'),
        apiClient.get('/areas'),
      ]);
      setLogs(logsRes.data);
      setAgencies(agRes.data);
      setAreas(areaRes.data);
    } catch (err) {
      console.error('Error al cargar bitácora:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Todas las áreas del sistema (desde la DB, no solo las que aparecen en logs)
  const allAreas = areas.map(a => a.name).sort();

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchQ = (l.name     || '').toLowerCase().includes(q) ||
                   (l.employeeId || '').toLowerCase().includes(q) ||
                   (l.id       || '').toLowerCase().includes(q) ||
                   (l.area     || '').toLowerCase().includes(q);
    return matchQ
      && (filterAgency === 'ALL' || l.agency === filterAgency)
      && (filterArea   === 'ALL' || l.area   === filterArea)
      && (filterStatus === 'ALL' || l.status === filterStatus)
      && (filterRisk   === 'ALL' || l.risk   === filterRisk);
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentLogs = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, filterAgency, filterArea, filterStatus, filterRisk]);

  const handlePrintPDF = () => {
    const now = new Date().toLocaleString('es-EC');
    const activeFilters = [
      filterAgency !== 'ALL' && `Agencia: ${agencies.find(a => a.id === filterAgency)?.name || filterAgency}`,
      filterArea   !== 'ALL' && `Área: ${filterArea}`,
      filterStatus !== 'ALL' && `Estado: ${filterStatus}`,
      filterRisk   !== 'ALL' && `Riesgo: ${filterRisk}`,
      search && `Búsqueda: "${search}"`,
    ].filter(Boolean).join(' | ') || 'Sin filtros aplicados';

    const rows = filtered.map(l => {
      const fecha = l.timestamp ? new Date(l.timestamp).toLocaleDateString('es-EC') : '—';
      const hora  = l.timestamp ? new Date(l.timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—';
      const statusColor = l.status === 'Autorizado' ? '#15803d' : '#dc2626';
      const riskColor   = l.risk   === 'Alto' ? '#dc2626' : l.risk === 'Medio' ? '#d97706' : '#15803d';
      return `
        <tr>
          <td style="font-family:monospace;font-size:10px;color:#64748b">${l.id}</td>
          <td>${fecha}<br><span style="font-size:9px;color:#94a3b8">${hora}</span></td>
          <td><strong>${l.name || 'Desconocido'}</strong><br><span style="font-size:9px;color:#94a3b8;font-family:monospace">${l.employeeId || 'N/A'}</span></td>
          <td>${l.area || '—'}<br><span style="font-size:9px;color:#94a3b8">${l.device || '—'}</span></td>
          <td style="text-align:center">${l.agency || '—'}</td>
          <td style="text-align:center"><span style="color:${statusColor};font-weight:700;font-size:10px">${(l.status || '—').toUpperCase()}</span></td>
          <td style="text-align:center"><span style="color:${riskColor};font-weight:700;font-size:10px">${l.risk || '—'}</span></td>
        </tr>`;
    }).join('');

    const win = window.open('', '_blank', 'width=1100,height=750');
    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Bitácora Kullki Wasi — ${now}</title>
  <style>
    @page { size: A4 landscape; margin: 1.5cm 1cm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; background:#fff; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; padding-bottom:12px; border-bottom:2px solid #e2e8f0; }
    .brand { display:flex; align-items:center; gap:10px; }
    .brand-text .name { font-size:16px; font-weight:900; color:#1e293b; letter-spacing:.05em; }
    .brand-text .sub  { font-size:9px;  color:#8DC63F; text-transform:uppercase; font-weight:700; letter-spacing:.1em; }
    .meta { text-align:right; font-size:9px; color:#94a3b8; line-height:1.6; }
    .meta strong { color:#475569; }
    .filters { font-size:9px; color:#64748b; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:6px 10px; margin-bottom:14px; }
    .filters strong { color:#334155; }
    .summary { display:flex; gap:12px; margin-bottom:14px; }
    .kpi { flex:1; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; text-align:center; }
    .kpi .num { font-size:20px; font-weight:900; }
    .kpi .lbl { font-size:8px; text-transform:uppercase; letter-spacing:.06em; color:#94a3b8; font-weight:600; margin-top:2px; }
    table { width:100%; border-collapse:collapse; }
    thead tr { background:#1e293b; color:#fff; }
    thead th { padding:8px 10px; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; text-align:left; white-space:nowrap; }
    tbody tr:nth-child(even) { background:#f8fafc; }
    tbody tr:hover { background:#f1f5f9; }
    tbody td { padding:7px 10px; font-size:10px; border-bottom:1px solid #e2e8f0; vertical-align:middle; }
    .footer { margin-top:16px; padding-top:10px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:8px; color:#94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-text">
        <div class="name">KULLKI WASI</div>
        <div class="sub">Cooperativa de Ahorro y Crédito</div>
      </div>
    </div>
    <div class="meta">
      <strong>Bitácora Institucional de Accesos</strong><br>
      Generado: ${now}<br>
      Registros mostrados: ${filtered.length} de ${logs.length}
    </div>
  </div>

  <div class="filters"><strong>Filtros aplicados:</strong> ${activeFilters}</div>

  <div class="summary">
    <div class="kpi"><div class="num" style="color:#1e293b">${filtered.length}</div><div class="lbl">Total</div></div>
    <div class="kpi"><div class="num" style="color:#15803d">${filtered.filter(l=>l.status==='Autorizado').length}</div><div class="lbl">Autorizados</div></div>
    <div class="kpi"><div class="num" style="color:#dc2626">${filtered.filter(l=>l.status==='Denegado').length}</div><div class="lbl">Denegados</div></div>
    <div class="kpi"><div class="num" style="color:#d97706">${filtered.filter(l=>l.risk==='Alto').length}</div><div class="lbl">Riesgo Alto</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>ID</th><th>Fecha / Hora</th><th>Colaborador</th>
        <th>Área / Dispositivo</th><th>Agencia</th><th>Estado</th><th>Riesgo</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:20px;color:#94a3b8">Sin registros</td></tr>'}</tbody>
  </table>

  <div class="footer">
    <span>Cooperativa Kullki Wasi Ltda. — Sistema de Control de Accesos y Trazabilidad</span>
    <span>Documento generado automáticamente — ${now}</span>
  </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const handleRefresh = async () => {
    await loadLogs();
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
          const csv = '﻿' + [headers.join(','), ...rows].join('\n');
          const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
          const a = Object.assign(document.createElement('a'), { href: url, download: `trazabilidad_kullki_wasi_${new Date().toISOString().slice(0,10)}.csv` });
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);
          Swal.fire({ icon: 'success', title: 'Reporte descargado', text: 'Archivo CSV guardado en su dispositivo.', confirmButtonColor: '#8DC63F', background: '#0d1424', color: '#f1f5f9' });
        }, 1000);
      },
    });
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 font-['Outfit']">Bitácora Institucional de Accesos</h2>
          <p className="text-xs text-slate-500 mt-0.5">Trazabilidad completa y auditoría centralizada del flujo de personal.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="btn-icon" title="Refrescar">
            <MdRefresh size={18} />
          </button>
          <button onClick={handleExport} className="btn-secondary" disabled={logs.length === 0}>
            <MdFileDownload size={16} className="text-[#79ac34]" />
            Exportar CSV
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer shadow-md shrink-0"
            style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}
          >
            <MdPictureAsPdf size={17} />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Total Registros', logs.length, 'text-slate-800'],
          ['Autorizados', logs.filter(l => l.status === 'Autorizado').length, 'text-emerald-600'],
          ['Denegados', logs.filter(l => l.status === 'Denegado').length, 'text-red-600'],
          ['Riesgo Alto', logs.filter(l => l.risk === 'Alto').length, 'text-orange-600'],
        ].map(([label, val, color]) => (
          <div key={label} className="card-corporate p-4">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-black font-['Outfit'] mt-0.5 ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="card-corporate p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="space-y-1">
          <label className="form-label flex items-center gap-1">
            <MdSearch size={14} /> Buscar
          </label>
          <input
            type="text"
            placeholder="Nombre, ID, código o área..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-1">
          <label className="form-label">Agencia</label>
          <select value={filterAgency} onChange={e => setAgency(e.target.value)} className="w-full">
            <option value="ALL">Todas las Agencias</option>
            {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="form-label">Área</label>
          <select value={filterArea} onChange={e => setArea(e.target.value)} className="w-full">
            <option value="ALL">Todas las Áreas</option>
            {allAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="form-label">Estado</label>
          <select value={filterStatus} onChange={e => setStatus(e.target.value)} className="w-full">
            <option value="ALL">Todos</option>
            <option value="Autorizado">Autorizado</option>
            <option value="Denegado">Denegado</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="form-label">Nivel de Riesgo</label>
          <select value={filterRisk} onChange={e => setRisk(e.target.value)} className="w-full">
            <option value="ALL">Todos</option>
            <option value="Bajo">Bajo</option>
            <option value="Medio">Medio</option>
            <option value="Alto">Alto</option>
          </select>
        </div>
      </div>

      <div className="card-corporate overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs data-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['ID', 'Fecha / Hora', 'Colaborador', 'Área / Dispositivo', 'Agencia', 'Estado', 'Riesgo'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-[#8DC63F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Cargando bitácora...
                  </td>
                </tr>
              ) : currentLogs.length > 0 ? currentLogs.map(log => (
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
                    <span className={`badge ${STATUS_COLORS[log.status] ?? ''}`}>{log.status}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`badge ${RISK_COLORS[log.risk] ?? RISK_COLORS.Bajo}`}>{log.risk}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <p className="font-medium">No hay registros de trazabilidad disponibles.</p>
                    <p className="text-xs mt-1">Los accesos QR escaneados aparecerán aquí automáticamente.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
          <span>Mostrando <strong className="text-slate-700">{currentLogs.length}</strong> de <strong className="text-slate-700">{filtered.length}</strong> registros</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-icon disabled:opacity-50">
              <MdChevronLeft size={16} />
            </button>
            <span className="px-2 font-bold text-slate-700">Página {currentPage} de {totalPages || 1}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="btn-icon disabled:opacity-50">
              <MdChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logs;
