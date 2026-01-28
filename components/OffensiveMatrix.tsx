
import React from 'react';
import { PokemonTeam } from '../types';
import { TYPE_CHART, POKEMON_TYPES, TYPE_COLORS } from '../constants';
import { Sword } from 'lucide-react';

interface OffensiveMatrixProps {
  team: PokemonTeam;
}

export const OffensiveMatrix: React.FC<OffensiveMatrixProps> = ({ team }) => {
  const getBestEffectiveness = (defendingType: string, pokemon: NonNullable<PokemonTeam[0]>) => {
    let maxMultiplier = -1; // -1 means no damaging moves at all
    const damagingMoves = pokemon.selectedMoves.filter(m => m.name && m.damageClass !== 'status');
    if (damagingMoves.length === 0) return -1;
    
    damagingMoves.forEach(move => {
      const multiplier = TYPE_CHART[move.type]?.[defendingType] ?? 1;
      if (multiplier > maxMultiplier) maxMultiplier = multiplier;
    });
    return maxMultiplier;
  };

  const teamCoverage = POKEMON_TYPES.map(type => {
    let strength = 0;
    let resisted = 0;
    team.forEach(p => {
      if (!p) return;
      const m = getBestEffectiveness(type, p);
      if (m >= 2) strength++;
      else if (m >= 0 && m < 1) resisted++;
    });
    return { type, strength, resisted, score: strength - resisted };
  });

  const criticalStrengths = teamCoverage.filter(t => t.score > 1).sort((a, b) => b.score - a.score);

  return (
    <div className="bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 shadow-2xl border border-slate-800 w-full overflow-hidden">
      <h2 className="text-lg sm:text-2xl font-black text-slate-100 mb-4 sm:mb-6 px-2 uppercase italic tracking-tight flex items-center gap-2">
        <Sword className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-500" />
        Offensive Matrix
      </h2>

      {/* Mobile Simplified View */}
      <div className="sm:hidden space-y-4">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-2">Team Offensive Powerhouses</p>
        <div className="flex flex-wrap gap-2">
          {criticalStrengths.length > 0 ? criticalStrengths.map(cov => (
            <div key={cov.type} className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[cov.type] }} />
              <span className="text-[10px] font-black text-white uppercase">{cov.type}</span>
              <span className="text-[10px] font-black text-emerald-400">+{cov.score}</span>
            </div>
          )) : (
            <div className="w-full text-center py-4 text-slate-600 text-[10px] font-black uppercase italic">Add Damaging Moves for Intel</div>
          )}
        </div>
      </div>

      {/* Desktop Detailed View */}
      <div className="hidden sm:block w-full overflow-x-auto pb-2 scrollbar-thin">
        <table className="w-full min-w-[600px] table-fixed border-collapse">
          <thead>
            <tr>
              <th className="h-20 p-3 border border-slate-800 bg-slate-950 text-slate-500 text-[10px] uppercase font-black w-20 sticky left-0 z-20">DEF</th>
              {team.map((p, i) => (
                <th key={i} className="h-20 p-3 border border-slate-800 bg-slate-950">
                  {p ? <img src={p.sprite} className="w-10 h-10 object-contain mx-auto" /> : <span className="text-[10px] text-slate-700 font-bold uppercase"># {i+1}</span>}
                </th>
              ))}
              <th className="h-20 p-3 border border-slate-800 bg-indigo-950 text-indigo-300 text-[10px] uppercase font-black w-24">Net Score</th>
            </tr>
          </thead>
          <tbody>
            {POKEMON_TYPES.map(type => {
              const rowCoverage = teamCoverage.find(t => t.type === type)!;
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
                    const m = p ? getBestEffectiveness(type, p) : -1;
                    
                    let badge = null;
                    if (m >= 2) {
                      badge = <div className="w-full py-1.5 rounded-lg text-[11px] font-black border-2 bg-emerald-950/60 text-emerald-400 border-emerald-700">SE</div>;
                    } else if (m === 0) {
                      badge = <div className="w-full py-1.5 rounded-lg text-[11px] font-black border-2 bg-indigo-950/60 text-indigo-400 border-indigo-900/50">IM</div>;
                    } else if (m > 0 && m < 1) {
                      badge = <div className="w-full py-1.5 rounded-lg text-[11px] font-black border-2 bg-red-950/60 text-red-400 border-red-900/50">RS</div>;
                    }

                    return (
                      <td key={i} className="p-1 border border-slate-800 text-center bg-slate-900/40">
                        {badge}
                      </td>
                    );
                  })}
                  <td className="p-1 border border-slate-800 bg-slate-900">
                    <div className={`w-full py-1.5 rounded-lg text-xs font-black text-center border-2 ${rowCoverage.score > 0 ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/50' : rowCoverage.score < 0 ? 'bg-red-950/60 text-red-400 border-red-900/50' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>
                      {rowCoverage.score > 0 ? `+${rowCoverage.score}` : rowCoverage.score === 0 ? '-' : rowCoverage.score}
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
