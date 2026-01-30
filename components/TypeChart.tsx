
import React, { useState } from 'react';
import { PokemonTeam } from '../types';
import { getChartForGen, getTypesForGen, TYPE_COLORS } from '../constants';
import { ShieldAlert } from 'lucide-react';
import { TypeTooltip } from './PokemonSharedUI';

interface TypeChartProps {
  team: PokemonTeam;
  generation: number;
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

export const TypeChart: React.FC<TypeChartProps> = ({ team, generation }) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const chart = getChartForGen(generation);
  const relevantTypes = getTypesForGen(generation);

  const getEffectivenessInfo = (attackingType: string, pokemon: NonNullable<PokemonTeam[0]>) => {
    let multiplier = 1;
    const types = pokemon.customTypes ? pokemon.customTypes.filter(t => t !== 'none') : pokemon.types.map(t => t.name);
    
    types.forEach(defendingType => { 
      if (relevantTypes.includes(defendingType)) {
        const mult = (chart[attackingType]?.[defendingType] ?? 1);
        multiplier *= mult;
      }
    });

    if (generation >= 3 && multiplier > 0) {
      const ability = pokemon.selectedAbility?.toLowerCase().replace(/\s+/g, '-');
      if (ability && ABILITY_MODIFIERS[ability] && ABILITY_MODIFIERS[ability][attackingType] !== undefined) {
        multiplier *= ABILITY_MODIFIERS[ability][attackingType]!;
      }
    }

    if (generation >= 2 && multiplier > 0) {
      const item = pokemon.selectedItem?.toLowerCase().replace(/\s+/g, '-');
      if (item && ITEM_MODIFIERS[item] && ITEM_MODIFIERS[item][attackingType] !== undefined) {
        multiplier *= ITEM_MODIFIERS[item][attackingType]!;
      }
    }

    return { multiplier };
  };

  const teamTotals = relevantTypes.map(type => {
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
    if (multiplier === 1) return "opacity-0";
    if (multiplier >= 4) return "text-red-500 font-black";
    if (multiplier >= 2) return "text-red-400 font-bold opacity-90";
    if (multiplier === 0) return "text-indigo-400 font-black";
    if (multiplier <= 0.25) return "text-emerald-400 font-black";
    if (multiplier <= 0.5) return "text-emerald-500 font-bold opacity-90";
    return "text-slate-500";
  };

  const getScoreStyles = (score: number) => {
    if (score === 0) return "bg-slate-900/50 text-slate-700 border-slate-800 opacity-20";
    if (score >= 1) {
      const intensities = [
        "bg-red-950/20 text-red-300/60 border-red-900/20",
        "bg-red-950/40 text-red-300/80 border-red-900/30",
        "bg-red-900/40 text-red-200 border-red-800/40",
        "bg-red-800/50 text-red-100 border-red-700/50",
        "bg-red-700/70 text-white border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
        "bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] scale-105 z-10"
      ];
      return intensities[Math.min(score - 1, 5)];
    }
    if (score <= -1) {
      const absScore = Math.abs(score);
      const intensities = [
        "bg-emerald-950/20 text-emerald-300/60 border-emerald-900/20",
        "bg-emerald-950/40 text-emerald-300/80 border-emerald-900/30",
        "bg-emerald-900/40 text-emerald-200 border-emerald-800/40",
        "bg-emerald-800/50 text-emerald-100 border-emerald-700/50",
        "bg-emerald-700/70 text-white border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
        "bg-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105 z-10"
      ];
      return intensities[Math.min(absScore - 1, 5)];
    }
    return "bg-slate-900 text-slate-700 border-slate-800";
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-2 sm:p-5 shadow-2xl border border-slate-800 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm sm:text-lg font-black text-slate-100 uppercase italic tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          Defensive Matrix
        </h2>
      </div>

      <div className="w-full">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className="h-8 sm:h-12 border border-slate-800 bg-slate-950 text-slate-600 text-[6px] sm:text-[9px] uppercase font-black w-[18%] sm:w-20">ATK</th>
              {team.map((p, i) => (
                <th key={i} className="h-8 sm:h-12 border border-slate-800 bg-slate-950">
                  {p ? (
                    <img src={p.sprite} className="w-5 h-5 sm:w-8 sm:h-8 object-contain mx-auto" />
                  ) : (
                    <span className="text-[6px] sm:text-[7px] text-slate-800 font-bold">{i+1}</span>
                  )}
                </th>
              ))}
              <th className="h-8 sm:h-12 border-y border-r border-slate-800 border-l-4 border-l-slate-700 bg-slate-950 text-indigo-400 text-[8px] sm:text-[10px] uppercase font-black w-[16%] sm:w-24 italic">NET</th>
            </tr>
          </thead>
          <tbody>
            {relevantTypes.map((type, rowIndex) => {
              const rowTotal = teamTotals.find(t => t.type === type)!;
              const isLastRows = rowIndex >= relevantTypes.length - 6;
              return (
                <tr key={type} className="group/row">
                  <td 
                    className="p-0 border border-slate-800 bg-slate-900 relative"
                    onMouseEnter={() => setHoveredType(type)}
                    onMouseLeave={() => setHoveredType(null)}
                  >
                    <div className="w-full py-1.5 sm:py-2.5 px-0 rounded text-white text-[7px] sm:text-[9px] font-black uppercase text-center ring-1 ring-inset ring-white/5 overflow-hidden whitespace-nowrap cursor-help" 
                      style={{ backgroundColor: TYPE_COLORS[type] }}>
                      {type}
                    </div>
                    <TypeTooltip 
                      type={type} 
                      generation={generation} 
                      visible={hoveredType === type} 
                      mode="defensive" 
                      isLast={isLastRows}
                    />
                  </td>
                  {team.map((p, i) => {
                    if (!p) return <td key={i} className="p-0 border border-slate-800 bg-slate-900/20"></td>;
                    const { multiplier } = getEffectivenessInfo(type, p);
                    return (
                      <td key={i} className="p-0 border border-slate-800 text-center bg-slate-900/20">
                        {multiplier !== 1 && (
                          <span className={`text-[10px] sm:text-sm ${getCellStyles(multiplier)}`}>
                            {multiplier === 0 ? '0' : multiplier === 0.25 ? '¼' : multiplier === 0.5 ? '½' : `${multiplier}x`}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-0 border-y border-r border-slate-800 border-l-4 border-l-slate-700 bg-slate-950">
                    <div className={`w-full py-1.5 sm:py-2.5 rounded-sm text-[10px] sm:text-base font-black text-center border transition-all italic ${getScoreStyles(rowTotal.score)}`}>
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
