
import React, { useState, useEffect, useRef } from 'react';
import { PokemonData, MoveDetails } from '../types';
import { POKEMON_TYPES, TYPE_COLORS } from '../constants';
import { Search, X, Edit3, Disc, Check, Settings2, Zap, ShieldCheck, Trash2, PackagePlus } from 'lucide-react';
import { fetchPokemon, fetchMoveDetails } from '../services/pokeApi';
import { ControlTooltip } from './PokemonSharedUI';
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
  const supportsItems = generation >= 2;

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
      if (filteredPkmn[highlightedIndex]) {
        handleSearch(filteredPkmn[highlightedIndex].id);
      }
    } else if (e.key === 'Escape') {
      setIsPkmnOpen(false);
    }
  };

  const handleToggleAbility = (abilityName: string) => {
    if (!pokemon || !supportsAbilities) return;
    const isCurrentlySelected = pokemon.selectedAbility === abilityName;
    onSelect(index, { ...pokemon, selectedAbility: isCurrentlySelected ? '' : abilityName });
  };

  const handleMoveChange = async (moveIndex: number, moveName: string) => {
    if (pokemon) {
      const newMoves = [...pokemon.selectedMoves];
      let type = '', damageClass = '', power = null;
      try {
        const details = await fetchMoveDetails(moveName);
        type = details.type; damageClass = details.damageClass; power = details.power;
      } catch (e) { console.error(e); }
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
      ? `linear-gradient(135deg, ${pokemon.dominantColors[0]}30, ${pokemon.dominantColors[1]}60)` 
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
        <div 
          className={`bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-slate-800 transition-all duration-300 w-full h-full flex flex-col ${saving ? 'ring-2 ring-emerald-500 shadow-emerald-500/20' : ''}`} 
          style={cardBackgroundStyle}
        >
          {!pokemon ? (
            <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center">
              <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-[10px] mb-4 sm:mb-6 italic">Slot {index + 1}</p>
              <div className="w-full relative z-10 px-1 sm:px-2">
                <input 
                  type="text" 
                  placeholder="Add Pokemon" 
                  className="w-full px-2 sm:px-4 py-3 sm:py-4 rounded-2xl bg-slate-950 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-100 font-bold text-[10px] sm:text-xs uppercase text-center italic" 
                  value={searchTerm} 
                  onFocus={() => setIsPkmnOpen(true)} 
                  onChange={(e) => { setSearchTerm(e.target.value); setIsPkmnOpen(true); setHighlightedIndex(0); }}
                  onKeyDown={handleKeyDown}
                />
                {isPkmnOpen && filteredPkmn.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 z-[110] max-h-40 overflow-y-auto scrollbar-thin">
                    {filteredPkmn.map((p, idx) => (
                      <button 
                        key={p.id} 
                        onClick={() => handleSearch(p.id)} 
                        className={`w-full text-left px-4 py-3 border-b border-slate-800 last:border-0 font-bold text-xs uppercase transition-colors ${idx === highlightedIndex ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col relative p-4 sm:p-5 gap-1 h-full cursor-pointer lg:cursor-default items-center" onClick={() => { if(window.innerWidth < 1024) { setTempNickname(pokemon.nickname || ''); setIsArchitectOpen(true); } }}>
              
              <div className="hidden lg:flex absolute top-4 left-4 z-20 gap-2">
                <div className="relative group">
                  <button onClick={(e) => { e.stopPropagation(); setTempNickname(pokemon.nickname || pokemon.name); setIsEditing(!isEditing); }} className={`p-2 rounded-xl transition-all active:scale-95 ${isEditing ? 'text-indigo-400 bg-indigo-500/10' : 'bg-slate-800/60 hover:bg-indigo-600/30 text-slate-400'}`}>
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <ControlTooltip text="Label" />
                </div>
                <div className="relative group">
                  <button onClick={(e) => { e.stopPropagation(); handleSaveInstance(); }} className={`p-2 rounded-xl transition-all active:scale-95 ${saving ? 'bg-emerald-600 text-white shadow-emerald-500/40' : 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-400'}`}>
                    {saving ? <Check className="w-3.5 h-3.5" /> : <Disc className="w-3.5 h-3.5" />}
                  </button>
                  <ControlTooltip text="Stash" />
                </div>
              </div>

              <div className="hidden lg:flex absolute top-4 right-4 gap-2 z-20">
                <div className="relative group">
                  <button onClick={(e) => { e.stopPropagation(); onSelect(index, null); }} className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-600/30 hover:text-red-400 text-slate-400 transition-all active:scale-95"><X className="w-3.5 h-3.5" /></button>
                  <ControlTooltip text="Clear" />
                </div>
              </div>

              <div className="flex flex-col items-center shrink-0 w-full relative">
                <div className={`relative w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 transition-transform duration-500 ${saving ? 'animate-bounce' : ''} flex items-center justify-center`}>
                  <img src={pokemon.sprite} alt={pokemon.name} className="w-full h-full relative object-contain drop-shadow-2xl" />
                </div>
                {!isEditing && (
                  <div className="text-center px-1 w-full flex flex-col items-center">
                    <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase italic truncate text-center max-w-full px-1 tracking-tight leading-none mb-1.5">
                      {pokemon.nickname || pokemon.name}
                    </h3>
                    
                    <div className="relative flex items-center justify-center w-full min-h-[20px] px-1">
                      <div className="flex flex-wrap gap-1 items-center justify-center">
                        {(pokemon.customTypes || pokemon.types.map(t => t.name)).map((tName, i) => (
                          <span 
                            key={i} 
                            className="inline-flex items-center justify-center w-14 sm:w-16 h-4 sm:h-5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white ring-1 ring-inset ring-white/10 shadow-sm" 
                            style={{ 
                                backgroundColor: TYPE_COLORS[tName] || '#777',
                                backgroundImage: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1))'
                            }}
                          >
                            {tName}
                          </span>
                        ))}
                      </div>

                      <div className="absolute right-0 flex gap-0.5 items-center">
                        {supportsAbilities && influentialAbilities.map(ability => (
                          <div className="relative group" key={ability.name}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleAbility(ability.name); }}
                              className={`inline-flex items-center justify-center w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-md transition-all active:scale-95 border ${
                                pokemon.selectedAbility === ability.name 
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.3)]' 
                                : 'bg-slate-800/60 text-slate-600 border-slate-700/50 hover:text-slate-400'
                              }`}
                            >
                              <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                            <ControlTooltip text={`Passive: ${ability.name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col w-full mt-2 justify-start pb-1">
                {isEditing ? (
                  <div className="flex flex-col gap-2 animate-in slide-in-from-top-1 duration-200 px-1" onClick={e => e.stopPropagation()}>
                    <input 
                      autoFocus 
                      className="w-full bg-slate-950 border border-slate-800 text-[10px] font-black text-white py-2 px-3 rounded-xl outline-none uppercase italic" 
                      value={tempNickname} 
                      onChange={e => setTempNickname(e.target.value)}
                      onBlur={handleSaveNickname}
                      placeholder="Nickname..."
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      {[0, 1].map(i => (
                        <select 
                          key={i} 
                          className="w-full bg-slate-950 text-[9px] font-black uppercase rounded-xl p-2 border border-slate-800 text-slate-400 outline-none" 
                          value={(pokemon.customTypes || pokemon.types.map(t => t.name))[i] || 'none'} 
                          onChange={(e) => handleTypeChange(i, e.target.value)}
                        >
                          <option value="none">None</option>
                          {POKEMON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      ))}
                    </div>
                    <button onClick={() => { handleSaveNickname(); setIsEditing(false); }} className="w-full py-2.5 bg-indigo-600 text-white text-[9px] font-black uppercase italic rounded-xl shadow-md">Confirm</button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 pt-3 border-t border-slate-800/40 w-full">
                    {/* Desktop View: Full Selectors */}
                    <div className="hidden lg:grid grid-cols-1 gap-1">
                      <div className="flex justify-center mb-0.5">
                        <p className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Offensive Coverage</p>
                      </div>
                      {[0, 1, 2, 3].map(i => (
                        <MoveSearchSelector 
                          key={i} 
                          selectedMove={pokemon.selectedMoves[i]} 
                          onChange={(val) => handleMoveChange(i, val)} 
                          placeholder={`Move ${i+1}`} 
                          options={movesPool} 
                          globalOptions={allMovesList} 
                          openUpwards={i > 1}
                        />
                      ))}
                    </div>
                    
                    {/* Mobile/Small View: Move Type Summary */}
                    <div className="lg:hidden flex flex-col items-center gap-1 w-full animate-in fade-in duration-300">
                      <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">Moveset Signature</p>
                      <div className="flex flex-wrap justify-center gap-1 px-1">
                        {pokemon.selectedMoves.map((m, i) => (
                          m.name ? (
                            <div key={i} className="w-8 h-3.5 rounded-sm border border-white/5 shadow-sm flex items-center justify-center" style={{ backgroundColor: TYPE_COLORS[m.type] || '#444' }}>
                               <span className="text-[6px] text-white font-black uppercase truncate px-0.5">{m.type.substring(0, 3)}</span>
                            </div>
                          ) : (
                            <div key={i} className="w-8 h-3.5 rounded-sm bg-slate-800/40 border border-slate-800/60 border-dashed" />
                          )
                        ))}
                      </div>
                      <p className="text-[6px] text-slate-500 font-bold uppercase mt-2 opacity-50 italic">Tap to Configure</p>
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
            <div className="flex items-center gap-5">
              <img src={pokemon.sprite} className="w-16 h-16 object-contain" />
              <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">{pokemon.name}</h2>
                {pokemon.nickname && <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">{pokemon.nickname}</p>}
              </div>
            </div>
            <button onClick={() => setIsArchitectOpen(false)} className="p-3 text-slate-500 hover:text-white"><X className="w-8 h-8" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-10 max-w-4xl mx-auto w-full">
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nickname</label>
                   <input className="w-full bg-slate-900 border border-slate-800 text-lg font-black text-white p-5 rounded-2xl outline-none uppercase italic" value={tempNickname} placeholder="Designate identity..." onChange={e => { setTempNickname(e.target.value); if(pokemon) onSelect(index, { ...pokemon, nickname: e.target.value }); }} />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Type Modification</label>
                   <div className="grid grid-cols-2 gap-4">
                    {[0, 1].map(i => (
                      <select key={i} className="w-full bg-slate-900 text-sm font-bold uppercase rounded-2xl p-5 border border-slate-800 text-slate-300 outline-none" value={(pokemon.customTypes || pokemon.types.map(t => t.name))[i] || 'none'} onChange={(e) => handleTypeChange(i, e.target.value)}>
                        <option value="none">None</option>
                        {POKEMON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ))}
                   </div>
                </div>
              </div>
            </section>

            {supportsAbilities && influentialAbilities.length > 0 && (
              <section>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Passive Modifiers</h3>
                <div className="flex flex-wrap gap-4">
                  {influentialAbilities.map(ability => (
                    <button
                      key={ability.name}
                      onClick={() => handleToggleAbility(ability.name)}
                      className={`flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all ${
                        pokemon.selectedAbility === ability.name 
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-xl' 
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${pokemon.selectedAbility === ability.name ? 'bg-white border-white' : 'border-slate-700'}`}>
                        {pokemon.selectedAbility === ability.name && <Check className="w-4 h-4 text-indigo-600" />}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black uppercase italic leading-none mb-1">{ability.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Immunity Trait</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
            
            <section className="pb-10">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Offensive spread</h3>
              <div className="grid grid-cols-1 gap-4">
                {[0, 1, 2, 3].map(i => (
                  <MoveSearchSelector key={i} selectedMove={pokemon.selectedMoves[i]} onChange={(val) => handleMoveChange(i, val)} placeholder={`Move ${i+1}`} options={movesPool} globalOptions={allMovesList} />
                ))}
              </div>
            </section>
          </div>

          <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800 flex flex-row gap-3 sm:gap-6">
            <button onClick={handleSaveInstance} className={`flex-1 flex items-center justify-center gap-2 py-4 sm:py-6 rounded-2xl font-black uppercase text-[10px] sm:text-sm border active:scale-95 transition-all ${saving ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-indigo-600 text-white border-indigo-500'}`}>
              {saving ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <PackagePlus className="w-4 h-4 sm:w-5 sm:h-5" />} Add to Box
            </button>
            <button 
              onClick={() => { onSelect(index, null); setIsArchitectOpen(false); }} 
              className="flex-1 py-4 sm:py-6 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-2xl font-black uppercase text-[10px] sm:text-sm border border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> Remove from Team
            </button>
          </div>
        </div>
      )}
    </>
  );
};
