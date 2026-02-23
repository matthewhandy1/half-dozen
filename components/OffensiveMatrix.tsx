
import React, { useState, useMemo } from 'react';
import { PokemonTeam, PokemonData } from '../types';
import { getChartForGen, getTypesForGen, TYPE_COLORS } from '../constants';
import { Sword } from 'lucide-react';
import { TypeTooltip } from './PokemonSharedUI';

interface OffensiveMatrixProps {
  team: PokemonTeam;
  generation: number;
  onReplace?: (index: number, id: string | number) => void;
}

const OFFENSIVE_ARCHETYPES: Record<string, { pokemon: string; types: string[]; id: string }> = {
  'ground-fighting': { pokemon: 'Great Tusk', types: ['ground', 'fighting'], id: 'great-tusk' },
  'ghost-fighting': { pokemon: 'Annihilape', types: ['ghost', 'fighting'], id: 'annihilape' },
  'ice-water': { pokemon: 'Iron Bundle', types: ['ice', 'water'], id: 'iron-bundle' },
  'fire-dragon': { pokemon: 'Gouging Fire', types: ['fire', 'dragon'], id: 'gouging-fire' },
  'dark-steel': { pokemon: 'Kingambit', types: ['dark', 'steel'], id: 'kingambit' },
  'fairy-fighting': { pokemon: 'Iron Valiant', types: ['fairy', 'fighting'], id: 'iron-valiant' },
};

export const OffensiveMatrix: React.FC<OffensiveMatrixProps> = ({ team, generation, onReplace }) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const chart = getChartForGen(generation);
  const relevantTypes = getTypesForGen(generation);

  const getBestEffectiveness = (defendingType: string, pokemon: NonNullable<PokemonTeam[0]>) => {
    let maxMultiplier = -1;
    const damagingMoves = pokemon.selectedMoves.filter(m => m.name && m.damageClass !== 'status');
    if (damagingMoves.length === 0) return -1;
    damagingMoves.forEach(move => {
      const multiplier = (chart[move.type]?.[defendingType] ?? 1);
      if (multiplier > maxMultiplier) maxMultiplier = multiplier;
    });
    return maxMultiplier;
  };

  const teamCoverage = useMemo(() => {
    return relevantTypes.map(type => {
      let strength = 0; let resisted = 0;
      team.forEach(p => {
        if (!p) return;
        const m = getBestEffectiveness(type, p);
        if (m >= 2) strength++;
        else if (m >= 0 && m < 1) resisted++;
      });
      return { type, strength, resisted, score: strength - resisted };
    });
  }, [team, generation]);

  const getIntensityStyles = (value: number, type: 'strength' | 'resisted' | 'net') => {
    const absValue = Math.abs(value);
    if (absValue === 0) return { backgroundColor: 'transparent', color: '#475569', opacity: 0.2 };
    
    const intensity = Math.min(1, absValue / 4); 
    const opacity = 0.15 + intensity * 0.75;
    
    const isGreen = type === 'strength' || (type === 'net' && value > 0);
    const isRed = type === 'resisted' || (type === 'net' && value < 0);

    if (isGreen) {
      return { 
        backgroundColor: `rgba(16, 185, 129, ${opacity})`, 
        color: intensity > 0.6 ? '#fff' : '#6ee7b7',
        border: `1px solid rgba(16, 185, 129, ${opacity * 0.3})`
      };
    }
    if (isRed) {
      return { 
        backgroundColor: `rgba(239, 68, 68, ${opacity})`, 
        color: intensity > 0.6 ? '#fff' : '#fca5a5',
        border: `1px solid rgba(239, 68, 68, ${opacity * 0.3})`
      };
    }
    return {};
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-800 w-full overflow-hidden flex-1">
        <h2 className="text-sm sm:text-lg font-black text-slate-100 uppercase italic tracking-tight flex items-center gap-2 mb-4">
          <Sword className="w-4 h-4 text-emerald-500" /> Offensive Matrix
        </h2>
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className="h-10 border border-slate-800 bg-slate-950 text-slate-600 text-[6px] sm:text-[9px] uppercase font-black w-[15%] sm:w-16">Defender</th>
                {team.map((p, i) => (
                  <th key={i} className="h-10 border border-slate-800 bg-slate-950 w-[8%] sm:w-12">
                    {p ? <img src={p.sprite} className="w-5 h-5 sm:w-8 sm:h-8 object-contain mx-auto" /> : <span className="text-[6px] text-slate-800">{i+1}</span>}
                  </th>
                ))}
                <th className="h-10 border border-slate-800 bg-slate-950 text-emerald-400/60 text-[6px] sm:text-[8px] uppercase font-black w-[8%] sm:w-12 italic">SE</th>
                <th className="h-10 border border-slate-800 bg-slate-950 text-red-400/60 text-[6px] sm:text-[8px] uppercase font-black w-[8%] sm:w-12 italic">NVE</th>
                <th className="h-10 border-y border-r border-slate-800 border-l-2 sm:border-l-4 border-l-slate-700 bg-slate-950 text-emerald-400 text-[7px] sm:text-[10px] uppercase font-black w-[13%] sm:w-16 italic">Net</th>
              </tr>
            </thead>
            <tbody>
              {relevantTypes.map((type, rowIndex) => {
                const rowTotal = teamCoverage.find(t => t.type === type)!;
                return (
                  <tr key={type}>
                    <td className="p-0 border border-slate-800 bg-slate-900 relative" onMouseEnter={() => setHoveredType(type)} onMouseLeave={() => setHoveredType(null)}>
                      <div className="w-full py-1.5 sm:py-2 text-white text-[6px] sm:text-[9px] font-black uppercase text-center cursor-help" style={{ backgroundColor: TYPE_COLORS[type] }}>{type}</div>
                      <TypeTooltip type={type} generation={generation} visible={hoveredType === type} mode="offensive" isLast={rowIndex >= relevantTypes.length - 5} />
                    </td>
                    {team.map((p, i) => {
                      const m = p ? getBestEffectiveness(type, p) : -1;
                      return <td key={i} className="p-0 border border-slate-800 text-center bg-slate-900/20 text-[7px] sm:text-[11px] font-bold">
                        {m !== -1 && m !== 1 && <span className={m > 1 ? 'text-emerald-400' : m === 0 ? 'text-indigo-400' : 'text-red-400'}>{m === 0 ? '0' : m === 0.5 ? '½' : m === 0.25 ? '¼' : `${m}x`}</span>}
                      </td>;
                    })}
                    <td className="p-0 border border-slate-800 bg-slate-950 text-center">
                      <div className="w-full py-1.5 sm:py-2 text-[8px] sm:text-xs font-black" style={getIntensityStyles(rowTotal.strength, 'strength')}>{rowTotal.strength || '-'}</div>
                    </td>
                    <td className="p-0 border border-slate-800 bg-slate-950 text-center">
                      <div className="w-full py-1.5 sm:py-2 text-[8px] sm:text-xs font-black" style={getIntensityStyles(rowTotal.resisted, 'resisted')}>{rowTotal.resisted || '-'}</div>
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
