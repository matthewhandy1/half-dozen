
import React, { useState, useMemo } from 'react';
import { PokemonTeam, PokemonData } from '../types';
import { getChartForGen, getTypesForGen, TYPE_COLORS } from '../constants';
import { ShieldAlert, ShieldPlus, Lightbulb, Lock, ArrowLeftRight, Trash2, UserPlus, Loader2 } from 'lucide-react';
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

  const insights = useMemo(() => {
    const activeMembers = team.filter((p): p is PokemonData => p !== null);
    if (activeMembers.length < 6) return null;

    const criticalWeaknesses = [...teamTotals].filter(t => t.score > 0).sort((a, b) => b.score - a.score);
    let swapOut = null; 
    let swapIn = null;
    let reason = "";

    if (criticalWeaknesses.length > 0) {
      const topThreat = criticalWeaknesses[0].type;
      const membersWeakToThreat = activeMembers.filter(p => getEffectivenessInfo(topThreat, p).multiplier > 1);
      
      if (membersWeakToThreat.length > 0) {
        swapOut = membersWeakToThreat.sort((a, b) => {
          const aWeakCount = relevantTypes.filter(t => getEffectivenessInfo(t, a).multiplier > 1).length;
          const bWeakCount = relevantTypes.filter(t => getEffectivenessInfo(t, b).multiplier > 1).length;
          
          const aBST = a.stats.reduce((acc, s) => acc + s.value, 0);
          const bBST = b.stats.reduce((acc, s) => acc + s.value, 0);

          // Score: Higher is better to swap out
          // Weight weaknesses heavily, but use BST as a tie-breaker or secondary factor
          const aScore = (aWeakCount * 50) + (600 - aBST);
          const bScore = (bWeakCount * 50) + (600 - bBST);
          
          return bScore - aScore;
        })[0];
        
        const bst = swapOut.stats.reduce((acc, s) => acc + s.value, 0);
        reason = `${swapOut.name} is weak to ${topThreat.toUpperCase()} and has a relatively lower stat total (${bst} BST), making it the prime candidate for replacement to cover your team's biggest defensive gap (+${criticalWeaknesses[0].score} net weakness).`;
      }

      const idealDefTypes: string[] = [];
      relevantTypes.forEach(t => { if ((chart[topThreat]?.[t] ?? 1) < 1) idealDefTypes.push(t); });
      const archetypeKey = Object.keys(DEFENSIVE_ARCHETYPES).find(key => DEFENSIVE_ARCHETYPES[key].types.some(type => idealDefTypes.includes(type)));
      
      swapIn = archetypeKey ? DEFENSIVE_ARCHETYPES[archetypeKey] : { pokemon: 'Any ' + (idealDefTypes[0] || 'Steel') + ' type', types: [idealDefTypes[0] || 'steel'], id: idealDefTypes[0] || 'steel' };
      
      if (swapIn) {
        reason += ` ${swapIn.pokemon} is recommended because its ${swapIn.types.join('/')} typing provides a crucial resistance to ${topThreat.toUpperCase()}.`;
      }
    }

    return {
      recommendations: criticalWeaknesses.slice(0, 3).map(weakness => {
        const idealDefenders: string[] = [];
        relevantTypes.forEach(potentialDefType => {
          if ((chart[weakness.type]?.[potentialDefType] ?? 1) < 1) idealDefenders.push(potentialDefType);
        });
        return { threat: weakness.type, score: weakness.score, suggestedTypes: idealDefenders.slice(0, 4) };
      }),
      swapOut, swapIn, reason
    };
  }, [teamTotals, team, generation]);

  const handleSwap = async () => {
    if (!onReplace || !insights?.swapOut || !insights?.swapIn || isReplacing) return;
    const index = team.findIndex(p => p?.id === insights.swapOut?.id);
    if (index === -1) return;
    
    setIsReplacing(true);
    await onReplace(index, insights.swapIn.id);
    setIsReplacing(false);
  };

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
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[600px] table-fixed border-collapse">
            <thead>
              <tr>
                <th className="h-10 border border-slate-800 bg-slate-950 text-slate-600 text-[7px] sm:text-[9px] uppercase font-black w-14 sm:w-16">Attacker</th>
                {team.map((p, i) => (
                  <th key={i} className="h-10 border border-slate-800 bg-slate-950 w-10 sm:w-12">
                    {p ? <img src={p.sprite} className="w-6 h-6 sm:w-8 sm:h-8 object-contain mx-auto" /> : <span className="text-[7px] text-slate-800">{i+1}</span>}
                  </th>
                ))}
                <th className="h-10 border border-slate-800 bg-slate-950 text-red-400/60 text-[7px] sm:text-[8px] uppercase font-black w-10 sm:w-12 italic">Weak</th>
                <th className="h-10 border border-slate-800 bg-slate-950 text-emerald-400/60 text-[7px] sm:text-[8px] uppercase font-black w-10 sm:w-12 italic">Resist</th>
                <th className="h-10 border-y border-r border-slate-800 border-l-4 border-l-slate-700 bg-slate-950 text-indigo-400 text-[8px] sm:text-[10px] uppercase font-black w-12 sm:w-16 italic">Net</th>
              </tr>
            </thead>
            <tbody>
              {relevantTypes.map((type, rowIndex) => {
                const rowTotal = teamTotals.find(t => t.type === type)!;
                return (
                  <tr key={type}>
                    <td className="p-0 border border-slate-800 bg-slate-900 relative" onMouseEnter={() => setHoveredType(type)} onMouseLeave={() => setHoveredType(null)}>
                      <div className="w-full py-2 text-white text-[7px] sm:text-[9px] font-black uppercase text-center cursor-help" style={{ backgroundColor: TYPE_COLORS[type] }}>{type}</div>
                      <TypeTooltip type={type} generation={generation} visible={hoveredType === type} mode="defensive" isLast={rowIndex >= relevantTypes.length - 5} />
                    </td>
                    {team.map((p, i) => {
                      const multiplier = p ? getEffectivenessInfo(type, p).multiplier : 1;
                      return <td key={i} className="p-0 border border-slate-800 text-center bg-slate-900/20 text-[9px] sm:text-[11px] font-bold">
                        {p && multiplier !== 1 && <span className={multiplier > 1 ? 'text-red-400' : multiplier === 0 ? 'text-indigo-400' : 'text-emerald-400'}>{multiplier === 0 ? '0' : multiplier === 0.5 ? '½' : multiplier === 0.25 ? '¼' : `${multiplier}x`}</span>}
                      </td>;
                    })}
                    <td className="p-0 border border-slate-800 bg-slate-950 text-center">
                      <div className="w-full py-2 text-[10px] sm:text-xs font-black" style={getIntensityStyles(rowTotal.weak, 'weak')}>{rowTotal.weak || '-'}</div>
                    </td>
                    <td className="p-0 border border-slate-800 bg-slate-950 text-center">
                      <div className="w-full py-2 text-[10px] sm:text-xs font-black" style={getIntensityStyles(rowTotal.resist, 'resist')}>{rowTotal.resist || '-'}</div>
                    </td>
                    <td className="p-0 border-y border-r border-slate-800 border-l-4 border-l-slate-700 bg-slate-950 text-center">
                      <div className="w-full py-2 text-[10px] sm:text-xs font-black" style={getIntensityStyles(rowTotal.score, 'net')}>{rowTotal.score > 0 ? `+${rowTotal.score}` : rowTotal.score === 0 ? '-' : rowTotal.score}</div>
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
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Add <span className="text-indigo-400">6 Pokemon</span> for<br/>Defensive Analysis</p>
          </div>
        ) : insights.recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center animate-in fade-in duration-500">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
              <ShieldPlus className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-sm font-black text-white uppercase italic tracking-tight mb-1">Team is Well Balanced</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No critical defensive gaps detected.</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-4"><ShieldPlus className="w-4 h-4 text-indigo-400" /><h3 className="text-xs font-black text-white uppercase italic tracking-tight">Defensive Analysis</h3></div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.recommendations.map(rec => (
                  <div key={rec.threat} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2"><span className="text-[9px] font-black text-slate-500 uppercase">Weak to:</span><div className="px-2 py-0.5 rounded text-[8px] font-black uppercase text-white" style={{ backgroundColor: TYPE_COLORS[rec.threat] }}>{rec.threat}</div></div>
                    <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-slate-800/50"><span className="w-full text-[8px] font-black text-indigo-400/60 uppercase tracking-tighter mb-1">Counter Types:</span>{rec.suggestedTypes.map(st => (<div key={st} className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase text-white ring-1 ring-white/5" style={{ backgroundColor: TYPE_COLORS[st] }}>{st}</div>))}</div>
                  </div>
                ))}
              </div>
              {insights.swapOut && insights.swapIn && (
                <div className="space-y-3">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">
                        {insights.reason}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSwap}
                    disabled={isReplacing}
                    className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 transition-all group active:scale-[0.99] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3 shrink-0">
                      {isReplacing ? <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> : <ArrowLeftRight className="w-5 h-5 text-indigo-400 group-hover:rotate-180 transition-transform duration-500" />}
                      <span className="text-[10px] font-black text-indigo-300 uppercase italic tracking-widest">Click to Swap</span>
                    </div>
                    <div className="flex-1 flex items-center justify-around w-full">
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative">
                          <img src={insights.swapOut.sprite} className="w-10 h-10 object-contain grayscale opacity-60" />
                          <div className="absolute inset-0 flex items-center justify-center"><Trash2 className="w-4 h-4 text-red-500/80" /></div>
                        </div>
                        <span className="text-[8px] font-black text-slate-500">OUT</span>
                        <span className="text-[9px] font-black text-white uppercase truncate max-w-[80px]">{insights.swapOut.name}</span>
                      </div>
                      <div className="h-8 w-px bg-indigo-500/20 mx-2" />
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-indigo-900/40 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-600/40 transition-colors">
                          <UserPlus className="w-5 h-5 text-indigo-400" />
                        </div>
                        <span className="text-[8px] font-black text-indigo-400">IN</span>
                        <span className="text-[9px] font-black text-white uppercase text-center leading-tight">{insights.swapIn.pokemon}</span>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
