
import React, { useState, useMemo } from 'react';
import { PokemonTeam, PokemonData } from '../types';
import { getChartForGen, getTypesForGen, TYPE_COLORS } from '../constants';
import { ShieldAlert } from 'lucide-react';
import { TypeTooltip } from './PokemonSharedUI';

interface TypeChartProps {
  team: PokemonTeam;
  generation: number;
  onReplace?: (index: number, id: string | number) => void;
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

const DEFENSIVE_ARCHETYPES: Record<string, { pokemon: string; types: string[]; id: string }> = {
  'steel-fairy': { pokemon: 'Tinkaton', types: ['steel', 'fairy'], id: 'tinkaton' },
  'steel-flying': { pokemon: 'Corviknight', types: ['steel', 'flying'], id: 'corviknight' },
  'water-ground': { pokemon: 'Gastrodon', types: ['water', 'ground'], id: 'gastrodon' },
  'grass-steel': { pokemon: 'Ferrothorn', types: ['grass', 'steel'], id: 'ferrothorn' },
  'poison-dark': { pokemon: 'Overqwil', types: ['poison', 'dark'], id: 'overqwil' },
  'fire-water': { pokemon: 'Volcanion', types: ['fire', 'water'], id: 'volcanion' },
  'ghost-normal': { pokemon: 'Zoroark-Hisui', types: ['ghost', 'normal'], id: 'zoroark-hisui' },
};

export const TypeChart: React.FC<TypeChartProps> = ({ team, generation, onReplace }) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const chart = getChartForGen(generation);
  const relevantTypes = getTypesForGen(generation);

  const getEffectivenessInfo = (attackingType: string, pokemon: NonNullable<PokemonTeam[0]>) => {
    let multiplier = 1;
    const types = pokemon.customTypes ? pokemon.customTypes.filter(t => t !== 'none') : pokemon.types.map(t => t.name);
    types.forEach(defendingType => { 
      if (relevantTypes.includes(defendingType)) {
        multiplier *= (chart[attackingType]?.[defendingType] ?? 1);
      }
    });
    if (generation >= 3 && multiplier > 0) {
      const ability = pokemon.selectedAbility?.toLowerCase().replace(/\s+/g, '-');
      if (ability && ABILITY_MODIFIERS[ability]?.[attackingType] !== undefined) multiplier *= ABILITY_MODIFIERS[ability][attackingType]!;
    }
    if (generation >= 2 && multiplier > 0) {
      const item = pokemon.selectedItem?.toLowerCase().replace(/\s+/g, '-');
      if (item && ITEM_MODIFIERS[item]?.[attackingType] !== undefined) multiplier *= ITEM_MODIFIERS[item][attackingType]!;
    }
    return { multiplier };
  };

  const teamTotals = useMemo(() => {
    return relevantTypes.map(type => {
      let weak = 0; let resist = 0;
      team.forEach(p => {
        if (!p) return;
        const { multiplier } = getEffectivenessInfo(type, p);
        if (multiplier > 1) weak++;
        if (multiplier < 1) resist++;
      });
      return { type, weak, resist, score: weak - resist };
    });
  }, [team, generation]);

  const getIntensityStyles = (value: number, type: 'weak' | 'resist' | 'net') => {
    const absValue = Math.abs(value);
    if (absValue === 0) return { backgroundColor: 'transparent', color: '#475569', opacity: 0.2 };
    
    const intensity = Math.min(1, absValue / 4); 
    const opacity = 0.15 + intensity * 0.75;
    
    const isRed = type === 'weak' || (type === 'net' && value > 0);
    const isGreen = type === 'resist' || (type === 'net' && value < 0);

    if (isRed) {
      return { 
        backgroundColor: `rgba(239, 68, 68, ${opacity})`, 
        color: intensity > 0.6 ? '#fff' : '#fca5a5',
        border: `1px solid rgba(239, 68, 68, ${opacity * 0.3})`
      };
    }
    if (isGreen) {
      return { 
        backgroundColor: `rgba(16, 185, 129, ${opacity})`, 
        color: intensity > 0.6 ? '#fff' : '#6ee7b7',
        border: `1px solid rgba(16, 185, 129, ${opacity * 0.3})`
      };
    }
    return {};
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-800 w-full overflow-hidden flex-1">
        <h2 className="text-sm sm:text-lg font-black text-slate-100 uppercase italic tracking-tight flex items-center gap-2 mb-4">
          <ShieldAlert className="w-4 h-4 text-red-500" /> Defensive Matrix
        </h2>
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className="h-10 border border-slate-800 bg-slate-950 text-slate-600 text-[6px] sm:text-[9px] uppercase font-black w-[15%] sm:w-16">Attacker</th>
                {team.map((p, i) => (
                  <th key={i} className="h-10 border border-slate-800 bg-slate-950 w-[8%] sm:w-12">
                    {p ? <img src={p.sprite} className="w-5 h-5 sm:w-8 sm:h-8 object-contain mx-auto" /> : <span className="text-[6px] text-slate-800">{i+1}</span>}
                  </th>
                ))}
                <th className="h-10 border border-slate-800 bg-slate-950 text-red-400/60 text-[6px] sm:text-[8px] uppercase font-black w-[8%] sm:w-12 italic">Weak</th>
                <th className="h-10 border border-slate-800 bg-slate-950 text-emerald-400/60 text-[6px] sm:text-[8px] uppercase font-black w-[8%] sm:w-12 italic">Resist</th>
                <th className="h-10 border-y border-r border-slate-800 border-l-2 sm:border-l-4 border-l-slate-700 bg-slate-950 text-indigo-400 text-[7px] sm:text-[10px] uppercase font-black w-[13%] sm:w-16 italic">Net</th>
              </tr>
            </thead>
            <tbody>
              {relevantTypes.map((type, rowIndex) => {
                const rowTotal = teamTotals.find(t => t.type === type)!;
                return (
                  <tr key={type}>
                    <td className="p-0 border border-slate-800 bg-slate-900 relative" onMouseEnter={() => setHoveredType(type)} onMouseLeave={() => setHoveredType(null)}>
                      <div className="w-full py-1.5 sm:py-2 text-white text-[6px] sm:text-[9px] font-black uppercase text-center cursor-help" style={{ backgroundColor: TYPE_COLORS[type] }}>{type}</div>
                      <TypeTooltip type={type} generation={generation} visible={hoveredType === type} mode="defensive" isLast={rowIndex >= relevantTypes.length - 5} />
                    </td>
                    {team.map((p, i) => {
                      const multiplier = p ? getEffectivenessInfo(type, p).multiplier : 1;
                      return <td key={i} className="p-0 border border-slate-800 text-center bg-slate-900/20 text-[7px] sm:text-[11px] font-bold">
                        {p && multiplier !== 1 && <span className={multiplier > 1 ? 'text-red-400' : multiplier === 0 ? 'text-indigo-400' : 'text-emerald-400'}>{multiplier === 0 ? '0' : multiplier === 0.5 ? '½' : multiplier === 0.25 ? '¼' : `${multiplier}x`}</span>}
                      </td>;
                    })}
                    <td className="p-0 border border-slate-800 bg-slate-950 text-center">
                      <div className="w-full py-1.5 sm:py-2 text-[8px] sm:text-xs font-black" style={getIntensityStyles(rowTotal.weak, 'weak')}>{rowTotal.weak || '-'}</div>
                    </td>
                    <td className="p-0 border border-slate-800 bg-slate-950 text-center">
                      <div className="w-full py-1.5 sm:py-2 text-[8px] sm:text-xs font-black" style={getIntensityStyles(rowTotal.resist, 'resist')}>{rowTotal.resist || '-'}</div>
                    </td>
                    <td className="p-0 border-y border-r border-slate-800 border-l-2 sm:border-l-4 border-l-slate-700 bg-slate-950 text-center">
                      <div className="w-full py-1.5 sm:py-2 text-[8px] sm:text-xs font-black" style={getIntensityStyles(rowTotal.score, 'net')}>{rowTotal.score > 0 ? `+${rowTotal.score}` : rowTotal.score === 0 ? '-' : rowTotal.score}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
