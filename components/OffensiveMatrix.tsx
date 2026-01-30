
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

  const getScoreStyles = (score: number) => {
    // Scaling color intensity for positive scores (Coverage)
    if (score >= 5) return "bg-emerald-500 text-white border-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.8)] scale-110 z-20 font-black";
    if (score >= 3) return "bg-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(5,150,105,0.6)] z-20";
    if (score >= 1) return "bg-emerald-900/80 text-emerald-200 border-emerald-800/50";
    
    // Scaling color intensity for negative scores (Poor Coverage)
    if (score <= -5) return "bg-red-500 text-white border-red-200 shadow-[0_0_25px_rgba(239,68,68,0.8)] scale-110 z-20 font-black";
    if (score <= -3) return "bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.6)] z-20";
    if (score <= -1) return "bg-red-900/80 text-red-200 border-red-800/50";

    return "bg-slate-950 text-slate-700 border-slate-800";
  };

  const getBadgeStyles = (m: number) => {
     if (m >= 2) return "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] z-10";
     if (m === 0) return "bg-indigo-600 text-white border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.3)]";
     if (m > 0 && m < 1) return "bg-red-900 text-red-100 border-red-700/50";
     return "";
  };

  return (
    <div className="bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-8 shadow-2xl border border-slate-800 w-full overflow-hidden">
      <h2 className="text-lg sm:text-2xl font-black text-slate-100 mb-4 sm:mb-6 px-1 uppercase italic tracking-tight flex items-center gap-2">
        <Sword className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-500" />
        Offensive Matrix
      </h2>

      <div className="w-full">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className="h-12 sm:h-20 p-1 sm:p-3 border border-slate-800 bg-slate-950 text-slate-500 text-[7px] sm:text-[10px] uppercase font-black w-[50px] sm:w-20">DEF</th>
              {team.map((p, i) => (
                <th key={i} className="h-12 sm:h-20 p-1 sm:p-3 border border-slate-800 bg-slate-950">
                  {p ? (
                    <img src={p.sprite} className="w-6 h-6 sm:w-10 sm:h-10 object-contain mx-auto" />
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
              const rowCoverage = teamCoverage.find(t => t.type === type)!;
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
                    const m = p ? getBestEffectiveness(type, p) : -1;
                    
                    let badge = null;
                    if (m >= 2) {
                      badge = <div className={`w-full py-1 sm:py-1.5 rounded sm:rounded-lg text-[8px] sm:text-[11px] font-black border sm:border-2 transition-all ${getBadgeStyles(m)}`}>SE</div>;
                    } else if (m === 0) {
                      badge = <div className={`w-full py-1 sm:py-1.5 rounded sm:rounded-lg text-[8px] sm:text-[11px] font-black border sm:border-2 transition-all ${getBadgeStyles(m)}`}>IM</div>;
                    } else if (m > 0 && m < 1) {
                      badge = <div className={`w-full py-1 sm:py-1.5 rounded sm:rounded-lg text-[8px] sm:text-[11px] font-black border sm:border-2 transition-all ${getBadgeStyles(m)}`}>RS</div>;
                    }

                    return (
                      <td key={i} className="p-0.5 sm:p-1 border border-slate-800 text-center bg-slate-900/40 relative">
                        {badge}
                      </td>
                    );
                  })}
                  <td className="p-0.5 sm:p-1 border border-slate-800 bg-slate-900">
                    <div className={`w-full py-1 sm:py-1.5 rounded sm:rounded-lg text-[8px] sm:text-xs font-black text-center border sm:border-2 transition-all duration-300 ${getScoreStyles(rowCoverage.score)}`}>
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
