import React, { useState } from 'react';
import { QR_DEVICES } from '../data/mockData';
import Swal from 'sweetalert2';
import {
  MdRouter, MdWifiTethering, MdSettingsPower,
  MdSensorsOff, MdDns
} from 'react-icons/md';

const Monitoring = () => {
  const [devices, setDevices] = useState(QR_DEVICES);
  const [isRestarting, setIsRestarting] = useState(null);

  const onlineCount = devices.filter(d => d.status === 'Online').length;
  const offlineCount = devices.length - onlineCount;

  const handleRestart = (deviceId) => {
    setIsRestarting(deviceId);
    
    setTimeout(() => {
      setDevices(prev => prev.map(d => 
        d.id === deviceId 
          ? { ...d, status: 'Online', lastPulse: new Date().toISOString() } 
          : d
      ));
      setIsRestarting(null);

      Swal.fire({
        icon: 'success',
        title: 'Reinicio Exitoso',
        text: 'El terminal QR ha sido reiniciado y se encuentra en línea.',
        timer: 1500,
        showConfirmButton: false,
        background: '#0d1424',
        color: '#f1f5f9'
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 font-['Outfit']">Monitoreo de Nodos y Red de Terminales</h2>
        <p className="text-xs text-slate-500 mt-0.5">Supervisión en tiempo real del estado de conexión y latencia de los lectores QR físicos a nivel nacional.</p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl glass-panel flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <MdDns size={26} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono mb-0.5">Total Nodos</span>
            <div className="text-2xl font-black text-slate-800 font-['Outfit']">{devices.length}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
            <MdWifiTethering size={26} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono mb-0.5">Operativos</span>
            <div className="text-2xl font-black text-emerald-600 font-['Outfit']">{onlineCount}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
            <MdSensorsOff size={26} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono mb-0.5">Desconectados</span>
            <div className="text-2xl font-black text-red-600 font-['Outfit']">{offlineCount}</div>
          </div>
        </div>

      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map(device => {
          const isOnline = device.status === 'Online';
          const restarting = isRestarting === device.id;

          return (
            <div 
              key={device.id} 
              className={`p-5 rounded-2xl glass-panel border transition-all ${
                isOnline 
                  ? 'border-slate-200 hover:border-[#8DC63F]/40' 
                  : 'border-red-300 bg-red-50 hover:border-red-400'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isOnline ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-500 animate-pulse'
                  }`}>
                    <MdRouter size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">{device.name}</h4>
                    <span className="text-[9px] text-slate-600 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                      {device.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Agencia:</span>
                  <span className="font-semibold text-slate-800">{device.agency === 'MAT' ? 'Matriz' : device.agency}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">IP Address:</span>
                  <span className="font-mono text-slate-600">{device.ip}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Último Latido:</span>
                  <span className="font-mono text-slate-600">{new Date(device.lastPulse).toLocaleTimeString('es-EC')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                    {device.status}
                  </span>
                </div>

                <button
                  onClick={() => handleRestart(device.id)}
                  disabled={restarting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#8DC63F] text-xs font-semibold text-slate-600 hover:text-[#79ac34] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {restarting ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-[#8DC63F] rounded-full animate-spin" />
                  ) : (
                    <MdSettingsPower size={14} />
                  )}
                  {restarting ? 'Rebooting...' : 'Reboot Node'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Monitoring;
