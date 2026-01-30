
import React, { useMemo } from 'react';
import { Swords, Sparkles, CircleDashed, Zap, Target, Shield, Sword, ShieldAlert, ShieldCheck, HelpCircle, Lightbulb } from 'lucide-react';
import { TYPE_COLORS, getChartForGen, getTypesForGen } from '../constants';
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

export const TypeTooltip = React.memo(({ 
  type, 
  generation, 
  visible, 
  mode = 'both',
  isLast = false 
}: { 
  type: string; 
  generation: number; 
  visible: boolean;
  mode?: 'offensive' | 'defensive' | 'both';
  isLast?: boolean;
}) => {
  const intel = useMemo(() => {
    const chart = getChartForGen(generation);
    const types = getTypesForGen(generation);
    
    const resists: string[] = [];
    const immunities: string[] = [];
    const weakTo: string[] = [];

    if (mode === 'defensive') {
      // Input "type" is the ATTACKER. We want types that defend well against it.
      types.forEach(potentialDefender => {
        const mult = chart[type]?.[potentialDefender] ?? 1;
        if (mult === 0) immunities.push(potentialDefender);
        else if (mult < 1) resists.push(potentialDefender);
      });
      return { 
        title: `Vs. ${type} Attacks`,
        subtitle: 'Optimal Defensive Counters',
        primary: { label: 'Immunities', items: immunities, icon: ShieldCheck, color: 'text-indigo-400' },
        secondary: { label: 'Resistances', items: resists, icon: Shield, color: 'text-emerald-400' }
      };
    } else {
      // Input "type" is the DEFENDER. We want move types that hit it hard.
      types.forEach(potentialAttacker => {
        const mult = chart[potentialAttacker]?.[type] ?? 1;
        if (mult > 1) weakTo.push(potentialAttacker);
        else if (mult < 1) resists.push(potentialAttacker);
      });
      return {
        title: `Vs. ${type} Defense`,
        subtitle: 'Strategic Move Types',
        primary: { label: 'Super Effective', items: weakTo, icon: Sword, color: 'text-emerald-400' },
        secondary: { label: 'Ineffective / NVE', items: resists, icon: ShieldAlert, color: 'text-red-400' }
      };
    }
  }, [type, generation, mode]);

  if (!visible) return null;

  const BadgeList = ({ section }: { section: any }) => {
    if (section.items.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 opacity-60">
          <section.icon className={`w-3 h-3 ${section.color}`} />
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{section.label}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {section.items.map((t: string) => (
            <div 
              key={t} 
              className="px-2 py-0.5 rounded text-[8px] font-black uppercase text-white shadow-sm ring-1 ring-inset ring-white/10"
              style={{ backgroundColor: TYPE_COLORS[t] }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`absolute left-full ${isLast ? 'bottom-0' : 'top-0'} ml-3 z-[400] animate-in fade-in zoom-in-95 slide-in-from-left-2 duration-200 origin-left w-64 hidden sm:block pointer-events-none`}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5">
        <div className="p-4 border-b border-slate-800 flex flex-col gap-0.5" style={{ backgroundColor: `${TYPE_COLORS[type]}15` }}>
           <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{intel.subtitle}</h4>
              <Lightbulb className="w-3 h-3 text-amber-400" />
           </div>
           <h3 className="text-sm font-black uppercase italic tracking-tight" style={{ color: TYPE_COLORS[type] }}>{intel.title}</h3>
        </div>
        
        <div className="p-4 space-y-4 bg-slate-950/40">
          <BadgeList section={intel.primary} />
          <BadgeList section={intel.secondary} />
          
          {intel.primary.items.length === 0 && intel.secondary.items.length === 0 && (
            <div className="py-2 text-center border border-dashed border-slate-800 rounded-xl">
              <span className="text-[9px] font-bold text-slate-600 uppercase">No specific advantages</span>
            </div>
          )}
        </div>
        
        <div className={`absolute ${isLast ? 'bottom-4' : 'top-4'} right-full border-[8px] border-transparent border-r-slate-700`} />
        <div className={`absolute ${isLast ? 'bottom-4' : 'top-4'} right-full border-[8px] border-transparent border-r-slate-900 translate-x-[1px]`} />
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
