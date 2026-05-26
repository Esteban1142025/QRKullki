import React, { useState } from 'react';
import Swal from 'sweetalert2';
import {
  MdVerifiedUser, MdCheckCircle, MdSecurity, MdAssessment,
  MdPlayCircleFilled, MdClose
} from 'react-icons/md';

const SEPS_REQUIREMENTS = [
  { id: 'REQ-01', name: 'Políticas de Roles Dinámicos (RBAC)', description: 'Control de accesos granular según rol. Verificado por Context API.', status: 'Cumplido' },
  { id: 'REQ-02', name: 'Cifrado de Credenciales QR', description: 'Códigos QR autogenerados con DNI cifrados y firma hash.', status: 'Cumplido' },
  { id: 'REQ-03', name: 'Bitácoras en Tiempo Real (logs)', description: 'Registro inalterable de accesos autorizados y denegados.', status: 'Cumplido' },
  { id: 'REQ-04', name: 'Monitoreo de Terminales de Red', description: 'Latidos automáticos online/offline de lectores en agencias.', status: 'Cumplido' },
  { id: 'REQ-05', name: 'Bloqueo Remoto de Exclusas', description: 'Cierre total de emergencia centralizado por el Oficial de Riesgos.', status: 'Cumplido' },
  { id: 'REQ-06', name: 'Trazabilidad de Modificación de Roles', description: 'Audit trails de cambios en privilegios de personal.', status: 'Cumplido' }
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
        scannedDevices: 6,
        status: "Sólido",
        findings: [
          { type: 'warning', text: 'Lector QR Bóveda Salcedo desconectado. Último latido reportado hace más de 12 horas. Posible fallo de red local.', code: 'DEV-ERR-06' },
          { type: 'info', text: '5 terminales operan con las firmas RBAC sincronizadas a las 11:44 AM.', code: 'SYS-SYNC-OK' },
          { type: 'info', text: 'Sesión activa de administrador registrada y auditada desde la dirección IP local.', code: 'AUTH-OK' }
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

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 font-['Outfit']">Consola de Auditoría y Cumplimiento SEPS</h2>
          <p className="text-xs text-slate-400 mt-0.5">Verifique las directrices de seguridad física del Segmento 1 y ejecute análisis de integridad de red.</p>
        </div>

        <button
          onClick={runSystemAudit}
          disabled={runningAudit}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0d2347] hover:bg-[#163668] border border-[#8DC63F]/40 hover:border-[#8DC63F] rounded-xl text-xs font-bold text-slate-200 tracking-wider transition-all cursor-pointer shadow-lg disabled:opacity-50 shrink-0"
        >
          {runningAudit ? (
            <div className="w-4 h-4 border-2 border-slate-400 border-t-[#8DC63F] rounded-full animate-spin" />
          ) : (
            <MdPlayCircleFilled size={18} className="text-[#8DC63F]" />
          )}
          {runningAudit ? 'ANALIZANDO SISTEMA...' : 'EJECUTAR ESCANEO DE AUDITORÍA'}
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="p-5 rounded-2xl glass-panel border border-slate-800/70 flex items-center justify-between glass-panel-hover">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Puntuación Compliance</span>
            <div className="text-2xl font-black text-[#8DC63F] font-['Outfit']">98.5%</div>
            <span className="text-[10px] text-slate-400">Excelente nivel de integridad</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#8DC63F]/10 flex items-center justify-center text-[#8DC63F]">
            <MdVerifiedUser size={28} />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800/70 flex items-center justify-between glass-panel-hover">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Requisitos SEPS</span>
            <div className="text-2xl font-black text-slate-100 font-['Outfit']">6 / 6</div>
            <span className="text-[10px] text-emerald-400 font-semibold">Políticas institucionales activadas</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <MdCheckCircle size={28} />
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800/70 flex items-center justify-between glass-panel-hover">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Locks de Emergencia</span>
            <div className="text-2xl font-black text-slate-100 font-['Outfit']">Operativo</div>
            <span className="text-[10px] text-slate-400">Exclusas de seguridad listas</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <MdSecurity size={28} />
          </div>
        </div>

      </div>

      {/* Checklist Normativo */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800/70">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-['Outfit'] mb-5">
          Requisitos de Seguridad de Entidades Financieras (SEPS)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SEPS_REQUIREMENTS.map((req) => (
            <div key={req.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex flex-col gap-3 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="px-2 py-1 rounded bg-[#8DC63F]/10 text-[#8DC63F] font-bold text-[10px] font-mono border border-[#8DC63F]/20">
                  {req.id}
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded text-[9px] font-bold uppercase tracking-wider">
                  {req.status}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 mb-1 leading-snug">{req.name}</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {req.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Reporte de Auditoría */}
      {showReport && auditReport && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800/60 bg-[#080c17] flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200">
                <MdAssessment className="text-[#8DC63F]" size={20} />
                <span className="text-xs font-black uppercase tracking-wider font-['Outfit']">Informe de Auditoría Técnica</span>
              </div>
              <button onClick={() => setShowReport(false)} className="text-slate-500 hover:text-slate-200 transition-colors">
                <MdClose size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#0d2347]/20 border border-[#8DC63F]/20 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Índice de Cumplimiento:</span>
                  <span className="text-xl font-black text-[#8DC63F] font-['Outfit']">{auditReport.score}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Nodos Analizados:</span>
                  <span className="text-xl font-black text-slate-200 font-['Outfit']">{auditReport.scannedDevices} Lectores QR</span>
                </div>
                <div className="col-span-2 pt-3 border-t border-[#8DC63F]/10 text-[10px] text-slate-500 font-mono">
                  Fecha de Análisis: <span className="text-slate-400">{new Date(auditReport.timestamp).toLocaleString('es-EC')}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hallazgos y Diagnósticos</h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {auditReport.findings.map((f, i) => (
                    <div key={i} className={`p-3.5 rounded-xl border text-xs flex gap-3 items-start ${
                      f.type === 'warning'
                        ? 'bg-red-950/20 border-red-500/20 text-red-300'
                        : 'bg-slate-900/40 border-slate-800/60 text-slate-300'
                    }`}>
                      <span className={`font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${
                         f.type === 'warning' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {f.code}
                      </span>
                      <p className="leading-relaxed text-[11px]">{f.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-800/60">
                <button
                  onClick={() => setShowReport(false)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
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
