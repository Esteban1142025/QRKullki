import React from 'react';
import { AREAS } from '../data/mockData';
import { MdMap, MdVpnKey, MdAccessTime } from 'react-icons/md';

const RestrictedAreas = () => {
  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-black text-slate-100 font-['Outfit']">Zonas de Acceso Controlado</h2>
        <p className="text-xs text-slate-400 mt-0.5">Gestión de áreas físicas, perfiles autorizados y políticas de horario de la cooperativa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {AREAS.map(area => (
          <div key={area.id} className="p-5 rounded-2xl glass-panel border border-slate-800/70 glass-panel-hover flex flex-col h-full relative overflow-hidden">
            
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
              area.riskLevel === 'Crítico' ? 'bg-red-500/10' :
              area.riskLevel === 'Alto' ? 'bg-orange-500/10' :
              'bg-[#8DC63F]/5'
            }`} />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    area.riskLevel === 'Crítico' ? 'bg-red-500/10 text-red-400' :
                    area.riskLevel === 'Alto' ? 'bg-orange-500/10 text-orange-400' :
                    'bg-[#8DC63F]/10 text-[#8DC63F]'
                  }`}>
                    <MdMap />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 leading-snug">{area.name}</h3>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 mt-1 inline-block">
                      {area.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-5 mt-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span className="text-slate-500 flex items-center gap-1.5"><MdVpnKey size={14} /> Nivel Riesgo</span>
                  <span className={`font-bold uppercase tracking-wider text-[10px] ${
                    area.riskLevel === 'Crítico' ? 'text-red-400' :
                    area.riskLevel === 'Alto' ? 'text-orange-400' : 'text-emerald-400'
                  }`}>{area.riskLevel}</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span className="text-slate-500 flex items-center gap-1.5"><MdAccessTime size={14} /> Horario</span>
                  <span className="font-mono text-[#8DC63F] font-semibold">{area.schedule}</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Roles con Acceso Habilitado</p>
                <div className="flex flex-wrap gap-1.5">
                  {area.allowedRoles.map(r => (
                    <span key={r} className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      r === 'all' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      'bg-slate-900 text-slate-400 border-slate-700'
                    }`}>
                      {r === 'all' ? 'Acceso Público / Todos' : r.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        ))}
      </div>

    </div>
  );
};

export default RestrictedAreas;
