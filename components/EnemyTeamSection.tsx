
import React, { useState, useRef, useEffect } from 'react';
import { PokemonTeam, PokemonData } from '../types';
import { TYPE_COLORS, TYPE_CHART } from '../constants';
import { Search, X, ShieldAlert, Loader2, Save, FolderOpen, Sword, Check, AlertCircle, Trash2 } from 'lucide-react';
import { fetchPokemonBasic } from '../services/pokeApi';

interface EnemyTeamSectionProps {
  userTeam: PokemonTeam;
  enemyTeam: PokemonTeam;
  onSelectEnemy: (index: number, pokemon: PokemonData | null) => void;
  pokemonList: { name: string; id: number }[];
  onSaveEnemyTeam: (name: string) => void;
  onClearEnemyTeam: () => void;
  onOpenLoadEnemyTeams: () => void;
  isSaved?: boolean;
}

export const EnemyTeamSection: React.FC<EnemyTeamSectionProps> = ({ 
  userTeam, 
  enemyTeam, 
  onSelectEnemy, 
  pokemonList, 
  onSaveEnemyTeam, 
  onClearEnemyTeam,
  onOpenLoadEnemyTeams, 
  isSaved 
}) => {
  const [isNaming, setIsNaming] = useState(false);
  const [tempName, setTempName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNaming && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isNaming]);

  const handleConfirmSave = () => {
    if (!tempName.trim()) {
       onSaveEnemyTeam(`Rival Team ${new Date().toLocaleDateString()}`);
    } else {
       onSaveEnemyTeam(tempName.trim());
    }
    setIsNaming(false);
    setTempName('');
  };

  const handleCancelNaming = () => {
    setIsNaming(false);
    setTempName('');
  };

  const isEnemyEmpty = !enemyTeam.some(p => p !== null);

  return (
    <section className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-red-500 shrink-0" />
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-white uppercase italic tracking-tight leading-tight">Enemy Scouting</h2>
            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Identify Rival Weaknesses</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {isNaming ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-indigo-500/50 rounded-xl sm:rounded-2xl p-1 animate-in slide-in-from-right-4 duration-300 w-full sm:w-auto">
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Rival name..."
                className="bg-transparent border-none outline-none text-[10px] sm:text-xs font-black uppercase italic px-3 py-2 text-white flex-1 sm:w-48 placeholder:text-slate-700"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmSave();
                  if (e.key === 'Escape') handleCancelNaming();
                }}
              />
              <button onClick={handleConfirmSave} className="p-2 bg-indigo-600 text-white rounded-lg"><Check className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setIsNaming(true)}
                disabled={isEnemyEmpty}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs transition-all border shadow-lg ${
                  isSaved 
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-600/20' 
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                } disabled:opacity-30`}
              >
                {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{isSaved ? 'Saved!' : 'Save'}</span>
              </button>
              
              <button 
                onClick={onClearEnemyTeam}
                disabled={isEnemyEmpty}
                className="p-3 bg-slate-800 text-slate-500 hover:text-red-400 rounded-xl sm:rounded-2xl border border-slate-700 disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
          
          <button 
            onClick={onOpenLoadEnemyTeams}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs transition-all shadow-lg shadow-red-950/40"
          >
             <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
             <span>Load Data</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-8 sm:mb-12">
        {enemyTeam.map((p, i) => (
          <EnemyPokemonSelector key={i} index={i} pokemon={p} onSelect={onSelectEnemy} pokemonList={pokemonList} />
        ))}
      </div>

      <RivalMatchupMatrix userTeam={userTeam} enemyTeam={enemyTeam} />
    </section>
  );
};

const EnemyPokemonSelector: React.FC<{
  index: number;
  pokemon: PokemonData | null;
  onSelect: (index: number, pokemon: PokemonData | null) => void;
  pokemonList: { name: string; id: number }[];
}> = ({ index, pokemon, onSelect, pokemonList }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const handlePick = async (id: number) => {
    setLoading(true);
    setError(false);
    setIsOpen(false);
    try {
      const data = await fetchPokemonBasic(id);
      onSelect(index, data);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const filtered = pokemonList.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 15);

  return (
    <div className="relative group" ref={dropdownRef}>
      {!pokemon ? (
        <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 h-32 sm:h-40 flex flex-col items-center justify-center transition-all hover:border-red-500/50">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
          ) : (
            <>
              <button onClick={() => {setIsOpen(true); setHighlightedIndex(0);}} className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-2 hover:bg-red-500 hover:text-white transition-all"><Search className="w-4 h-4 sm:w-5 sm:h-5" /></button>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-700 uppercase tracking-widest leading-none">Scout {index + 1}</span>
            </>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 h-32 sm:h-40 flex flex-col items-center justify-between relative group shadow-lg">
          <button onClick={() => onSelect(index, null)} className="absolute top-1.5 right-1.5 p-1 text-slate-700 hover:text-red-500 transition-colors z-10"><X className="w-3.5 h-3.5" /></button>
          <img src={pokemon.sprite} alt={pokemon.name} className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xl" />
          <h4 className="text-[10px] sm:text-[11px] font-black text-white uppercase italic truncate w-full text-center px-1">{pokemon.name}</h4>
        </div>
      )}

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[150] overflow-hidden">
          <input autoFocus className="w-full bg-slate-950 p-3 text-[10px] sm:text-xs font-bold text-white outline-none border-b border-slate-800" placeholder="Search..." value={search} onChange={e => {setSearch(e.target.value); setHighlightedIndex(0);}} />
          <div className="max-h-40 overflow-y-auto scrollbar-thin">
            {filtered.map((p, idx) => (
              <button key={p.id} onClick={() => handlePick(p.id)} className={`w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase border-b border-slate-800/50 last:border-0 ${highlightedIndex === idx ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>{p.name}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RivalMatchupMatrix: React.FC<{ userTeam: PokemonTeam, enemyTeam: PokemonTeam }> = ({ userTeam, enemyTeam }) => {
  const getBestUserEffectiveness = (userPkmn: NonNullable<PokemonTeam[0]>, enemyPkmn: NonNullable<PokemonTeam[0]>) => {
    const enemyTypes = enemyPkmn.customTypes ? enemyPkmn.customTypes.filter(t => t !== 'none') : enemyPkmn.types.map(t => t.name);
    let maxMultiplier = 0;
    userPkmn.selectedMoves.forEach(move => {
      if (!move.name || move.damageClass === 'status') return;
      let moveMult = 1;
      enemyTypes.forEach(eType => { moveMult *= (TYPE_CHART[move.type]?.[eType] ?? 1); });
      if (moveMult > maxMultiplier) maxMultiplier = moveMult;
    });
    return maxMultiplier;
  };
  const activeUser = userTeam.filter((p): p is NonNullable<typeof p> => p !== null);
  const activeEnemy = enemyTeam.filter((p): p is NonNullable<typeof p> => p !== null);
  if (activeUser.length === 0 || activeEnemy.length === 0) return null;
  return (
    <div className="bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 shadow-2xl border border-slate-800 w-full overflow-hidden">
      <h3 className="text-lg sm:text-xl font-black text-white uppercase italic tracking-tight mb-6 px-2 flex items-center gap-3"><Sword className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" /> Matchup Matrix</h3>
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <table className="w-full min-w-[500px] table-fixed border-collapse">
          <thead>
            <tr>
              <th className="p-3 border border-slate-800 bg-slate-950 text-slate-500 text-[10px] uppercase font-black w-20 sticky left-0 z-20">YOU \ RIVAL</th>
              {activeEnemy.map((p, i) => (<th key={i} className="p-3 border border-slate-800 bg-slate-950"><img src={p.sprite} className="w-10 h-10 object-contain mx-auto" /></th>))}
            </tr>
          </thead>
          <tbody>
            {activeUser.map((userPkmn, i) => (
              <tr key={i}>
                <td className="p-1 border border-slate-800 bg-slate-900 sticky left-0 z-20 backdrop-blur-md">
                   <div className="flex flex-col items-center p-1">
                     <img src={userPkmn.sprite} className="w-8 h-8 object-contain" />
                     <span className="text-[8px] font-black text-slate-500 uppercase mt-1 truncate max-w-full text-center">{userPkmn.nickname || userPkmn.name}</span>
                   </div>
                </td>
                {activeEnemy.map((enemyPkmn, j) => {
                  const m = getBestUserEffectiveness(userPkmn, enemyPkmn);
                  return (
                    <td key={j} className="p-1 border border-slate-800 bg-slate-900/40">
                      <div className={`w-full py-2.5 rounded-lg text-xs font-black text-center border-2 ${m >= 2 ? 'bg-emerald-900/50 text-emerald-400 border-emerald-700' : m <= 0.5 ? 'bg-red-900/50 text-red-400 border-red-700' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>{m === 0 ? '0' : m === 0.25 ? '¼' : m === 0.5 ? '½' : m}x</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
