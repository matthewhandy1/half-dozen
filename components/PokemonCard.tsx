
import React, { useState, useEffect, useRef } from 'react';
import { PokemonData, MoveDetails, SelectedMove } from '../types';
import { POKEMON_TYPES, TYPE_COLORS } from '../constants';
import { Search, X, Edit3, Disc, Check, Settings2, Zap, ShieldCheck, Trash2, PackagePlus, Info, Fingerprint } from 'lucide-react';
import { fetchPokemon, fetchMoveDetails } from '../services/pokeApi';
import { ControlTooltip, AbilityTooltip } from './PokemonSharedUI';
import { MoveSearchSelector } from './PokemonSelectors';

interface PokemonCardProps {
  index: number;
  pokemon: PokemonData | null;
  onSelect: (index: number, pokemon: PokemonData | null) => void;
  onSaveToBox: (pokemon: PokemonData) => void;
  pokemonList: { name: string; id: number }[];
  allMovesList: string[];
  allItemsList: string[];
  generation: number;
}

const INFLUENTIAL_ABILITIES = [
  'levitate', 'thick-fat', 'sap-sipper', 'volt-absorb', 
  'water-absorb', 'flash-fire', 'earth-eater', 
  'well-baked-body', 'wind-rider', 'purifying-salt', 'heatproof'
];

export const PokemonCard: React.FC<PokemonCardProps> = ({ 
  index, pokemon, onSelect, onSaveToBox, pokemonList, allMovesList, generation 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPkmnOpen, setIsPkmnOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isArchitectOpen, setIsArchitectOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempNickname, setTempNickname] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supportsAbilities = generation >= 3;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPkmnOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (val: string | number) => {
    try {
      const data = await fetchPokemon(val);
      onSelect(index, data);
      setIsPkmnOpen(false);
      setSearchTerm('');
      setHighlightedIndex(0);
    } catch (err) { console.error(err); }
  };

  const filteredPkmn = pokemonList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 20);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isPkmnOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setIsPkmnOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % filteredPkmn.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + filteredPkmn.length) % filteredPkmn.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPkmn[highlightedIndex]) handleSearch(filteredPkmn[highlightedIndex].id);
    } else if (e.key === 'Escape') {
      setIsPkmnOpen(false);
    }
  };

  const handleToggleAbility = (abilityName: string) => {
    if (!pokemon || !supportsAbilities) return;
    onSelect(index, { ...pokemon, selectedAbility: abilityName });
  };

  const handleMoveChange = async (moveIndex: number, moveName: string) => {
    if (pokemon) {
      const newMoves = [...pokemon.selectedMoves];
      let type = '', damageClass = '', power = null;
      try {
        const details = await fetchMoveDetails(moveName);
        type = details.type; damageClass = details.damageClass; power = details.power;
      } catch (e) {}
      newMoves[moveIndex] = { name: moveName, type, damageClass, power };
      onSelect(index, { ...pokemon, selectedMoves: newMoves });
    }
  };

  const handleSaveInstance = () => {
    if (!pokemon) return;
    setSaving(true);
    onSaveToBox(pokemon);
    setTimeout(() => setSaving(false), 1500);
  };

  const handleTypeChange = (typeIndex: number, newType: string) => {
    if (!pokemon) return;
    const currentTypes = pokemon.customTypes || pokemon.types.map(t => t.name);
    const updated = [...currentTypes];
    updated[typeIndex] = newType;
    onSelect(index, { ...pokemon, customTypes: updated });
  };

  const handleSaveNickname = () => {
    if (pokemon) onSelect(index, { ...pokemon, nickname: tempNickname });
  };

  const cardBackgroundStyle = pokemon ? {
    background: pokemon.dominantColors 
      ? `linear-gradient(135deg, ${pokemon.dominantColors[0]}20, ${pokemon.dominantColors[1]}40)` 
      : `linear-gradient(135deg, #ffffff05, #ffffff15)`,
    borderColor: pokemon.dominantColors ? `${pokemon.dominantColors[0]}40` : `#ffffff15`
  } : {};

  const influentialAbilities = pokemon?.abilities.filter(a => 
    INFLUENTIAL_ABILITIES.includes(a.name.toLowerCase())
  ) || [];

  const movesPool = pokemon?.availableMoves ?? [];

  return (
    <>
      <div className="flex flex-col h-full group/card relative z-0 hover:z-50" ref={dropdownRef}>
        <div className={`bg-slate-900 rounded-[2rem] shadow-xl border border-slate-800 transition-all duration-300 w-full h-full flex flex-col ${saving ? 'ring-2 ring-emerald-500' : ''}`} style={cardBackgroundStyle}>
          {!pokemon ? (
            <div className="p-6 flex-1 flex flex-col items-center justify-center">
              <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-[10px] mb-4 italic">Slot {index + 1}</p>
              <div className="w-full relative z-10">
                <input type="text" placeholder="Add Pokemon" className="w-full px-4 py-4 rounded-2xl bg-slate-950 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-100 font-bold text-[10px] sm:text-xs uppercase text-center italic" value={searchTerm} onFocus={() => setIsPkmnOpen(true)} onChange={(e) => { setSearchTerm(e.target.value); setIsPkmnOpen(true); }} onKeyDown={handleKeyDown} />
                {isPkmnOpen && filteredPkmn.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 z-[110] max-h-40 overflow-y-auto scrollbar-thin">
                    {filteredPkmn.map((p, idx) => (<button key={p.id} onClick={() => handleSearch(p.id)} className={`w-full text-left px-4 py-3 border-b border-slate-800 last:border-0 font-bold text-xs uppercase transition-colors ${idx === highlightedIndex ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>{p.name}</button>))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col relative p-4 gap-1 h-full cursor-pointer lg:cursor-default items-center" onClick={() => { if(window.innerWidth < 1024) { setTempNickname(pokemon.nickname || ''); setIsArchitectOpen(true); } }}>
              <div className="hidden lg:flex absolute top-4 left-4 z-20 gap-2">
                <div className="relative group">
                  <button onClick={(e) => { e.stopPropagation(); setTempNickname(pokemon.nickname || pokemon.name); setIsEditing(!isEditing); }} className={`p-2 rounded-xl transition-all ${isEditing ? 'text-indigo-400 bg-indigo-500/10' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}><Edit3 className="w-3.5 h-3.5" /></button>
                  <ControlTooltip text="Set Nickname" />
                </div>
                <div className="relative group">
                  <button onClick={(e) => { e.stopPropagation(); handleSaveInstance(); }} className={`p-2 rounded-xl transition-all ${saving ? 'bg-emerald-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}>{saving ? <Check className="w-3.5 h-3.5" /> : <Disc className="w-3.5 h-3.5" />}</button>
                  <ControlTooltip text="Save to Box" />
                </div>
              </div>
              <div className="hidden lg:flex absolute top-4 right-4 z-20"><button onClick={(e) => { e.stopPropagation(); onSelect(index, null); }} className="p-2 rounded-xl bg-slate-800/60 text-slate-400 hover:text-red-400 transition-all"><X className="w-3.5 h-3.5" /></button></div>

              <div className={`relative w-16 h-16 sm:w-18 lg:w-20 transition-transform duration-500 flex items-center justify-center`}>
                <img src={pokemon.sprite} alt={pokemon.name} className="w-full h-full object-contain drop-shadow-2xl" />
              </div>

              {!isEditing && (
                <div className="text-center w-full">
                  <h3 className="text-[11px] sm:text-sm font-black text-slate-100 uppercase italic truncate tracking-tight mb-1">{pokemon.nickname || pokemon.name}</h3>
                  <div className="flex flex-wrap gap-1 items-center justify-center">
                    {(pokemon.customTypes || pokemon.types.map(t => t.name)).map((tName, i) => (
                      <span key={i} className="inline-flex items-center justify-center w-14 h-3.5 sm:h-4 rounded-md text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-white ring-1 ring-white/10" style={{ backgroundColor: TYPE_COLORS[tName] }}>{tName}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col w-full mt-2">
                {isEditing ? (
                  <div className="flex flex-col gap-2 animate-in slide-in-from-top-1 px-1" onClick={e => e.stopPropagation()}>
                    <input autoFocus className="w-full bg-slate-950 border border-slate-800 text-[10px] font-black text-white py-2 px-3 rounded-xl outline-none uppercase" value={tempNickname} onChange={e => setTempNickname(e.target.value)} onBlur={handleSaveNickname} />
                    <button onClick={() => setIsEditing(false)} className="w-full py-2 bg-indigo-600 text-white text-[9px] font-black uppercase italic rounded-xl">Confirm</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 pt-3 border-t border-slate-800/40 w-full">
                    <div className="hidden lg:grid grid-cols-1 gap-1">
                      {[0, 1, 2, 3].map(i => (<MoveSearchSelector key={i} selectedMove={pokemon.selectedMoves[i]} onChange={(val) => handleMoveChange(i, val)} placeholder={`Move ${i+1}`} options={movesPool} globalOptions={allMovesList} openUpwards={i > 1} />))}
                    </div>
                    <div className="lg:hidden flex flex-col items-center gap-1 w-full opacity-50">
                      <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Tap to Configure</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isArchitectOpen && pokemon && (
        <div className="fixed inset-0 z-[400] bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-4">
              <img src={pokemon.sprite} className="w-14 h-14 object-contain" />
              <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tight">{pokemon.name}</h2>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Configure Pokemon</p>
              </div>
            </div>
            <button onClick={() => setIsArchitectOpen(false)} className="p-3 text-slate-500"><X className="w-8 h-8" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-4xl mx-auto w-full pb-32">
            <section className="bg-slate-900/40 rounded-[2rem] p-6 border border-slate-800/50">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Fingerprint className="w-4 h-4 text-indigo-400" /> Nickname & Types</h3>
              <div className="space-y-4">
                <input className="w-full bg-slate-900 border border-slate-800 text-lg font-black text-white p-5 rounded-2xl outline-none uppercase italic" value={tempNickname} placeholder="Set nickname..." onChange={e => { setTempNickname(e.target.value); onSelect(index, { ...pokemon, nickname: e.target.value }); }} />
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1].map(i => (
                    <select key={i} className="w-full bg-slate-900 text-xs font-bold uppercase rounded-2xl p-4 border border-slate-800 text-slate-300" value={(pokemon.customTypes || pokemon.types.map(t => t.name))[i] || 'none'} onChange={(e) => handleTypeChange(i, e.target.value)}>
                      <option value="none">None</option>
                      {POKEMON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ))}
                </div>
              </div>
            </section>
            {supportsAbilities && (
              <section className="bg-slate-900/40 rounded-[2rem] p-6 border border-slate-800/50">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-400" /> Abilities</h3>
                <div className="flex flex-col gap-3">
                  {pokemon.abilities.map(ability => (
                    <button key={ability.name} onClick={() => handleToggleAbility(ability.name)} className={`text-left p-5 rounded-2xl border transition-all ${pokemon.selectedAbility === ability.name ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-black uppercase italic">{ability.name.replace(/-/g, ' ')}</span>
                        {pokemon.selectedAbility === ability.name && <Check className="w-4 h-4" />}
                      </div>
                      <p className={`text-[10px] italic leading-relaxed ${pokemon.selectedAbility === ability.name ? 'text-indigo-100' : 'text-slate-500'}`}>{ability.description}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section className="bg-slate-900/40 rounded-[2rem] p-6 border border-slate-800/50">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Zap className="w-4 h-4 text-indigo-400" /> Moves</h3>
              <div className="grid grid-cols-1 gap-4">
                {[0, 1, 2, 3].map(i => (<MoveSearchSelector key={i} selectedMove={pokemon.selectedMoves[i]} onChange={(val) => handleMoveChange(i, val)} placeholder={`Select Move ${i+1}`} options={movesPool} globalOptions={allMovesList} />))}
              </div>
            </section>
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 flex gap-3 z-50">
            <button onClick={handleSaveInstance} className={`flex-1 py-5 rounded-2xl font-black uppercase text-xs transition-all ${saving ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white shadow-lg'}`}>{saving ? 'Saved to Box' : 'Save to Box'}</button>
            <button onClick={() => { onSelect(index, null); setIsArchitectOpen(false); }} className="flex-1 py-5 bg-slate-800 text-slate-400 hover:text-red-400 rounded-2xl font-black uppercase text-xs border border-slate-700">Remove Pokemon</button>
          </div>
        </div>
      )}
    </>
  );
};
