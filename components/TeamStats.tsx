
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PokemonTeam } from '../types';
import { STAT_ABBREVIATIONS } from '../constants';
import { X, BarChart3, TrendingUp } from 'lucide-react';

interface TeamStatsProps {
  team: PokemonTeam;
  onClose: () => void;
}

export const TeamStats: React.FC<TeamStatsProps> = ({ team, onClose }) => {
  const activePokemon = team.filter((p): p is NonNullable<typeof p> => p !== null);
  
  const getAverageStats = () => {
    const statsMap: Record<string, number> = {
      hp: 0,
      attack: 0,
      defense: 0,
      'special-attack': 0,
      'special-defense': 0,
      speed: 0,
    };

    if (activePokemon.length === 0) {
      return Object.keys(statsMap).map(key => ({
        name: STAT_ABBREVIATIONS[key] || key,
        value: 0
      }));
    }

    activePokemon.forEach(pkmn => {
      pkmn.stats.forEach(s => {
        if (statsMap[s.name] !== undefined) {
          statsMap[s.name] += s.value;
        }
      });
    });

    return Object.keys(statsMap).map(key => ({
      name: STAT_ABBREVIATIONS[key] || key,
      value: Math.round(statsMap[key] / activePokemon.length)
    }));
  };

  const data = getAverageStats();

  const getBarColor = (val: number) => {
    if (val < 60) return '#ef4444'; // red-500
    if (val < 90) return '#f59e0b'; // yellow-500
    if (val < 120) return '#10b981'; // emerald-500
    return '#3b82f6'; // blue-500
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl sm:rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-none flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 sm:p-8 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white uppercase italic tracking-tight">Team Analytics</h2>
              <p className="text-slate-500 text-[9px] sm:text-xs font-bold uppercase tracking-widest">Base Stat Averages</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-xl sm:rounded-2xl">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-10 scrollbar-thin">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
            <div className="bg-slate-950/50 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">BST Average</span>
              <span className="text-2xl sm:text-3xl font-black text-white italic">
                {data.reduce((sum, item) => sum + item.value, 0)}
              </span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Strongest Stat</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 italic">
                {data.length > 0 ? [...data].sort((a, b) => b.value - a.value)[0].name : '—'}
              </span>
            </div>
            <div className="bg-slate-950/50 border border-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
              <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Focus Bias</span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-400 italic">
                {data.find(d => d.name === 'SPE')?.value && data.find(d => d.name === 'SPE')!.value > 100 ? 'Hyper Offense' : 'Balanced'}
              </span>
            </div>
          </div>

          <div className="h-[250px] sm:h-[350px] w-full bg-slate-950/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800/50">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis domain={[0, 180]} hide />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950 p-3 rounded-xl shadow-2xl border border-slate-700">
                          <p className="text-sm font-black text-slate-100 uppercase">{payload[0].payload.name}: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(Number(entry.value))} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3">
             <div className="flex items-center gap-2">
               <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
               <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Compared to standard competitive tier benchmarks</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
