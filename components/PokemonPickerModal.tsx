
import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Filter, Zap, Shield, Loader2, ChevronRight } from 'lucide-react';
import { POKEMON_TYPES, TYPE_COLORS } from '../constants';
import { fetchPokemonByType, fetchPokemonByAbility, fetchAllAbilities } from '../services/pokeApi';

interface PokemonPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: number) => void;
  pokemonList: { name: string; id: number }[];
}

export const PokemonPickerModal: React.FC<PokemonPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  pokemonList,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [allAbilities, setAllAbilities] = useState<string[]>([]);
  const [filteredList, setFilteredList] = useState<{ name: string; id: number }[]>(pokemonList);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const loadAbilities = async () => {
      const abilities = await fetchAllAbilities();
      setAllAbilities(abilities);
    };
    loadAbilities();
  }, []);

  useEffect(() => {
    const applyFilters = async () => {
      setIsLoading(true);
      try {
        let baseList = [...pokemonList];

        // Apply Type Filter
        if (selectedType) {
          const typeList = await fetchPokemonByType(selectedType);
          const typeIds = new Set(typeList.map(p => p.id));
          baseList = baseList.filter(p => typeIds.has(p.id));
        }

        // Apply Ability Filter
        if (selectedAbility) {
          const abilityList = await fetchPokemonByAbility(selectedAbility);
          const abilityIds = new Set(abilityList.map(p => p.id));
          baseList = baseList.filter(p => abilityIds.has(p.id));
        }

        // Apply Search Term
        if (searchTerm) {
          baseList = baseList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        setFilteredList(baseList);
      } catch (error) {
        console.error("Filtering error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedType, selectedAbility, pokemonList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Pokemon Architect</h2>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Browse & Search Database</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-colors">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-800 bg-slate-950/30 shrink-0 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                autoFocus
                type="text"
                placeholder="Search by name..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase italic"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-6 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 transition-all ${isFilterOpen ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {(selectedType || selectedAbility) && (
                <span className="w-5 h-5 bg-white text-indigo-600 rounded-full flex items-center justify-center text-[10px]">
                  {[selectedType, selectedAbility].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {isFilterOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Type
                </label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-300 outline-none uppercase"
                  value={selectedType || ''}
                  onChange={(e) => setSelectedType(e.target.value || null)}
                >
                  <option value="">All Types</option>
                  {POKEMON_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Ability
                </label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-300 outline-none uppercase"
                  value={selectedAbility || ''}
                  onChange={(e) => setSelectedAbility(e.target.value || null)}
                >
                  <option value="">All Abilities</option>
                  {allAbilities.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Scanning Database...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
              <Search className="w-16 h-16 text-slate-700" />
              <p className="text-sm font-black uppercase tracking-widest text-slate-500 italic">No Pokemon found with these filters</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedType(null); setSelectedAbility(null); }}
                className="text-xs font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredList.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className="group relative bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-3 transition-all hover:border-indigo-500/50 hover:bg-slate-900 shadow-lg"
                >
                  <div className="w-16 h-16 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                      alt={p.name}
                      className="w-full h-full object-contain relative z-10 drop-shadow-md group-hover:scale-110 transition-transform"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-center w-full">
                    <p className="text-[10px] font-black text-slate-100 uppercase italic truncate tracking-tight">{p.name}</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">#{p.id.toString().padStart(3, '0')}</p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-indigo-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
            Showing {filteredList.length} Pokemon
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => { setSearchTerm(''); setSelectedType(null); setSelectedAbility(null); }}
              className="px-4 py-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
