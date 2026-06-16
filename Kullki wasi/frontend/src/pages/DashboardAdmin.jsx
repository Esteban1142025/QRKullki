import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api/apiClient';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell
} from 'recharts';
import {
  MdSupervisedUserCircle, MdCheckCircle, MdWarning, MdRouter,
  MdSecurity, MdSensors, MdReceiptLong, MdArrowForward,
  MdTrendingUp, MdStore, MdBadge
} from 'react-icons/md';
import { Link } from 'react-router-dom';


const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel border border-slate-200 rounded-xl p-3 text-xs shadow-xl">
        <p className="font-bold text-slate-700 mb-1.5">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-500">{p.name}:</span>
            <span className="font-bold text-slate-800">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const KPICard = ({ label, value, sub, subColor = 'text-slate-500', icon: Icon, iconBg, iconColor, trend, trendUp, to, canAccess }) => {
  const inner = (
    <>
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
          {trend && (
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {trend} {trendUp ? '↑' : '↓'}
            </span>
          )}
        </div>
        <div className="text-5xl font-extrabold text-slate-800 font-['Outfit']">{value}</div>
        <span className={`text-[11px] font-bold ${subColor}`}>{sub}</span>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
          <Icon size={26} />
        </div>
        {canAccess && (
          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            Ver módulo <MdArrowForward size={10} />
          </span>
        )}
      </div>
    </>
  );

  if (canAccess && to) {
    return (
      <Link to={to} className="card-corporate p-8 flex items-center justify-between group hover:shadow-lg hover:border-[#84cc16]/40 hover:-translate-y-0.5 transition-all cursor-pointer">
        {inner}
      </Link>
    );
  }
  return (
    <div className="card-corporate p-8 flex items-center justify-between cursor-default">
      {inner}
    </div>
  );
};

const DashboardAdmin = () => {
  const { user } = useAuth();

  // Comprueba si el usuario puede acceder a un módulo (igual que ProtectedRoute + sidebar)
  const perms       = user?.permissions || [];
  const role        = user?.role || '';
  const isSuperUser = perms.includes('all');
  const canAccess   = (allowedRoles, allowedPermission) => {
    if (isSuperUser) return true;
    if (allowedRoles?.includes(role)) return true;
    if (allowedPermission && perms.includes(allowedPermission)) return true;
    return false;
  };

  const [employees, setEmployees] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [empRes, agRes, alertRes, logsRes] = await Promise.all([
          apiClient.get('/empleados'),
          apiClient.get('/agencias'),
          apiClient.get('/security/alerts'),
          apiClient.get('/audit-logs'),
        ]);
        setEmployees(empRes.data);
        setAgencies(agRes.data);
        setAlerts(alertRes.data);
        setLogs(logsRes.data);
      } catch (err) {
        console.error('Error al cargar dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const activeEmployees   = employees.filter(e => e.status === 'Activo').length;
  const activeAgencies    = agencies.filter(a => a.status === 'Activo').length;
  const activeAlerts      = alerts.filter(a => !a.isResolved && a.status !== 'RESUELTA').length;
  const credentialsCount  = employees.length;
  const todayStr          = new Date().toDateString();
  const accessToday       = logs.filter(l => new Date(l.timestamp).toDateString() === todayStr).length;

  // Gráfica horaria — datos reales del día actual agrupados por hora
  const hourBuckets = {};
  for (let h = 6; h <= 18; h++) {
    const key = `${String(h).padStart(2, '0')}:00`;
    hourBuckets[key] = { time: key, Autorizados: 0, Denegados: 0 };
  }
  logs
    .filter(l => new Date(l.timestamp).toDateString() === todayStr)
    .forEach(l => {
      const h = new Date(l.timestamp).getHours();
      if (h >= 6 && h <= 18) {
        const key = `${String(h).padStart(2, '0')}:00`;
        if (l.status === 'Autorizado') hourBuckets[key].Autorizados++;
        else hourBuckets[key].Denegados++;
      }
    });
  const accessTimeData = Object.values(hourBuckets);

  const agencyData = agencies.map(a => ({
    name: a.name.replace('Agencia ', '').replace('Matriz ', 'Matriz'),
    Accesos: logs.filter(l => l.agency === a.id).length,
    Alertas: alerts.filter(al => al.agency === a.id).length,
  })).filter(a => a.Accesos > 0 || a.Accesos === 0);

  return (
    <div className="space-y-6">

      {/* WELCOME BANNER */}
      <div className="card-corporate relative overflow-hidden p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#8DC63F]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#facc15]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-[#79ac34] font-bold uppercase tracking-widest mb-1">Cooperativa Kullki Wasi — Segmento 1</p>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 font-['Outfit'] leading-tight">
              Panel de Control de Accesos
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xl leading-relaxed">
              Bienvenido, <strong className="text-slate-700">{user?.name}</strong>. Operando como{' '}
              <strong className="text-[#79ac34]">{user?.roleName}</strong> ·{' '}
              <strong className="text-[#79ac34]">{user?.agencyDisplayName || user?.agencyName || (user?.agency === 'MAT' ? 'Matriz Ambato' : user?.agency)}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shrink-0 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8DC63F] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8DC63F]" />
            </span>
            <span className="text-xs font-bold text-[#8DC63F] uppercase tracking-wide">Sistemas en Línea</span>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Personal"
          value={loading ? '…' : employees.length}
          sub={`${activeEmployees} colaboradores activos`}
          subColor="text-[#8DC63F]"
          icon={MdSupervisedUserCircle}
          iconBg="bg-[#8DC63F]/10"
          iconColor="text-[#8DC63F]"
          to="/employees"
          canAccess={canAccess(['admin', 'talento_humano'], 'gestionar_usuarios')}
        />
        <KPICard
          label="Agencias Activas"
          value={loading ? '…' : activeAgencies}
          sub={`${agencies.length} en total`}
          subColor="text-blue-400"
          icon={MdStore}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-400"
          trend="Estable" trendUp={true}
          to="/agencies"
          canAccess={canAccess(['admin', 'jefe_agencia'], null)}
        />
        <KPICard
          label="Credenciales Emitidas"
          value={loading ? '…' : credentialsCount}
          sub="Códigos QR activos"
          subColor="text-orange-400"
          icon={MdBadge}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-400"
          to="/qr-scanner"
          canAccess={canAccess(['admin', 'seguridad_fisica', 'jefe_agencia', 'tecnico_ti'], 'modulo_control_qr')}
        />
        <KPICard
          label="Alertas Activas"
          value={loading ? '…' : activeAlerts}
          sub={activeAlerts > 0 ? 'Requieren atención' : 'Sin amenazas activas'}
          subColor={activeAlerts > 0 ? 'text-red-400' : 'text-emerald-400'}
          icon={activeAlerts > 0 ? MdWarning : MdCheckCircle}
          iconBg={activeAlerts > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}
          iconColor={activeAlerts > 0 ? 'text-red-400' : 'text-emerald-400'}
          to="/security"
          canAccess={canAccess(['admin', 'riesgos', 'seguridad_fisica'], 'modulo_areas_criticas')}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-corporate p-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
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
                    <stop offset="5%"  stopColor="#8DC63F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8DC63F" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gDeny" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Autorizados" stroke="#8DC63F" strokeWidth={2} fill="url(#gAuth)" dot={false} />
                <Area type="monotone" dataKey="Denegados"   stroke="#ef4444" strokeWidth={2} fill="url(#gDeny)"   dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-corporate p-8">
          <div className="mb-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MdRouter size={16} className="text-[#8DC63F]" />
              Actividad por Sucursal
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Comparativa de empleados y alertas entre agencias</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agencyData.length > 0 ? agencyData : agencies.map(a => ({ name: a.id, Empleados: employees.filter(e => e.agency === a.id).length, Alertas: 0 }))} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px', color: '#64748b' }} />
                <Bar dataKey="Accesos" radius={[6, 6, 0, 0]}>
                  {(agencyData.length > 0 ? agencyData : agencies).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#8DC63F' : '#cbd5e1'} />
                  ))}
                </Bar>
                <Bar dataKey="Alertas" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RECENT LOGS + SECURITY CHECKLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="card-corporate p-8 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Trazabilidad Reciente</h3>
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
            {logs.length > 0 ? logs.slice(0, 7).map((log) => {
              const ok = log.status === 'Autorizado';
              const initials = (log.name || 'U').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
              return (
                <div key={log.id} className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs border transition-all ${ok ? 'bg-white border-slate-200' : 'bg-red-50/50 border-red-200'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${ok ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-700 truncate">{log.name}</p>
                      <p className="text-[10px] font-medium text-slate-500 truncate">{log.area} · {log.agency}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {log.status}
                    </span>
                    <p className="text-[9px] text-slate-600 mt-1 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm font-medium">
                <p className="text-center">Sin registros de acceso aún.<br /><span className="text-xs">Los escaneos QR aparecerán aquí.</span></p>
              </div>
            )}
          </div>
        </div>

        <div className="card-corporate p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cumplimiento SEPS</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Estado de políticas institucionales activas</p>
            </div>
            {[
              { icon: MdSecurity,    label: 'Control RBAC Activo',        desc: 'Módulos dinámicos por rol en tiempo real.' },
              { icon: MdSensors,     label: 'Dispositivos QR Cifrados',   desc: 'Terminales con latidos y firma hash.' },
              { icon: MdReceiptLong, label: 'Bitácora Inalterable',       desc: 'Cada validación genera trazabilidad auditada.' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-[#8DC63F]/15 flex items-center justify-center text-[#79ac34] shrink-0">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-700">{label}</p>
                  <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 mt-2 border-t border-slate-200 text-center">
            <p className="text-[10px] text-slate-500 font-bold">Cooperativa Kullki Wasi Ltda.</p>
            <p className="text-[9px] text-[#79ac34] font-black uppercase tracking-wider mt-0.5">Segmento Financiero 1 — Ecuador</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
