
import React from 'react';
import { Swords, Sparkles, CircleDashed, Zap, Target, Shield } from 'lucide-react';
import { TYPE_COLORS } from '../constants';
import { MoveDetails } from '../types';

export const ControlTooltip = React.memo(({ text }: { text: string }) => (
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-[200] hidden sm:block">
    <div className="bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg shadow-2xl border border-slate-700 whitespace-nowrap">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950" />
    </div>
  </div>
));

export const CategoryIcon = React.memo(({ category, className = "w-3.5 h-3.5" }: { category: string, className?: string }) => {
  const normalized = category?.toLowerCase();
  switch (normalized) {
    case 'physical': return <Swords className={`${className} text-orange-400`} />;
    case 'special': return <Sparkles className={`${className} text-cyan-400`} />;
    case 'status': return <CircleDashed className={`${className} text-slate-400`} />;
    default: return <CircleDashed className={`${className} text-slate-500`} />;
  }
});

export const MoveTooltip = React.memo(({ move, visible }: { move: MoveDetails; visible: boolean }) => {
  if (!visible) return null;
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-[300] animate-in fade-in zoom-in-95 duration-200 origin-bottom w-64 hidden sm:block pointer-events-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-left">
        <div className="flex items-center justify-between mb-4 gap-3">
          <span className="text-xs font-black uppercase italic text-white truncate leading-none">
            {move.name}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-white text-[10px] font-black uppercase" 
            style={{ backgroundColor: TYPE_COLORS[move.type] }}>
            {move.type}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-950 p-2 rounded-xl flex flex-col items-center">
            <Zap className="w-3.5 h-3.5 text-yellow-500 mb-1" />
            <span className="text-[10px] text-slate-100 font-black">{move.power ?? '—'}</span>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl flex flex-col items-center">
            <Target className="w-3.5 h-3.5 text-blue-500 mb-1" />
            <span className="text-[10px] text-slate-100 font-black">{move.accuracy ?? '—'}%</span>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl flex flex-col items-center">
            <Shield className="w-3.5 h-3.5 text-emerald-500 mb-1" />
            <span className="text-[10px] text-slate-100 font-black">{move.pp} PP</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-300 italic leading-relaxed">{move.effect}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-[8px] border-transparent border-t-slate-900" />
      </div>
    </div>
  );
});

export const AbilityTooltip = React.memo(({ name, description, visible }: { name: string; description: string; visible: boolean }) => {
  if (!visible || !name) return null;
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-[300] animate-in fade-in zoom-in-95 duration-200 origin-bottom w-64 hidden sm:block pointer-events-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-left">
        <h4 className="text-xs font-black uppercase text-indigo-400 mb-2">{name.replace(/-/g, ' ')}</h4>
        <p className="text-[10px] text-slate-300 italic leading-relaxed">{description || 'No description available.'}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-[8px] border-transparent border-t-slate-900" />
      </div>
    </div>
  );
});

export const StatBar = React.memo(({ label, value }: { label: string; value: number }) => {
  const percentage = Math.min(100, (value / 255) * 100);
  const color = value < 60 ? 'bg-red-500' : value < 90 ? 'bg-amber-500' : value < 120 ? 'bg-emerald-500' : 'bg-blue-500';
  const abbreviation = label.toUpperCase();

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[9px] font-black text-slate-500 uppercase">{abbreviation}</span>
        <span className="text-[9px] font-black text-slate-400">{value}</span>
      </div>
      <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800/30">
        <div 
          className={`h-full ${color} transition-all duration-700 ease-out`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});
