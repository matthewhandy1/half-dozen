
import React from 'react';
import { SavedEnemyTeam, PokemonTeam } from '../types';
import { X, Trash2, ShieldAlert, Calendar, ArrowRight, Trophy } from 'lucide-react';

interface EnemyTeamsModalProps {
  teams: SavedEnemyTeam[];
  onClose: () => void;
  onDeleteTeam: (id: string) => void;
  onLoadTeam: (team: PokemonTeam) => void;
}

export const EnemyTeamsModal: React.FC<EnemyTeamsModalProps> = ({ teams, onClose, onDeleteTeam, onLoadTeam }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-[3rem] shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Rival Scouting Data</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{teams.length} Intelligence Files</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-2xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          {teams.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 text-slate-700">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-400 mb-2">No Rival Intel Found</h3>
              <p className="text-slate-600 text-sm max-w-xs">Save teams in the Enemy Scouting section to track your opponents.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((t) => (
                <div key={t.id} className="bg-slate-950/50 border border-slate-800 rounded-3xl p-6 group hover:border-red-900/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {t.id === 'trainer-red-classic' && <Trophy className="w-4 h-4 text-yellow-500" />}
                      <h3 className="text-lg font-black text-white uppercase italic tracking-tight">{t.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-slate-600">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Recon Log: {new Date(t.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      {t.pokemon.map((p, idx) => (
                        p ? (
                          <div key={idx} className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center p-1">
                            <img src={p.sprite} alt={p.name} className="w-full h-full object-contain" title={p.name} />
                          </div>
                        ) : (
                          <div key={idx} className="w-10 h-10 bg-slate-900 border border-dashed border-slate-800 rounded-xl" />
                        )
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {t.id !== 'trainer-red-classic' && (
                      <button 
                        onClick={() => onDeleteTeam(t.id)}
                        className="p-3 text-slate-700 hover:text-red-500 transition-colors bg-slate-900 rounded-2xl hover:bg-slate-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => onLoadTeam(t.pokemon as PokemonTeam)}
                      className="flex items-center gap-3 px-6 py-3 bg-red-900 hover:bg-red-800 text-white rounded-2xl font-black uppercase italic text-xs transition-all shadow-lg group/btn"
                    >
                      Deploy Counter-Scout <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
