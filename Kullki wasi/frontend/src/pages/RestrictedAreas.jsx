import React from 'react';
import { AREAS } from '../data/mockData';
import { MdMap, MdVpnKey, MdAccessTime } from 'react-icons/md';

const RestrictedAreas = () => {
  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-black text-slate-800 font-['Outfit']">Zonas de Acceso Controlado</h2>
        <p className="text-sm text-slate-500 mt-1">Gestión de áreas físicas, perfiles autorizados y políticas de horario de la cooperativa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AREAS.map(area => (
          <div key={area.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-md hover:shadow-lg transition-all flex flex-col h-full relative overflow-hidden">
            
            <div className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none ${
              area.riskLevel === 'Crítico' ? 'bg-red-500/10' :
              area.riskLevel === 'Alto' ? 'bg-orange-500/10' :
              'bg-[#84cc16]/10'
            }`} />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border ${
                    area.riskLevel === 'Crítico' ? 'bg-red-50 text-red-500 border-red-100' :
                    area.riskLevel === 'Alto' ? 'bg-orange-50 text-orange-500 border-orange-100' :
                    'bg-[#84cc16]/10 text-[#65a30d] border-[#84cc16]/20'
                  }`}>
                    <MdMap />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 leading-snug">{area.name}</h3>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                      {area.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6 mt-5 text-sm font-medium">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-slate-600 flex items-center gap-2"><MdVpnKey size={16} /> Nivel Riesgo</span>
                  <span className={`font-black uppercase tracking-wider text-xs ${
                    area.riskLevel === 'Crítico' ? 'text-red-500' :
                    area.riskLevel === 'Alto' ? 'text-orange-500' : 'text-[#65a30d]'
                  }`}>{area.riskLevel}</span>
                </div>
                
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-slate-600 flex items-center gap-2"><MdAccessTime size={16} /> Horario</span>
                  <span className="font-mono text-[#84cc16] font-bold text-sm">{area.schedule}</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Roles con Acceso Habilitado</p>
                <div className="flex flex-wrap gap-2">
                  {area.allowedRoles.map(r => (
                    <span key={r} className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border shadow-sm ${
                      r === 'all' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      'bg-slate-800 text-white border-slate-900'
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
