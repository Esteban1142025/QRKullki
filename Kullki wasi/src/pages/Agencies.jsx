import React, { useState } from 'react';
import { AGENCIES } from '../data/mockData';
import Swal from 'sweetalert2';
import { MdStore, MdLocationOn, MdPhone, MdAdd, MdEdit, MdDelete } from 'react-icons/md';

const Agencies = () => {
  const [agencies, setAgencies] = useState(AGENCIES);

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Eliminar Sucursal?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0d1424',
      color: '#f1f5f9'
    }).then((result) => {
      if (result.isConfirmed) {
        setAgencies(agencies.filter(a => a.id !== id));
        Swal.fire({ icon: 'success', title: 'Agencia Eliminada', timer: 1500, showConfirmButton: false, background: '#0d1424', color: '#f1f5f9' });
      }
    });
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 font-['Outfit']">Red de Sucursales</h2>
          <p className="text-xs text-slate-400 mt-0.5">Gestione las agencias físicas y puntos de extensión de la cooperativa.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#0d2347] hover:bg-[#163668] border border-[#8DC63F]/40 hover:border-[#8DC63F] rounded-xl text-xs font-bold text-slate-200 tracking-wider transition-all cursor-pointer shadow-lg shrink-0">
          <MdAdd size={16} className="text-[#8DC63F]" />
          NUEVA AGENCIA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agencies.map(agency => (
          <div key={agency.id} className="p-5 rounded-2xl glass-panel border border-slate-800/70 glass-panel-hover flex flex-col justify-between h-full group">
            
            <div className="mb-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8DC63F] to-[#6aa832] flex items-center justify-center text-[#0d2347] shadow-lg shadow-[#8DC63F]/20">
                    <MdStore size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100">{agency.name}</h3>
                    <span className="text-[10px] text-[#8DC63F] font-bold tracking-widest uppercase">{agency.id}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                  agency.type === 'Principal' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                  agency.type === 'Extensión' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {agency.type}
                </span>
              </div>

              <div className="space-y-2 mt-4 text-xs">
                <div className="flex items-start gap-2 text-slate-400">
                  <MdLocationOn size={16} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{agency.address}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MdPhone size={16} className="shrink-0" />
                  <span className="font-mono">{agency.phone}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 mt-auto">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${agency.status === 'Activo' ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${agency.status === 'Activo' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{agency.status}</span>
              </div>
              
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 transition-all">
                  <MdEdit size={14} />
                </button>
                <button onClick={() => handleDelete(agency.id)} className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all">
                  <MdDelete size={14} />
                </button>
              </div>
            </div>
            
          </div>
        ))}
      </div>

    </div>
  );
};

export default Agencies;
