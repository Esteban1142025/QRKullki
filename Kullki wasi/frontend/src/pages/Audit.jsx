import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  MdVerifiedUser, MdCheckCircle, MdSecurity, MdAssessment,
  MdPlayCircleFilled, MdClose, MdWarning, MdAssignmentLate,
  MdHistory, MdPictureAsPdf, MdDescription, MdLightbulbOutline,
  MdTimeline
} from 'react-icons/md';

// Mock Data
const MOCK_FINDINGS = {
  observations: 2,
  pending: 1,
  critical: 0
};

const MOCK_EVENTS = [
  { id: 1, time: '10:45 AM', action: 'Inicio de sesión administrativo', user: 'Admin' },
  { id: 2, time: '09:30 AM', action: 'Actualización de políticas', user: 'Oficial de Cumplimiento' },
  { id: 3, time: 'Ayer', action: 'Generación de reportes', user: 'Auditor Externo' },
  { id: 4, time: 'Ayer', action: 'Cambio de permisos', user: 'Admin' },
  { id: 5, time: 'Ayer', action: 'Activación de locks de emergencia (Prueba)', user: 'Oficial Riesgos' }
];

const MOCK_HISTORY = [
  { id: 1, date: '01/06/2026', responsible: 'Auditor Interno', result: '98.5%', status: 'Aprobado' },
  { id: 2, date: '15/05/2026', responsible: 'Oficial Riesgos', result: '92.0%', status: 'Observación' },
  { id: 3, date: '01/05/2026', responsible: 'Auditor Externo', result: '85.5%', status: 'Revisión requerida' },
  { id: 4, date: '15/04/2026', responsible: 'Auditor Interno', result: '99.0%', status: 'Aprobado' },
];

const MOCK_CHART_DATA = [
  { month: 'Ene', value: 85 },
  { month: 'Feb', value: 88 },
  { month: 'Mar', value: 82 },
  { month: 'Abr', value: 99 },
  { month: 'May', value: 92 },
  { month: 'Jun', value: 98.5 },
];

const MOCK_RECOMMENDATIONS = [
  "Revisar usuarios inactivos con más de 30 días sin acceso.",
  "Actualizar credenciales administrativas del sistema central.",
  "Verificar respaldos recientes de la base de datos de auditoría.",
  "Revisar permisos asignados a nuevos roles dinámicos."
];

const Audit = () => {
  const [showReport, setShowReport] = useState(false);
  const [auditReport, setAuditReport] = useState(null);
  const [runningAudit, setRunningAudit] = useState(false);

  const runSystemAudit = () => {
    setRunningAudit(true);

    setTimeout(() => {
      const report = {
        timestamp: new Date().toISOString(),
        score: "98.5 / 100",
        policiesEvaluated: 45,
        status: "Cumplimiento Alto",
        findings: [
          { type: 'warning', text: 'Se detectaron 2 usuarios con permisos administrativos inactivos por más de 30 días.', code: 'POL-USR-02' },
          { type: 'info', text: 'Las políticas de control de acceso (RBAC) se encuentran actualizadas y operativas.', code: 'SYS-RBAC-OK' },
          { type: 'info', text: 'Registros de bitácora almacenados correctamente con firma criptográfica.', code: 'LOG-INT-OK' }
        ]
      };
      setAuditReport(report);
      setRunningAudit(false);
      setShowReport(true);

      Swal.fire({
        icon: 'success',
        title: 'Auditoría Completa',
        text: 'Se compiló el informe de cumplimiento de la Cooperativa.',
        timer: 1500,
        showConfirmButton: false,
        background: '#0d1424',
        color: '#f1f5f9'
      });
    }, 1500);
  };

  const handleExport = (type) => {
    Swal.fire({
      icon: 'info',
      title: `Exportando ${type}`,
      text: 'Preparando documento para descarga...',
      timer: 1500,
      showConfirmButton: false,
      background: '#0d1424',
      color: '#f1f5f9'
    });
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 font-['Outfit']">Consola de Auditoría y Cumplimiento SEPS</h2>
          <p className="text-xs text-slate-500 mt-0.5">Supervise el cumplimiento normativo, controle los registros de auditoría y verifique el estado de las políticas institucionales.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => handleExport('PDF')} className="btn-secondary">
            <MdPictureAsPdf size={16} className="text-red-500" /> <span className="hidden sm:inline">EXPORTAR</span> PDF
          </button>
          <button onClick={() => handleExport('Excel')} className="btn-secondary">
            <MdDescription size={16} className="text-green-600" /> <span className="hidden sm:inline">EXPORTAR</span> EXCEL
          </button>
          <button onClick={runSystemAudit} disabled={runningAudit} className="btn-primary disabled:opacity-50 shrink-0">
            {runningAudit ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
            ) : (
              <MdPlayCircleFilled size={18} />
            )}
            {runningAudit ? 'ANALIZANDO...' : 'EJECUTAR AUDITORÍA'}
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="card-corporate p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Puntuación Compliance</span>
            <div className="text-2xl font-black text-[#8DC63F] font-['Outfit']">98.5%</div>
            <span className="text-[10px] text-slate-500">Excelente nivel de integridad</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#8DC63F]/15 flex items-center justify-center text-[#79ac34]">
            <MdVerifiedUser size={28} />
          </div>
        </div>

        <div className="card-corporate p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Requisitos SEPS</span>
            <div className="text-2xl font-black text-slate-800 font-['Outfit']">6 / 6</div>
            <span className="text-[10px] text-emerald-600 font-bold">Políticas activadas</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <MdCheckCircle size={28} />
          </div>
        </div>

        <div className="card-corporate p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Locks de Emergencia</span>
            <div className="text-2xl font-black text-slate-800 font-['Outfit']">Operativo</div>
            <span className="text-[10px] text-slate-500">Exclusas de seguridad listas</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <MdSecurity size={28} />
          </div>
        </div>

        <div className="card-corporate p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Nivel de Riesgo</span>
            <div className="text-2xl font-black text-emerald-500 font-['Outfit']">12%</div>
            <span className="text-[10px] text-emerald-600 font-bold">Riesgo Bajo</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <MdWarning size={28} />
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
           {/* Gráfico Histórico */}
           <div className="card-corporate p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                <MdTimeline className="text-[#8DC63F]" size={20}/> 
                Evolución de Cumplimiento
              </h3>
              {/* CSS Bar Chart */}
              <div className="flex items-end justify-between h-48 pt-4 pb-2 px-2 border-b border-slate-100">
                 {MOCK_CHART_DATA.map((d, i) => (
                   <div key={i} className="flex flex-col items-center gap-3 w-full h-full justify-end">
                     <div className="w-full max-w-[48px] bg-slate-50 rounded-t-xl relative group flex flex-col justify-end h-full">
                        <div 
                          className="w-full bg-gradient-to-t from-[#8DC63F]/80 to-[#a3d65b] rounded-t-xl transition-all duration-500 group-hover:from-[#79ac34] group-hover:to-[#8DC63F]" 
                          style={{ height: `${d.value}%` }}
                        ></div>
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-opacity shadow-lg z-10 pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-slate-800">
                          {d.value}%
                        </div>
                     </div>
                     <span className="text-[11px] text-slate-500 font-bold uppercase">{d.month}</span>
                   </div>
                 ))}
              </div>
           </div>

           {/* Tabla Historial */}
           <div className="card-corporate overflow-hidden">
              <div className="p-6 pb-2">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MdHistory className="text-[#8DC63F]" size={20}/> 
                  Historial de Auditorías
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Responsable</th>
                      <th>Resultado</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_HISTORY.map((row) => (
                      <tr key={row.id}>
                        <td className="font-mono text-xs">{row.date}</td>
                        <td className="font-medium">{row.responsible}</td>
                        <td className="font-mono font-bold">{row.result}</td>
                        <td>
                          <span className={`badge ${
                            row.status === 'Aprobado' ? 'badge-active' : 
                            row.status === 'Observación' ? 'badge-pending' : 
                            'badge-inactive'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>

        {/* Right Column (1 span) */}
        <div className="space-y-6">
           
           {/* Hallazgos */}
           <div className="card-corporate p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <MdAssignmentLate className="text-amber-500" size={20}/> 
                Hallazgos de Auditoría
              </h3>
              <div className="space-y-3">
                 <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                   <span className="text-xs text-slate-600 font-medium">Observaciones</span>
                   <span className="text-sm font-black text-amber-500">{MOCK_FINDINGS.observations}</span>
                 </div>
                 <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                   <span className="text-xs text-slate-600 font-medium">Recomendaciones pendientes</span>
                   <span className="text-sm font-black text-blue-500">{MOCK_FINDINGS.pending}</span>
                 </div>
                 <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                   <span className="text-xs text-slate-600 font-medium">Incidentes críticos</span>
                   <span className="text-sm font-black text-emerald-500">{MOCK_FINDINGS.critical}</span>
                 </div>
              </div>
           </div>

           {/* Eventos Recientes */}
           <div className="card-corporate p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <MdHistory className="text-blue-500" size={20}/> 
                Eventos Recientes
              </h3>
              <div className="space-y-4">
                {MOCK_EVENTS.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                    <div>
                      <p className="text-xs font-medium text-slate-700">{event.action}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{event.time} • {event.user}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           {/* Recomendaciones Automáticas */}
           <div className="card-corporate p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <MdLightbulbOutline className="text-[#8DC63F]" size={20}/> 
                Sugerencias del Sistema
              </h3>
              <ul className="space-y-3">
                {MOCK_RECOMMENDATIONS.map((rec, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <MdLightbulbOutline className="text-amber-500 shrink-0 mt-0.5" size={14}/>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
           </div>

        </div>
      </div>

      {/* Modal Reporte de Auditoría */}
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
                  <span className="text-xl font-black text-[#8DC63F] font-['Outfit']">{auditReport.score}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Políticas Evaluadas:</span>
                  <span className="text-xl font-black text-slate-700 font-['Outfit']">{auditReport.policiesEvaluated} Controles</span>
                </div>
                <div className="col-span-2 pt-3 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                  Fecha de Análisis: <span className="text-slate-600 font-bold">{new Date(auditReport.timestamp).toLocaleString('es-EC')}</span>
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
                      }`}>
                        {f.code}
                      </span>
                      <p className="leading-relaxed text-[11px]">{f.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowReport(false)}
                  className="btn-secondary"
                >
                  Cerrar Diagnóstico
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
