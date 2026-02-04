
import React, { useState, useMemo } from 'react';
import { PokemonTeam, PokemonData } from '../types';
import { getChartForGen, getTypesForGen, TYPE_COLORS } from '../constants';
import { Sword, Zap, Lightbulb, Lock, ArrowLeftRight, Trash2, UserPlus } from 'lucide-react';
import { TypeTooltip } from './PokemonSharedUI';

interface OffensiveMatrixProps {
  team: PokemonTeam;
  generation: number;
}

const OFFENSIVE_ARCHETYPES: Record<string, { pokemon: string; types: string[] }> = {
  'ground-electric': { pokemon: 'Great Tusk / Pawmot', types: ['ground', 'electric'] },
  'ghost-fighting': { pokemon: 'Annihilape / Marshadow', types: ['ghost', 'fighting'] },
  'ice-electric': { pokemon: 'Iron Bundle', types: ['ice', 'electric'] },
  'fire-dragon': { pokemon: 'Gouging Fire / Koraidon', types: ['fire', 'dragon'] },
  'dark-poison': { pokemon: 'Kingambit / Pecharunt', types: ['dark', 'poison'] },
  'fairy-psychic': { pokemon: 'Iron Valiant', types: ['fairy', 'psychic'] },
};

export const OffensiveMatrix: React.FC<OffensiveMatrixProps> = ({ team, generation }) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);
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

  const insights = useMemo(() => {
    const activeMembers = team.filter((p): p is PokemonData => p !== null);
    if (activeMembers.length < 6) return null;

    const coverageGaps = [...teamCoverage].filter(t => t.score <= 0).sort((a, b) => a.score - b.score);
    let swapOut = null; let swapIn = null;

    if (coverageGaps.length > 0) {
      const biggestGap = coverageGaps[0].type;
      swapOut = activeMembers.sort((a, b) => {
        const aCov = relevantTypes.filter(t => getBestEffectiveness(t, a) >= 2).length;
        const bCov = relevantTypes.filter(t => getBestEffectiveness(t, b) >= 2).length;
        return aCov - bCov;
      })[0];
      const idealAtkTypes: string[] = [];
      relevantTypes.forEach(t => { if ((chart[t]?.[biggestGap] ?? 1) > 1) idealAtkTypes.push(t); });
      const archetypeKey = Object.keys(OFFENSIVE_ARCHETYPES).find(key => OFFENSIVE_ARCHETYPES[key].types.some(type => idealAtkTypes.includes(type)));
      swapIn = archetypeKey ? OFFENSIVE_ARCHETYPES[archetypeKey] : { pokemon: 'Any ' + (idealAtkTypes[0] || 'Ground') + ' type', types: [idealAtkTypes[0] || 'ground'] };
    }

    return {
      recommendations: coverageGaps.slice(0, 3).map(gap => {
        const bestAttackerTypes: string[] = [];
        relevantTypes.forEach(potentialAtkType => { if (chart[potentialAtkType]?.[gap.type] > 1) bestAttackerTypes.push(potentialAtkType); });
        return { gap: gap.type, score: gap.score, suggestedMoves: bestAttackerTypes.slice(0, 4) };
      }),
      swapOut, swapIn
    };
  }, [teamCoverage, team, generation]);

  const getScoreStyles = (score: number) => {
    if (score === 0) return "bg-slate-900/50 text-slate-700 border-slate-800 opacity-20";
    if (score >= 1) return "bg-emerald-900/40 text-emerald-200 border-emerald-800/40 italic";
    if (score <= -1) return "bg-red-900/40 text-red-200 border-red-800/40 italic";
    return "bg-slate-900 text-slate-700 border-slate-800";
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-800 w-full overflow-hidden">
        <h2 className="text-sm sm:text-lg font-black text-slate-100 uppercase italic tracking-tight flex items-center gap-2 mb-4">
          <Sword className="w-4 h-4 text-emerald-500" /> Offensive Matrix
        </h2>
        <div className="w-full">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className="h-10 border border-slate-800 bg-slate-950 text-slate-600 text-[7px] sm:text-[9px] uppercase font-black w-[20%] sm:w-24">Defender</th>
                {team.map((p, i) => (
                  <th key={i} className="h-10 border border-slate-800 bg-slate-950">
                    {p ? <img src={p.sprite} className="w-6 h-6 sm:w-8 sm:h-8 object-contain mx-auto" /> : <span className="text-[7px] text-slate-800">{i+1}</span>}
                  </th>
                ))}
                <th className="h-10 border-y border-r border-slate-800 border-l-4 border-l-slate-700 bg-slate-950 text-emerald-400 text-[8px] sm:text-[10px] uppercase font-black w-[15%] sm:w-20 italic">Net</th>
              </tr>
            </thead>
            <tbody>
              {relevantTypes.map((type, rowIndex) => {
                const rowTotal = teamCoverage.find(t => t.type === type)!;
                return (
                  <tr key={type}>
                    <td className="p-0 border border-slate-800 bg-slate-900 relative" onMouseEnter={() => setHoveredType(type)} onMouseLeave={() => setHoveredType(null)}>
                      <div className="w-full py-2 text-white text-[7px] sm:text-[9px] font-black uppercase text-center cursor-help" style={{ backgroundColor: TYPE_COLORS[type] }}>{type}</div>
                      <TypeTooltip type={type} generation={generation} visible={hoveredType === type} mode="offensive" isLast={rowIndex >= relevantTypes.length - 5} />
                    </td>
                    {team.map((p, i) => {
                      const m = p ? getBestEffectiveness(type, p) : -1;
                      return <td key={i} className="p-0 border border-slate-800 text-center bg-slate-900/20 text-[9px] sm:text-[11px] font-bold">
                        {m !== -1 && m !== 1 && <span className={m > 1 ? 'text-emerald-400' : m === 0 ? 'text-indigo-400' : 'text-red-400'}>{m === 0 ? '0' : m === 0.5 ? '½' : m === 0.25 ? '¼' : `${m}x`}</span>}
                      </td>;
                    })}
                    <td className="p-0 border-y border-r border-slate-800 border-l-4 border-l-slate-700 bg-slate-950 text-center">
                      <div className={`w-full py-2 text-[10px] sm:text-xs font-black border ${getScoreStyles(rowTotal.score)}`}>{rowTotal.score > 0 ? `+${rowTotal.score}` : rowTotal.score === 0 ? '-' : rowTotal.score}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-slate-900/50 rounded-3xl border border-slate-800/60 p-5 shadow-xl relative overflow-hidden min-h-[140px]">
        {!insights ? (
          <div className="absolute inset-0 z-10 backdrop-blur-sm bg-slate-900/60 flex flex-col items-center justify-center p-4 text-center">
            <Lock className="w-5 h-5 text-slate-600 mb-2" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Add <span className="text-emerald-400">6 Pokemon</span> for<br/>Offensive Analysis</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-4"><Zap className="w-4 h-4 text-emerald-400" /><h3 className="text-xs font-black text-white uppercase italic tracking-tight">Offensive Analysis</h3></div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.recommendations.map(rec => (
                  <div key={rec.gap} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2"><span className="text-[9px] font-black text-slate-500 uppercase">Gap vs:</span><div className="px-2 py-0.5 rounded text-[8px] font-black uppercase text-white" style={{ backgroundColor: TYPE_COLORS[rec.gap] }}>{rec.gap}</div></div>
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-slate-800/50"><span className="w-full text-[8px] font-black text-emerald-400/60 uppercase tracking-tighter mb-1">Counter Moves:</span>{rec.suggestedMoves.map(sm => (<div key={sm} className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase text-white ring-1 ring-white/5" style={{ backgroundColor: TYPE_COLORS[sm] }}>{sm}</div>))}</div>
                  </div>
                ))}
              </div>
              {insights.swapOut && insights.swapIn && (
                <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
                  <div className="flex items-center gap-3 shrink-0"><ArrowLeftRight className="w-5 h-5 text-emerald-400" /><span className="text-[10px] font-black text-emerald-300 uppercase italic tracking-widest">Recommended Swap</span></div>
                  <div className="flex-1 flex items-center justify-around w-full">
                    <div className="flex flex-col items-center gap-1">
                      <div className="relative"><img src={insights.swapOut.sprite} className="w-10 h-10 object-contain grayscale opacity-60" /><div className="absolute inset-0 flex items-center justify-center"><Trash2 className="w-4 h-4 text-red-500/80" /></div></div>
                      <span className="text-[8px] font-black text-slate-500">OUT</span><span className="text-[9px] font-black text-white uppercase truncate max-w-[80px]">{insights.swapOut.name}</span>
                    </div>
                    <div className="h-8 w-px bg-emerald-500/20 mx-2" />
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center"><UserPlus className="w-5 h-5 text-emerald-400" /></div>
                      <span className="text-[8px] font-black text-emerald-400">IN</span><span className="text-[9px] font-black text-white uppercase text-center leading-tight">{insights.swapIn.pokemon}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
