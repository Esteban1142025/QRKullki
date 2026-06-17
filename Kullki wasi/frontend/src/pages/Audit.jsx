import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import apiClient from '../services/api/apiClient';
import {
  MdVerifiedUser, MdCheckCircle, MdSecurity, MdAssessment,
  MdPlayCircleFilled, MdClose, MdWarning, MdAssignmentLate,
  MdHistory, MdPictureAsPdf, MdDescription, MdLightbulbOutline,
  MdTimeline, MdArrowForward, MdShield, MdPeople, MdLock, MdRefresh,
} from 'react-icons/md';
import { readEvents } from '../utils/eventLogger';

const fmtEvent = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (diffDays === 1) return 'Ayer';
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Genera recomendaciones dinámicas en base a métricas reales
const buildRecommendations = (data) => {
  if (!data) return [];
  const { kpis, alerts } = data;
  const recs = [];

  if (alerts.open > 0)
    recs.push(`Hay ${alerts.open} alerta(s) abiertas sin gestionar. Atender en la Consola de Alertas.`);
  if (alerts.investigating > 0)
    recs.push(`${alerts.investigating} alerta(s) en investigación pendientes de cierre formal.`);
  if (kpis.risk_level > 20)
    recs.push(`Nivel de riesgo elevado (${kpis.risk_level}%). Revisar permisos de roles y políticas de acceso.`);
  else if (kpis.risk_level > 5)
    recs.push(`Monitorear accesos denegados (${kpis.risk_level}%). Verificar identidad de usuarios con rechazos reiterados.`);
  if (kpis.compliance_score < 90)
    recs.push(`Puntuación de cumplimiento (${kpis.compliance_score}%) bajo el umbral recomendado del 90%. Auditar políticas.`);
  if (kpis.active_areas < 2)
    recs.push('Pocas áreas críticas registradas. Considerar ampliar las zonas de monitoreo físico.');
  if (kpis.active_devices === 0)
    recs.push('No hay dispositivos de escaneo activos. Verificar conectividad de los lectores QR.');
  recs.push('Verificar que los respaldos automáticos de base de datos estén al día.');
  if (recs.length < 4)
    recs.push('Revisar y actualizar credenciales administrativas del sistema con regularidad.');

  return recs.slice(0, 5);
};

const Audit = () => {
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showReport, setShowReport]     = useState(false);
  const [auditReport, setAuditReport]   = useState(null);
  const [runningAudit, setRunningAudit] = useState(false);
  const [recentEvents, setRecentEvents] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // Intentar el endpoint dedicado primero
      const res = await apiClient.get('/audit/dashboard');
      setDashData(res.data);
    } catch {
      // Fallback: derivar métricas de los endpoints existentes en paralelo
      try {
        const [alertsRes, logsRes] = await Promise.allSettled([
          apiClient.get('/security/alerts'),
          apiClient.get('/audit-logs'),
        ]);

        const alertsList = alertsRes.status === 'fulfilled' ? alertsRes.value.data : [];
        const logsList   = logsRes.status === 'fulfilled'   ? logsRes.value.data   : [];

        const openAlerts    = alertsList.filter(a => a.status === 'ABIERTA').length;
        const investigating = alertsList.filter(a => a.status === 'EN_INVESTIGACION').length;
        const resolved      = alertsList.filter(a => a.status === 'RESUELTA').length;

        const totalLogs   = logsList.length;
        const concedidos  = logsList.filter(l => l.status === 'Autorizado').length;
        const denegados   = logsList.filter(l => l.status === 'Denegado').length;
        const compliance  = totalLogs > 0 ? Math.round(concedidos / totalLogs * 1000) / 10 : 100.0;
        const riskLevel   = totalLogs > 0 ? Math.round(denegados  / totalLogs * 1000) / 10 : 0.0;

        // Agrupar logs por mes para el gráfico (últimos 6 meses)
        const now = new Date();
        const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const monthly_chart = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          const y = d.getFullYear();
          const m = d.getMonth();
          const monthLogs = logsList.filter(l => {
            const ld = new Date(l.timestamp);
            return ld.getFullYear() === y && ld.getMonth() === m;
          });
          const mc = monthLogs.filter(l => l.status === 'Autorizado').length;
          const md = monthLogs.length - mc;
          return {
            month: monthNames[m],
            year: y,
            value: monthLogs.length > 0 ? Math.round(mc / monthLogs.length * 1000) / 10 : null,
            total: monthLogs.length,
            concedidos: mc,
            denegados: md,
          };
        });

        // Historial: últimas alertas resueltas
        const resolved_history = alertsList
          .filter(a => a.status === 'RESUELTA')
          .slice(0, 10)
          .map(a => ({ id: a.id, date: a.date || a.timestamp, type: a.type, area: a.area, status: 'Resuelta' }));

        setDashData({
          kpis: {
            compliance_score: compliance,
            risk_level:       riskLevel,
            total_logs:       totalLogs,
            concedidos,
            denegados,
            active_areas:     0,
            total_areas:      0,
            active_employees: 0,
            total_roles:      0,
            active_devices:   0,
          },
          alerts: { total: alertsList.length, open: openAlerts, investigating, resolved },
          monthly_chart,
          resolved_history,
        });
      } catch (fallbackErr) {
        console.error('Error al cargar datos de auditoría:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    const load = () => setRecentEvents(readEvents().slice(0, 5));
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const runSystemAudit = async () => {
    setRunningAudit(true);
    try {
      const res = await apiClient.get('/audit/dashboard');
      setDashData(res.data);
      const d = res.data;
      const report = {
        timestamp:        new Date().toISOString(),
        score:            `${d.kpis.compliance_score} / 100`,
        totalLogs:        d.kpis.total_logs,
        concedidos:       d.kpis.concedidos,
        denegados:        d.kpis.denegados,
        activeAreas:      d.kpis.active_areas,
        activeEmployees:  d.kpis.active_employees,
        openAlerts:       d.alerts.open,
        riskLevel:        d.kpis.risk_level,
        findings: [
          ...(d.alerts.open > 0 ? [{ type: 'warning', code: 'SEC-ALT-OPEN', text: `${d.alerts.open} alerta(s) de seguridad abiertas sin gestionar.` }] : []),
          ...(d.alerts.investigating > 0 ? [{ type: 'warning', code: 'SEC-ALT-INV', text: `${d.alerts.investigating} alerta(s) en investigación pendientes de resolución.` }] : []),
          ...(d.kpis.risk_level > 20 ? [{ type: 'warning', code: 'ACC-RISK-HIGH', text: `Nivel de accesos denegados: ${d.kpis.risk_level}%. Supera el umbral recomendado del 20%.` }] : []),
          { type: 'info', code: 'ACC-TOTAL', text: `Total de registros en bitácora: ${d.kpis.total_logs} (${d.kpis.concedidos} autorizados, ${d.kpis.denegados} denegados).` },
          { type: 'info', code: 'AREA-MON', text: `${d.kpis.active_areas} de ${d.kpis.total_areas} área(s) crítica(s) activas y monitoreadas.` },
          { type: 'info', code: 'EMP-ACTIVE', text: `${d.kpis.active_employees} empleados activos registrados en el sistema.` },
          ...(d.kpis.compliance_score >= 90 ? [{ type: 'info', code: 'COMPLIANCE-OK', text: `Puntuación de cumplimiento del ${d.kpis.compliance_score}% — nivel satisfactorio.` }] : [{ type: 'warning', code: 'COMPLIANCE-LOW', text: `Cumplimiento del ${d.kpis.compliance_score}% — por debajo del umbral del 90%.` }]),
        ],
      };
      setAuditReport(report);
      setShowReport(true);
      Swal.fire({
        icon: 'success', title: 'Auditoría Completada',
        text: `Cumplimiento: ${d.kpis.compliance_score}% — Nivel de riesgo: ${d.kpis.risk_level}%`,
        timer: 2000, showConfirmButton: false,
        background: '#ffffff', color: '#1e293b',
      });
    } catch {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo ejecutar la auditoría. Verifique la conexión.' });
    } finally {
      setRunningAudit(false);
    }
  };

  const handleExportPDF = () => {
    if (!dashData) return;
    const { kpis, alerts, monthly_chart, resolved_history } = dashData;
    const now = new Date().toLocaleString('es-EC');

    const monthRows = monthly_chart.map(m =>
      `<tr><td>${m.month} ${m.year}</td><td>${m.total}</td><td class="ok">${m.concedidos}</td><td class="${m.denegados > 0 ? 'rev' : 'ok'}">${m.denegados}</td><td class="${m.value !== null ? (m.value >= 90 ? 'ok' : 'obs') : ''}">${m.value !== null ? m.value + '%' : '—'}</td></tr>`
    ).join('');

    const alertRows = resolved_history.length > 0
      ? resolved_history.map(h => `<tr><td>${fmtDate(h.date)}</td><td>${h.type}</td><td>${h.area}</td><td class="ok">Resuelta</td></tr>`).join('')
      : '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Sin incidentes resueltos</td></tr>';

    const recs = buildRecommendations(dashData);

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Auditoría KULLKI WASI</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;padding:32px;color:#1e293b;font-size:13px}
.hdr{border-bottom:3px solid #7dc12e;padding-bottom:14px;margin-bottom:22px}
.hdr h1{font-size:17px;color:#3a6a0a;font-weight:900}.hdr p{font-size:10px;color:#64748b;margin-top:3px}
h2{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin:18px 0 9px}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:4px}
.kpi{border:1px solid #e2e8f0;border-radius:7px;padding:11px}
.kpi-label{font-size:9px;text-transform:uppercase;color:#94a3b8;font-weight:700;margin-bottom:3px}
.kpi-value{font-size:20px;font-weight:900;color:#7dc12e}.kpi-sub{font-size:10px;color:#64748b;margin-top:2px}
.findings{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.finding{border:1px solid #e2e8f0;border-radius:6px;padding:9px 13px;display:flex;justify-content:space-between;align-items:center;font-size:11px}
table{width:100%;border-collapse:collapse;font-size:11px;margin-top:4px}
th{background:#f8fafc;text-align:left;padding:7px 11px;font-size:9px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0;letter-spacing:.05em}
td{padding:7px 11px;border-bottom:1px solid #f1f5f9}tr:nth-child(even) td{background:#fafafa}
.ok{color:#16a34a;font-weight:700}.obs{color:#d97706;font-weight:700}.rev{color:#dc2626;font-weight:700}
ul{padding-left:16px;margin-top:4px}li{font-size:11px;margin-bottom:5px;line-height:1.5}
.footer{margin-top:36px;font-size:9px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:11px}
@media print{body{padding:16px}@page{margin:18mm}}
</style></head><body>
<div class="hdr"><h1>🛡️ KULLKI WASI — Informe de Auditoría y Cumplimiento SEPS</h1><p>Generado el: ${now} &nbsp;·&nbsp; Sistema: Kullki Wasi Control Corporativo</p></div>
<h2>Indicadores Clave</h2>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-label">Cumplimiento</div><div class="kpi-value">${kpis.compliance_score}%</div><div class="kpi-sub">${kpis.total_logs} registros evaluados</div></div>
  <div class="kpi"><div class="kpi-label">Nivel de Riesgo</div><div class="kpi-value" style="color:${kpis.risk_level > 20 ? '#dc2626' : kpis.risk_level > 5 ? '#d97706' : '#16a34a'}">${kpis.risk_level}%</div><div class="kpi-sub">${kpis.denegados} accesos denegados</div></div>
  <div class="kpi"><div class="kpi-label">Áreas Monitoreadas</div><div class="kpi-value" style="color:#1e293b">${kpis.active_areas}/${kpis.total_areas}</div><div class="kpi-sub">áreas críticas activas</div></div>
  <div class="kpi"><div class="kpi-label">Empleados Activos</div><div class="kpi-value" style="color:#1e293b">${kpis.active_employees}</div><div class="kpi-sub">${kpis.total_roles} roles configurados</div></div>
</div>
<h2>Hallazgos de Auditoría</h2>
<div class="findings">
  <div class="finding"><span>Alertas abiertas</span><span class="${alerts.open > 0 ? 'obs' : 'ok'}">${alerts.open}</span></div>
  <div class="finding"><span>En investigación</span><span class="${alerts.investigating > 0 ? 'obs' : 'ok'}">${alerts.investigating}</span></div>
  <div class="finding"><span>Alertas resueltas</span><span class="ok">${alerts.resolved}</span></div>
</div>
<h2>Evolución Mensual de Cumplimiento</h2>
<table><thead><tr><th>Período</th><th>Total Accesos</th><th>Autorizados</th><th>Denegados</th><th>Cumplimiento</th></tr></thead>
<tbody>${monthRows}</tbody></table>
<h2>Incidentes Resueltos Recientes</h2>
<table><thead><tr><th>Fecha</th><th>Tipo de Alerta</th><th>Área</th><th>Estado</th></tr></thead>
<tbody>${alertRows}</tbody></table>
<h2>Recomendaciones del Sistema</h2>
<ul>${recs.map(r => `<li>${r}</li>`).join('')}</ul>
<div class="footer">Kullki Wasi Control Corporativo · Informe generado automáticamente el ${now}</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

    const win = window.open('', '_blank', 'width=960,height=720');
    win.document.write(html);
    win.document.close();
  };

  const handleExportExcel = () => {
    if (!dashData) return;
    const { kpis, alerts, monthly_chart, resolved_history } = dashData;
    const now = new Date().toISOString().slice(0, 10);
    const recs = buildRecommendations(dashData);

    const rows = [
      ['KULLKI WASI — Informe de Auditoría y Cumplimiento SEPS'],
      [`Generado el: ${new Date().toLocaleString('es-EC')}`],
      [],
      ['INDICADORES CLAVE'],
      ['Indicador', 'Valor', 'Detalle'],
      ['Puntuación de Cumplimiento', `${kpis.compliance_score}%`, `${kpis.total_logs} registros evaluados`],
      ['Nivel de Riesgo', `${kpis.risk_level}%`, `${kpis.denegados} accesos denegados`],
      ['Áreas Críticas Activas', `${kpis.active_areas} / ${kpis.total_areas}`, 'áreas monitoreadas'],
      ['Empleados Activos', kpis.active_employees, `${kpis.total_roles} roles configurados`],
      ['Dispositivos Activos', kpis.active_devices, 'lectores QR operativos'],
      [],
      ['HALLAZGOS DE ALERTAS DE SEGURIDAD'],
      ['Estado', 'Cantidad'],
      ['Alertas Abiertas', alerts.open],
      ['En Investigación', alerts.investigating],
      ['Alertas Resueltas', alerts.resolved],
      ['Total Alertas', alerts.total],
      [],
      ['EVOLUCIÓN MENSUAL DE CUMPLIMIENTO'],
      ['Período', 'Total Accesos', 'Autorizados', 'Denegados', 'Cumplimiento (%)'],
      ...monthly_chart.map(m => [
        `${m.month} ${m.year}`, m.total, m.concedidos, m.denegados,
        m.value !== null ? m.value : 'Sin datos',
      ]),
      [],
      ['INCIDENTES RESUELTOS RECIENTES'],
      ['Fecha', 'Tipo de Alerta', 'Área', 'Estado'],
      ...(resolved_history.length > 0
        ? resolved_history.map(h => [fmtDate(h.date), h.type, h.area, 'Resuelta'])
        : [['Sin incidentes resueltos', '', '', '']]),
      [],
      ['RECOMENDACIONES DEL SISTEMA'],
      ['#', 'Recomendación'],
      ...recs.map((r, i) => [i + 1, r]),
    ];

    const csv = rows
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `auditoria_kullki_wasi_${now}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const recommendations = buildRecommendations(dashData);
  const kpis   = dashData?.kpis   ?? {};
  const alerts = dashData?.alerts  ?? {};
  const chart  = dashData?.monthly_chart   ?? [];
  const history = dashData?.resolved_history ?? [];

  const riskColor = kpis.risk_level > 20 ? 'text-red-500' : kpis.risk_level > 5 ? 'text-orange-500' : 'text-emerald-500';
  const riskLabel = kpis.risk_level > 20 ? 'Riesgo Alto' : kpis.risk_level > 5 ? 'Riesgo Medio' : 'Riesgo Bajo';
  const compColor = (kpis.compliance_score ?? 100) >= 90 ? 'text-[#8DC63F]' : (kpis.compliance_score ?? 100) >= 75 ? 'text-orange-500' : 'text-red-500';

  const lockStatus    = (alerts.open ?? 0) === 0 ? 'Operativo' : 'Comprometido';
  const lockColor     = (alerts.open ?? 0) === 0 ? 'text-emerald-500' : 'text-red-500';
  const lockBg        = (alerts.open ?? 0) === 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500';
  const lockSubLabel  = (alerts.open ?? 0) === 0 ? 'Sin alertas críticas activas' : `${alerts.open} alerta(s) requieren atención`;

  const chartMax = Math.max(...chart.map(d => d.total), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#8DC63F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-sm font-medium">Cargando consola de auditoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-slate-800 font-['Outfit']">Consola de Auditoría y Cumplimiento SEPS</h2>
          <p className="text-xs text-slate-500 mt-0.5">Supervise el cumplimiento normativo, controle los registros de auditoría y verifique el estado de las políticas institucionales.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={loadDashboard} className="btn-icon" title="Actualizar datos">
            <MdRefresh size={18} />
          </button>
          <button onClick={() => setShowExportModal(true)} disabled={!dashData} className="btn-secondary whitespace-nowrap disabled:opacity-40">
            <MdDescription size={16} className="text-slate-600" /> IMPRIMIR REPORTES
          </button>
          <button onClick={runSystemAudit} disabled={runningAudit} className="btn-primary whitespace-nowrap disabled:opacity-50">
            {runningAudit
              ? <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
              : <MdPlayCircleFilled size={18} />}
            {runningAudit ? 'ANALIZANDO...' : 'EJECUTAR AUDITORÍA'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="card-corporate p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Puntuación Compliance</span>
            <div className={`text-2xl font-black font-['Outfit'] ${compColor}`}>
              {dashData ? `${kpis.compliance_score}%` : '—'}
            </div>
            <span className="text-[10px] text-slate-500">{kpis.total_logs ?? 0} registros evaluados</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#8DC63F]/15 flex items-center justify-center text-[#79ac34]">
            <MdVerifiedUser size={28} />
          </div>
        </div>

        <div className="card-corporate p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Áreas Monitoreadas</span>
            <div className="text-2xl font-black text-slate-800 font-['Outfit']">
              {dashData ? `${kpis.active_areas} / ${kpis.total_areas}` : '—'}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold">{kpis.active_devices ?? 0} dispositivos activos</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <MdLock size={28} />
          </div>
        </div>

        <div className="card-corporate p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Estado de Alertas</span>
            <div className={`text-2xl font-black font-['Outfit'] ${lockColor}`}>
              {dashData ? lockStatus : '—'}
            </div>
            <span className="text-[10px] text-slate-500">{lockSubLabel}</span>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lockBg}`}>
            <MdSecurity size={28} />
          </div>
        </div>

        <div className="card-corporate p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Nivel de Riesgo</span>
            <div className={`text-2xl font-black font-['Outfit'] ${riskColor}`}>
              {dashData ? `${kpis.risk_level}%` : '—'}
            </div>
            <span className={`text-[10px] font-bold ${riskColor}`}>{riskLabel}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <MdWarning size={28} />
          </div>
        </div>

      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — chart + table */}
        <div className="lg:col-span-2 space-y-6">

          {/* Gráfico mensual */}
          <div className="card-corporate p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
              <MdTimeline className="text-[#8DC63F]" size={20} />
              Evolución de Cumplimiento — últimos 6 meses
            </h3>
            <p className="text-[10px] text-slate-400 mb-5 ml-7">% de accesos autorizados sobre el total de registros en bitácora</p>

            {chart.every(d => d.total === 0) ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm font-medium">
                <div className="text-center space-y-2">
                  <MdHistory size={32} className="mx-auto opacity-20" />
                  <p>Sin registros de bitácora aún</p>
                </div>
              </div>
            ) : (
              <div className="flex items-end justify-between h-48 pt-4 pb-2 px-2 border-b border-slate-100">
                {chart.map((d, i) => {
                  const heightPct = d.total === 0 ? 4 : ((d.value ?? 0) / 100) * 100;
                  const barColor = d.value === null
                    ? 'bg-slate-200'
                    : d.value >= 90 ? 'bg-gradient-to-t from-[#8DC63F]/80 to-[#a3d65b]'
                    : d.value >= 70 ? 'bg-gradient-to-t from-orange-400 to-orange-300'
                    : 'bg-gradient-to-t from-red-400 to-red-300';
                  return (
                    <div key={i} className="flex flex-col items-center gap-3 w-full h-full justify-end">
                      <div className="w-full max-w-[48px] bg-slate-50 rounded-t-xl relative group flex flex-col justify-end h-full">
                        <div className={`w-full rounded-t-xl transition-all duration-500 ${barColor}`} style={{ height: `${heightPct}%` }} />
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-opacity shadow-lg z-10 pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">
                          {d.value !== null ? `${d.value}%` : 'Sin datos'}
                          <br /><span className="font-normal text-[10px] text-slate-300">{d.total} accesos</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 font-bold uppercase">{d.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabla: resumen mensual de accesos */}
          <div className="card-corporate overflow-hidden">
            <div className="p-6 pb-2">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <MdHistory className="text-[#8DC63F]" size={20} />
                Resumen Mensual de Accesos
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Período</th>
                    <th>Total Accesos</th>
                    <th>Autorizados</th>
                    <th>Denegados</th>
                    <th>Cumplimiento</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.length > 0 ? chart.map((row, i) => (
                    <tr key={i}>
                      <td className="font-mono text-xs font-bold">{row.month} {row.year}</td>
                      <td className="font-mono text-xs">{row.total}</td>
                      <td className="font-mono text-xs text-emerald-600 font-bold">{row.concedidos}</td>
                      <td className={`font-mono text-xs font-bold ${row.denegados > 0 ? 'text-red-500' : 'text-slate-400'}`}>{row.denegados}</td>
                      <td className="font-mono text-xs font-black">
                        {row.value !== null
                          ? <span className={row.value >= 90 ? 'text-emerald-600' : row.value >= 70 ? 'text-orange-500' : 'text-red-500'}>{row.value}%</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td>
                        {row.total === 0
                          ? <span className="badge badge-inactive">Sin datos</span>
                          : row.value >= 90
                            ? <span className="badge badge-active">Óptimo</span>
                            : row.value >= 70
                              ? <span className="badge badge-pending">Observación</span>
                              : <span className="badge badge-inactive">Crítico</span>}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" className="text-center text-slate-400 py-8 text-sm">Sin datos disponibles</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Hallazgos */}
          <div className="card-corporate p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <MdAssignmentLate className="text-amber-500" size={20} />
              Hallazgos de Auditoría
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Alertas abiertas</span>
                <span className={`text-sm font-black ${(alerts.open ?? 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{alerts.open ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-600 font-medium">En investigación</span>
                <span className={`text-sm font-black ${(alerts.investigating ?? 0) > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>{alerts.investigating ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Alertas resueltas</span>
                <span className="text-sm font-black text-emerald-500">{alerts.resolved ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-600 font-medium">Empleados activos</span>
                <span className="text-sm font-black text-slate-700">{kpis.active_employees ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Eventos Recientes */}
          <div className="card-corporate p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <MdHistory className="text-blue-500" size={20} />
              Eventos Recientes
            </h3>
            {recentEvents.length > 0 ? (
              <div className="space-y-3.5">
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${evt.action === 'granted' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 leading-snug truncate">
                        {evt.action === 'granted' ? 'Permiso otorgado: ' : 'Permiso revocado: '}
                        <span className="font-bold">{evt.permissionLabel}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {fmtEvent(evt.timestamp)} · {evt.roleName} · {evt.by}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-medium space-y-1">
                <MdShield size={28} className="mx-auto opacity-20 mb-2" />
                Sin eventos registrados aún.
                <p className="text-[10px] text-slate-300">Los cambios de permisos en Roles y Permisos aparecerán aquí.</p>
              </div>
            )}
            <Link
              to="/events"
              className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-bold text-[#65a30d] border border-[#84cc16]/40 bg-[#84cc16]/8 hover:bg-[#84cc16]/15 transition-all"
            >
              Ver todos los eventos <MdArrowForward size={14} />
            </Link>
          </div>

          {/* Recomendaciones dinámicas */}
          <div className="card-corporate p-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <MdLightbulbOutline className="text-[#8DC63F]" size={20} />
              Sugerencias del Sistema
            </h3>
            {recommendations.length > 0 ? (
              <ul className="space-y-3">
                {recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <MdLightbulbOutline className="text-amber-500 shrink-0 mt-0.5" size={14} />
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                <MdCheckCircle size={28} className="mx-auto opacity-20 mb-2 text-emerald-500" />
                Sistema sin observaciones pendientes.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal Reporte */}
      {showReport && auditReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <MdAssessment className="text-[#8DC63F]" size={20} />
                <span className="text-xs font-black uppercase tracking-wider font-['Outfit']">Informe de Cumplimiento Normativo</span>
              </div>
              <button onClick={() => setShowReport(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <MdClose size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Índice de Cumplimiento:</span>
                  <span className={`text-xl font-black font-['Outfit'] ${compColor}`}>{auditReport.score}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Nivel de Riesgo:</span>
                  <span className={`text-xl font-black font-['Outfit'] ${riskColor}`}>{auditReport.riskLevel}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Accesos Evaluados:</span>
                  <span className="text-lg font-black text-slate-700 font-['Outfit']">{auditReport.totalLogs} registros</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Alertas Abiertas:</span>
                  <span className={`text-lg font-black font-['Outfit'] ${auditReport.openAlerts > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{auditReport.openAlerts}</span>
                </div>
                <div className="col-span-2 pt-3 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                  Análisis ejecutado: <span className="text-slate-600 font-bold">{new Date(auditReport.timestamp).toLocaleString('es-EC')}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Hallazgos y Diagnósticos</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {auditReport.findings.map((f, i) => (
                    <div key={i} className={`p-3.5 rounded-xl border text-xs flex gap-3 items-start ${
                      f.type === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                    }`}>
                      <span className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${
                        f.type === 'warning' ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>{f.code}</span>
                      <p className="leading-relaxed text-[11px]">{f.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <button onClick={() => setShowReport(false)} className="btn-secondary">Cerrar Diagnóstico</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <MdDescription className="text-[#8DC63F]" size={20} />
                <span className="text-xs font-black uppercase tracking-wider font-['Outfit']">Generar Reportes</span>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <MdClose size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">Seleccione un rango de fechas para generar el reporte:</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Inicio</label>
                  <input type="date" value={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate(''); }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#8DC63F] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Fin (Opcional)</label>
                  <input type="date" value={endDate}
                    min={startDate || undefined}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#8DC63F] outline-none" />
                </div>
              </div>
              {startDate && endDate && endDate < startDate && (
                <p className="text-[11px] text-red-500 font-medium">La fecha fin no puede ser anterior a la fecha inicio.</p>
              )}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-2">
                <button
                  onClick={() => { handleExportPDF(); setShowExportModal(false); }}
                  disabled={!startDate || (!!endDate && endDate < startDate)}
                  className="btn-secondary text-red-500 disabled:opacity-40"
                >
                  <MdPictureAsPdf size={16} /> Exportar PDF
                </button>
                <button
                  onClick={() => { handleExportExcel(); setShowExportModal(false); }}
                  disabled={!startDate || (!!endDate && endDate < startDate)}
                  className="btn-secondary text-green-600 disabled:opacity-40"
                >
                  <MdDescription size={16} /> Exportar Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Audit;
