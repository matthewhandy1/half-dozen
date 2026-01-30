
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

  const getCellStyles = (multiplier: number) => {
    if (multiplier === 1) return "";
    if (multiplier >= 4) return "bg-red-500 text-white border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.5)] z-10";
    if (multiplier >= 2) return "bg-red-900 text-red-100 border-red-700/50";
    if (multiplier === 0) return "bg-indigo-600 text-white border-indigo-300 shadow-[0_0_12px_rgba(79,70,229,0.4)] z-10";
    if (multiplier <= 0.25) return "bg-emerald-500 text-white border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10";
    if (multiplier <= 0.5) return "bg-emerald-900 text-emerald-100 border-emerald-700/50";
    return "bg-slate-800 text-slate-400 border-slate-700";
  };

  const getScoreStyles = (score: number) => {
    // Scaling color intensity for positive scores (Weaknesses)
    if (score >= 5) return "bg-red-500 text-white border-red-200 shadow-[0_0_25px_rgba(239,68,68,0.8)] scale-110 z-20 font-black";
    if (score >= 3) return "bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.6)] z-20";
    if (score >= 1) return "bg-red-900/80 text-red-200 border-red-800/50";
    
    // Scaling color intensity for negative scores (Resistances)
    if (score <= -5) return "bg-emerald-500 text-white border-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.8)] scale-110 z-20 font-black";
    if (score <= -3) return "bg-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(5,150,105,0.6)] z-20";
    if (score <= -1) return "bg-emerald-900/80 text-emerald-200 border-emerald-800/50";
    
    return "bg-slate-950 text-slate-700 border-slate-800";
  };

  return (
    <div className="bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-8 shadow-2xl border border-slate-800 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
        <h2 className="text-lg sm:text-2xl font-black text-slate-100 uppercase italic tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 sm:w-6 sm:h-6 text-red-500" />
          Defensive Matrix
        </h2>
      </div>

      <div className="w-full">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className="h-12 sm:h-20 p-1 sm:p-3 border border-slate-800 bg-slate-950 text-slate-500 text-[7px] sm:text-[10px] uppercase font-black w-[50px] sm:w-20">ATK</th>
              {team.map((p, i) => (
                <th key={i} className="h-12 sm:h-20 p-1 sm:p-3 border border-slate-800 bg-slate-950">
                  {p ? (
                    <img src={p.sprite} className="w-6 h-6 sm:w-10 sm:h-10 object-contain mx-auto" title={p.nickname || p.name} />
                  ) : (
                    <span className="text-[7px] sm:text-[10px] text-slate-700 font-bold uppercase">{i+1}</span>
                  )}
                </th>
              ))}
              <th className="h-12 sm:h-20 p-1 sm:p-3 border border-slate-800 bg-indigo-950 text-indigo-300 text-[7px] sm:text-[10px] uppercase font-black w-[35px] sm:w-24">Net</th>
            </tr>
          </thead>
          <tbody>
            {POKEMON_TYPES.map(type => {
              const rowTotal = teamTotals.find(t => t.type === type)!;
              return (
                <tr key={type} className="hover:bg-slate-800/20">
                  <td className="p-0.5 sm:p-1 border border-slate-800 bg-slate-900">
                    <div className="w-full py-1 sm:py-2 rounded sm:rounded-lg text-white text-[6px] sm:text-[9px] font-black uppercase text-center shadow-lg ring-1 ring-inset ring-white/10 overflow-hidden whitespace-nowrap" 
                      style={{ 
                        backgroundColor: TYPE_COLORS[type],
                        backgroundImage: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15))',
                      }}>
                      {type}
                    </div>
                  </td>
                  {team.map((p, i) => {
                    if (!p) return <td key={i} className="p-0.5 sm:p-1 border border-slate-800 text-center bg-slate-900/40"></td>;
                    const { multiplier } = getEffectivenessInfo(type, p);
                    return (
                      <td key={i} className="p-0.5 sm:p-1 border border-slate-800 text-center bg-slate-900/40 relative">
                        {multiplier !== 1 && (
                          <div className={`w-full py-1 sm:py-1.5 rounded sm:rounded-lg text-[8px] sm:text-[11px] font-black border sm:border-2 transition-all ${getCellStyles(multiplier)}`}>
                            {multiplier === 0 ? '0' : multiplier === 0.25 ? '¼' : multiplier === 0.5 ? '½' : multiplier}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-0.5 sm:p-1 border border-slate-800 bg-slate-900">
                    <div className={`w-full py-1 sm:py-1.5 rounded sm:rounded-lg text-[8px] sm:text-xs font-black text-center border sm:border-2 transition-all duration-300 ${getScoreStyles(rowTotal.score)}`}>
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
