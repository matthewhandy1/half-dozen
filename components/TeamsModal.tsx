
import React, { useState } from 'react';
import { SavedTeam, PokemonTeam } from '../types';
import { X, Trash2, Edit3, Save, Users, Calendar, ArrowRight, Check } from 'lucide-react';

interface TeamsModalProps {
  teams: SavedTeam[];
  onClose: () => void;
  onDeleteTeam: (id: string) => void;
  onRenameTeam: (id: string, newName: string) => void;
  onLoadTeam: (team: PokemonTeam) => void;
}

export const TeamsModal: React.FC<TeamsModalProps> = ({ teams, onClose, onDeleteTeam, onRenameTeam, onLoadTeam }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const handleStartRename = (team: SavedTeam) => {
    setEditingId(team.id);
    setTempName(team.name);
  };

  const handleSaveRename = (id: string) => {
    onRenameTeam(id, tempName);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-[3rem] shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Saved Teams</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{teams.length} Configurations Saved</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-2xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          {teams.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 text-slate-600">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-400 mb-2">No Saved Teams</h3>
              <p className="text-slate-600 text-sm max-w-xs">Use the Save button in the Team Controls at the bottom of the page to store your favorite line-ups.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {teams.map((t) => (
                <div key={t.id} className="bg-slate-950/50 border border-slate-800 rounded-3xl p-6 group hover:border-red-500/30 transition-all flex flex-col gap-6">
                  <div className="flex items-start justify-between">
                    <div>
                      {editingId === t.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            autoFocus
                            className="bg-slate-900 border border-red-500 text-white text-lg font-black p-2 rounded-xl w-full outline-none uppercase italic"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(t.id)}
                          />
                          <button onClick={() => handleSaveRename(t.id)} className="text-emerald-500 p-2"><Check className="w-6 h-6" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 group/name">
                          <h3 className="text-xl font-black text-white uppercase italic tracking-tight leading-none">{t.name}</h3>
                          <button onClick={() => handleStartRename(t)} className="opacity-0 group-hover/name:opacity-100 transition-opacity text-slate-600 hover:text-red-400">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {new Date(t.timestamp).toLocaleDateString()} at {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => onDeleteTeam(t.id)}
                      className="p-3 text-slate-700 hover:text-red-500 transition-colors bg-slate-900 rounded-2xl hover:bg-slate-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Team Preview */}
                  <div className="bg-slate-900/50 rounded-2xl p-4 flex items-center justify-between border border-slate-800/50">
                    <div className="flex -space-x-4 overflow-hidden">
                      {t.pokemon.map((p, idx) => (
                        p ? (
                          <div key={idx} className="relative w-14 h-14 bg-slate-950 border-2 border-slate-800 rounded-full flex items-center justify-center p-1 hover:z-10 transition-transform hover:scale-110">
                            <img src={p.sprite} alt={p.name} className="w-full h-full object-contain drop-shadow-md" title={p.nickname || p.name} />
                          </div>
                        ) : (
                          <div key={idx} className="w-14 h-14 bg-slate-900 border-2 border-slate-800 border-dashed rounded-full flex items-center justify-center text-slate-700">
                            <span className="text-[10px] font-bold">{idx + 1}</span>
                          </div>
                        )
                      ))}
                    </div>
                    <button 
                      onClick={() => onLoadTeam(t.pokemon)}
                      className="flex items-center gap-3 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase italic text-xs transition-all shadow-lg shadow-red-600/20 active:scale-95 group/btn"
                    >
                      Load Team <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
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
