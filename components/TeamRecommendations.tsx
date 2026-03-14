
import React from 'react';
import { PokemonTeam, PokemonData } from '../types';
import { getChartForGen, getTypesForGen, TYPE_COLORS } from '../constants';
import { Shield, Sword, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

interface TeamRecommendationsProps {
  team: PokemonTeam;
  generation: number;
}

export const TeamRecommendations: React.FC<TeamRecommendationsProps> = ({ team, generation }) => {
  const activePokemon = team.filter((p): p is PokemonData => p !== null);
  const chart = getChartForGen(generation);
  const types = getTypesForGen(generation);

  // Defensive Logic
  const getDefensiveWeaknesses = () => {
    if (activePokemon.length < 6) return null;

    const weaknessScores: Record<string, number> = {};
    types.forEach(attackType => {
      let score = 0;
      activePokemon.forEach(pkmn => {
        let multiplier = 1;
        pkmn.types.forEach(t => {
          const m = chart[attackType]?.[t.name] ?? 1;
          multiplier *= m;
        });
        
        if (multiplier > 2.1) score += 2; // 4x
        else if (multiplier > 1.1) score += 1; // 2x
        else if (multiplier < 0.1) score -= 3; // 0x
        else if (multiplier < 0.3) score -= 2; // 0.25x
        else if (multiplier < 0.6) score -= 1; // 0.5x
      });
      weaknessScores[attackType] = score;
    });

    // Sort by score descending and pick those > 0
    const topWeaknesses = Object.entries(weaknessScores)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return topWeaknesses;
  };

  // Offensive Logic
  const getOffensiveGaps = () => {
    // Check if every pokemon has at least one damaging move
    const allHaveDamagingMoves = activePokemon.length > 0 && activePokemon.every(pkmn => 
      pkmn.selectedMoves.some(m => m.power !== null && m.power > 0)
    );

    if (!allHaveDamagingMoves) return null;

    const uncoveredTypes: string[] = [];
    types.forEach(defenderType => {
      let isCovered = false;
      activePokemon.forEach(pkmn => {
        pkmn.selectedMoves.forEach(move => {
          if (move.power !== null && move.power > 0) {
            const m = chart[move.type]?.[defenderType] ?? 1;
            if (m > 1.1) isCovered = true;
          }
        });
      });
      if (!isCovered) uncoveredTypes.push(defenderType);
    });

    return uncoveredTypes;
  };

  const defensiveWeaknesses = getDefensiveWeaknesses();
  const offensiveGaps = getOffensiveGaps();

  if (!defensiveWeaknesses && !offensiveGaps) return null;

  // Helper to find types that resist a given type
  const getResistancesFor = (type: string) => {
    return types.filter(t => (chart[type]?.[t] ?? 1) < 0.6);
  };

  // Helper to find types that are super effective against a given type
  const getSuperEffectiveAgainst = (type: string) => {
    return types.filter(t => (chart[t]?.[type] ?? 1) > 1.1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Defensive Recommendations */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Defensive Strategy</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Team Weakness Analysis</p>
          </div>
        </div>

        {!defensiveWeaknesses ? (
          <div className="flex items-center gap-3 p-4 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
            <AlertCircle className="w-5 h-5 text-slate-600" />
            <p className="text-xs font-bold text-slate-500 uppercase italic">Add 6 Pokémon to see defensive gaps.</p>
          </div>
        ) : defensiveWeaknesses.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-xs font-bold text-emerald-400 uppercase italic">Your team has excellent defensive coverage!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase italic">Your team is currently vulnerable to these types:</p>
            <div className="space-y-3">
              {defensiveWeaknesses.map(([type, score]) => {
                const suggestions = getResistancesFor(type).slice(0, 3);
                return (
                  <div key={type} className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-sm"
                        style={{ backgroundColor: TYPE_COLORS[type] }}
                      >
                        {type}
                      </div>
                      <div className="h-1 w-12 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500" 
                          style={{ width: `${Math.min(100, (score / 6) * 100)}%` }} 
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Try adding:</span>
                      <div className="flex gap-1">
                        {suggestions.map(s => (
                          <div 
                            key={s}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black text-white uppercase shadow-sm"
                            style={{ backgroundColor: TYPE_COLORS[s] }}
                            title={s}
                          >
                            {s.slice(0, 2)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Offensive Recommendations */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400">
            <Sword className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight">Offensive Coverage</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Move Typing Analysis</p>
          </div>
        </div>

        {!offensiveGaps ? (
          <div className="flex items-center gap-3 p-4 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
            <AlertCircle className="w-5 h-5 text-slate-600" />
            <p className="text-xs font-bold text-slate-500 uppercase italic">Give every Pokémon a damaging move to see gaps.</p>
          </div>
        ) : offensiveGaps.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-xs font-bold text-emerald-400 uppercase italic">Your team can hit every type super-effectively!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase italic">You lack super-effective coverage against these types:</p>
            <div className="flex flex-wrap gap-2">
              {offensiveGaps.map(type => (
                <div key={type} className="group relative">
                  <div 
                    className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase text-white shadow-md flex items-center gap-2 border border-white/10"
                    style={{ backgroundColor: TYPE_COLORS[type] }}
                  >
                    {type}
                    <div className="w-1 h-1 rounded-full bg-white/40" />
                    <div className="flex gap-0.5">
                      {getSuperEffectiveAgainst(type).slice(0, 2).map(s => (
                        <Zap key={s} className="w-2.5 h-2.5 text-white/80" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Tooltip for suggestions */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl shadow-2xl whitespace-nowrap">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Add moves of type:</p>
                      <div className="flex gap-1">
                        {getSuperEffectiveAgainst(type).map(s => (
                          <span key={s} className="text-[8px] font-black text-white uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: TYPE_COLORS[s] }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
