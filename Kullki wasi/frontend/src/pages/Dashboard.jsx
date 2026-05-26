import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EMPLOYEES, ACCESS_LOGS, SECURITY_ALERTS, QR_DEVICES } from '../data/mockData';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell
} from 'recharts';
import {
  MdSupervisedUserCircle,
  MdCheckCircle,
  MdWarning,
  MdRouter,
  MdSecurity,
  MdSensors,
  MdReceiptLong,
  MdArrowForward,
  MdTrendingUp
} from 'react-icons/md';
import { Link } from 'react-router-dom';

const accessTimeData = [
  { time: '07:00', Autorizados: 12, Denegados: 1 },
  { time: '08:00', Autorizados: 45, Denegados: 3 },
  { time: '09:00', Autorizados: 30, Denegados: 2 },
  { time: '10:00', Autorizados: 22, Denegados: 5 },
  { time: '11:00', Autorizados: 28, Denegados: 1 },
  { time: '12:00', Autorizados: 15, Denegados: 0 },
  { time: '13:00', Autorizados: 18, Denegados: 0 },
  { time: '14:00', Autorizados: 25, Denegados: 2 },
  { time: '15:00', Autorizados: 20, Denegados: 1 },
  { time: '16:00', Autorizados: 10, Denegados: 0 },
];

const agencyData = [
  { name: 'Matriz',      Accesos: 154, Alertas: 2 },
  { name: 'Pelileo',     Accesos: 48,  Alertas: 0 },
  { name: 'Píllaro',     Accesos: 32,  Alertas: 2 },
  { name: 'Baños',       Accesos: 28,  Alertas: 1 },
  { name: 'Salcedo',     Accesos: 18,  Alertas: 1 },
  { name: 'Quisapincha', Accesos: 12,  Alertas: 0 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel border border-slate-700/60 rounded-xl p-3 text-xs shadow-2xl">
        <p className="font-bold text-slate-300 mb-1.5">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-400">{p.name}:</span>
            <span className="font-bold text-slate-200">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const KPICard = ({ label, value, sub, subColor = 'text-slate-400', icon: Icon, iconBg, iconColor }) => (
  <div className="p-5 rounded-2xl glass-panel border border-slate-800/70 flex items-center justify-between glass-panel-hover cursor-default">
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">{label}</span>
      <div className="text-2xl font-black text-slate-100 font-['Outfit']">{value}</div>
      <span className={`text-[11px] font-semibold ${subColor}`}>{sub}</span>
    </div>
    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} shrink-0`}>
      <Icon size={26} />
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState(ACCESS_LOGS);
  const activeAlertsCount = SECURITY_ALERTS.filter(a => !a.isResolved).length;
  const onlineDevicesCount = QR_DEVICES.filter(d => d.status === 'Online').length;
  const activeEmployees   = EMPLOYEES.filter(e => e.status === 'Activo').length;

  useEffect(() => {
    const raw = localStorage.getItem('kw_dynamic_logs');
    if (raw) {
      try { setLogs([...JSON.parse(raw), ...ACCESS_LOGS]); } catch (_) {}
    }
  }, []);

  return (
    <div className="space-y-6">

      {/* ── WELCOME BANNER ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl glass-panel border border-[#8DC63F]/15 p-6">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#8DC63F]/4 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#0d2347]/60 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-[#8DC63F] font-bold uppercase tracking-widest mb-1">Cooperativa Kullki Wasi — Segmento 1</p>
            <h2 className="text-xl md:text-2xl font-black text-slate-100 font-['Outfit'] leading-tight">
              Panel de Control de Accesos
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
              Bienvenido, <strong className="text-slate-200">{user?.name}</strong>. Operando como{' '}
              <strong className="text-[#8DC63F]">{user?.roleName}</strong> ·{' '}
              <strong className="text-[#8DC63F]">{user?.agency === 'MAT' ? 'Matriz Ambato' : user?.agency}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#070b13]/60 px-4 py-2 rounded-xl border border-[#8DC63F]/20 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8DC63F] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8DC63F]" />
            </span>
            <span className="text-xs font-bold text-[#8DC63F] uppercase tracking-wide">Sistemas en Línea</span>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Personal"
          value={EMPLOYEES.length}
          sub={`${activeEmployees} colaboradores activos`}
          subColor="text-[#8DC63F]"
          icon={MdSupervisedUserCircle}
          iconBg="bg-[#8DC63F]/10"
          iconColor="text-[#8DC63F]"
        />
        <KPICard
          label="Accesos Registrados"
          value={logs.length}
          sub="100% validados por QR"
          subColor="text-emerald-400"
          icon={MdCheckCircle}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-400"
        />
        <KPICard
          label="Incidentes Críticos"
          value={activeAlertsCount}
          sub="Requieren atención"
          subColor={activeAlertsCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'}
          icon={MdWarning}
          iconBg="bg-red-500/10"
          iconColor="text-red-400"
        />
        <KPICard
          label="Terminales QR"
          value={`${onlineDevicesCount}/${QR_DEVICES.length}`}
          sub={`${QR_DEVICES.length - onlineDevicesCount} offline`}
          subColor="text-slate-400"
          icon={MdRouter}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-400"
        />
      </div>

      {/* ── CHARTS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Área chart - flujo por hora */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800/70">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <MdTrendingUp size={16} className="text-[#8DC63F]" />
                Frecuencia de Accesos del Día
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Flujos autorizados vs. denegados por hora</p>
            </div>
            <div className="flex gap-3">
              {[['#8DC63F', 'Autorizados'], ['#ef4444', 'Denegados']].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={accessTimeData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="gAuth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8DC63F" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8DC63F" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="gDeny" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Autorizados" stroke="#8DC63F" strokeWidth={2} fill="url(#gAuth)" dot={false} />
                <Area type="monotone" dataKey="Denegados"   stroke="#ef4444" strokeWidth={2} fill="url(#gDeny)"   dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart - agencias */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800/70">
          <div className="mb-5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <MdRouter size={16} className="text-[#8DC63F]" />
              Actividad por Sucursal
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Comparativa de accesos y alertas entre agencias</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agencyData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px', color: '#94a3b8' }} />
                <Bar dataKey="Accesos" radius={[4, 4, 0, 0]}>
                  {agencyData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#0d2347' : '#163668'} />
                  ))}
                </Bar>
                <Bar dataKey="Alertas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── RECENT LOGS + SECURITY CHECKLIST ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Logs recientes */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass-panel border border-slate-800/70 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Trazabilidad Reciente</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Flujo en tiempo real de validaciones QR</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Link to="/logs" className="text-[10px] text-[#8DC63F] hover:underline font-semibold">
                Ver todos <MdArrowForward size={12} className="inline" />
              </Link>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-72 flex-1 pr-1">
            {logs.slice(0, 7).map((log) => {
              const ok = log.status === 'Autorizado';
              const initials = log.name.split(' ').map(n => n[0]).slice(0, 2).join('');
              return (
                <div
                  key={log.id}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs border transition-all ${
                    ok ? 'bg-slate-900/40 border-slate-800/40' : 'bg-red-950/8 border-red-500/15'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-200 truncate">{log.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{log.area} · {log.agency}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      ok
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-red-500/15 text-red-400 border border-red-500/25'
                    }`}>
                      {log.status}
                    </span>
                    <p className="text-[9px] text-slate-600 mt-1 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security checklist */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800/70 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Cumplimiento SEPS</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Estado de políticas institucionales activas</p>
            </div>

            {[
              { icon: MdSecurity,    label: 'Control RBAC Activo',        desc: 'Módulos dinámicos por rol en tiempo real.' },
              { icon: MdSensors,     label: 'Dispositivos QR Cifrados',   desc: 'Terminales con latidos y firma hash.' },
              { icon: MdReceiptLong, label: 'Bitácora Inalterable',       desc: 'Cada validación genera trazabilidad auditada.' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                <div className="w-8 h-8 rounded-lg bg-[#8DC63F]/10 flex items-center justify-center text-[#8DC63F] shrink-0">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-300">{label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-800/60 text-center">
            <p className="text-[10px] text-slate-500 font-medium">Cooperativa Kullki Wasi Ltda.</p>
            <p className="text-[9px] text-[#8DC63F] font-bold uppercase tracking-wider mt-0.5">Segmento Financiero 1 — Ecuador</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
