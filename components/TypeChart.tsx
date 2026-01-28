
import React from 'react';
import { PokemonTeam } from '../types';
import { TYPE_CHART, POKEMON_TYPES, TYPE_COLORS } from '../constants';
import { ShieldAlert } from 'lucide-react';

interface TypeChartProps {
  team: PokemonTeam;
}

const ABILITY_MODIFIERS: Record<string, Partial<Record<string, number>>> = {
  'levitate': { 'ground': 0 },
  'thick-fat': { 'fire': 0.5, 'ice': 0.5 },
  'sap-sipper': { 'grass': 0 },
  'volt-absorb': { 'electric': 0 },
  'water-absorb': { 'water': 0 },
  'flash-fire': { 'fire': 0 },
  'earth-eater': { 'ground': 0 },
  'well-baked-body': { 'fire': 0 },
  'wind-rider': { 'flying': 0 },
};

const ITEM_MODIFIERS: Record<string, Partial<Record<string, number>>> = {
  'air-balloon': { 'ground': 0 },
};

export const TypeChart: React.FC<TypeChartProps> = ({ team }) => {
  const getEffectivenessInfo = (attackingType: string, pokemon: NonNullable<PokemonTeam[0]>) => {
    let multiplier = 1;
    const types = pokemon.customTypes ? pokemon.customTypes.filter(t => t !== 'none') : pokemon.types.map(t => t.name);
    
    // Type calculations
    types.forEach(defendingType => { 
      const mult = (TYPE_CHART[attackingType]?.[defendingType] ?? 1);
      multiplier *= mult;
    });

    // Ability modifiers - only check if not already immune
    if (multiplier > 0) {
      const ability = pokemon.selectedAbility?.toLowerCase().replace(/\s+/g, '-');
      if (ability && ABILITY_MODIFIERS[ability] && ABILITY_MODIFIERS[ability][attackingType] !== undefined) {
        multiplier *= ABILITY_MODIFIERS[ability][attackingType]!;
      }
    }

    // Item modifiers - only check if not already immune
    if (multiplier > 0) {
      const item = pokemon.selectedItem?.toLowerCase().replace(/\s+/g, '-');
      if (item && ITEM_MODIFIERS[item] && ITEM_MODIFIERS[item][attackingType] !== undefined) {
        multiplier *= ITEM_MODIFIERS[item][attackingType]!;
      }
    }

    return { multiplier };
  };

  const teamTotals = POKEMON_TYPES.map(type => {
    let weak = 0;
    let resist = 0;
    team.forEach(p => {
      if (!p) return;
      const { multiplier } = getEffectivenessInfo(type, p);
      if (multiplier > 1) weak++;
      if (multiplier < 1) resist++;
    });
    return { type, weak, resist, score: weak - resist };
  });

  const criticalThreats = teamTotals.filter(t => t.score > 1).sort((a, b) => b.score - a.score);

  return (
    <div className="bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 shadow-2xl border border-slate-800 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-2">
        <h2 className="text-lg sm:text-2xl font-black text-slate-100 uppercase italic tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 sm:w-6 sm:h-6 text-red-500" />
          Defensive Matrix
        </h2>
      </div>

      {/* Mobile Simplified View */}
      <div className="sm:hidden space-y-4">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-2">Critical Team Vulnerabilities</p>
        <div className="flex flex-wrap gap-2">
          {criticalThreats.length > 0 ? criticalThreats.map(threat => (
            <div key={threat.type} className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[threat.type] }} />
              <span className="text-[10px] font-black text-white uppercase">{threat.type}</span>
              <span className="text-[10px] font-black text-red-400">+{threat.score}</span>
            </div>
          )) : (
            <div className="w-full text-center py-4 text-emerald-400 text-[10px] font-black uppercase italic">Team Coverage Balanced</div>
          )}
        </div>
      </div>

      {/* Desktop Detailed View */}
      <div className="hidden sm:block w-full overflow-x-auto pb-2 scrollbar-thin">
        <table className="w-full min-w-[600px] table-fixed border-collapse">
          <thead>
            <tr>
              <th className="h-20 p-3 border border-slate-800 bg-slate-950 text-slate-500 text-[10px] uppercase font-black w-20 sticky left-0 z-20">ATK</th>
              {team.map((p, i) => (
                <th key={i} className="h-20 p-3 border border-slate-800 bg-slate-950">
                  {p ? <img src={p.sprite} className="w-10 h-10 object-contain mx-auto" title={p.nickname || p.name} /> : <span className="text-[10px] text-slate-700 font-bold uppercase"># {i+1}</span>}
                </th>
              ))}
              <th className="h-20 p-3 border border-slate-800 bg-indigo-950 text-indigo-300 text-[10px] uppercase font-black w-24">Team</th>
            </tr>
          </thead>
          <tbody>
            {POKEMON_TYPES.map(type => {
              const rowTotal = teamTotals.find(t => t.type === type)!;
              return (
                <tr key={type} className="hover:bg-slate-800/20">
                  <td className="p-1 border border-slate-800 bg-slate-900 sticky left-0 z-20 backdrop-blur-md">
                    <div className="w-full py-2 rounded-lg text-white text-[9px] font-black uppercase text-center shadow-lg ring-1 ring-inset ring-white/20" 
                      style={{ 
                        backgroundColor: TYPE_COLORS[type],
                        backgroundImage: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15))',
                        textShadow: '0 0.5px 1px rgba(0,0,0,0.3)'
                      }}>
                      {type}
                    </div>
                  </td>
                  {team.map((p, i) => {
                    if (!p) return <td key={i} className="p-1 border border-slate-800 text-center bg-slate-900/40"></td>;
                    
                    const { multiplier } = getEffectivenessInfo(type, p);

                    return (
                      <td 
                        key={i} 
                        className="p-1 border border-slate-800 text-center bg-slate-900/40 relative"
                      >
                        {multiplier !== 1 && (
                          <div className={`w-full py-1.5 rounded-lg text-[11px] font-black border-2 transition-all ${multiplier > 1 ? 'bg-red-950/60 text-red-400 border-red-900/50' : multiplier === 0 ? 'bg-indigo-950/80 text-indigo-400 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'bg-emerald-950/60 text-emerald-400 border-emerald-900/50'}`}>
                            {multiplier === 0 ? '0' : multiplier === 0.25 ? '¼' : multiplier === 0.5 ? '½' : multiplier}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-1 border border-slate-800 bg-slate-900">
                    <div className={`w-full py-1.5 rounded-lg text-xs font-black text-center border-2 ${rowTotal.score > 0 ? 'bg-red-950/60 text-red-400 border-red-900/50' : rowTotal.score < 0 ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/50' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>
                      {rowTotal.score > 0 ? `+${rowTotal.score}` : rowTotal.score === 0 ? '-' : rowTotal.score}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
