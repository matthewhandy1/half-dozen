
import React, { useState, useEffect, useMemo } from 'react';
import { PokemonCard } from './components/PokemonCard';
import { TypeChart } from './components/TypeChart';
import { OffensiveMatrix } from './components/OffensiveMatrix';
import { TeamStats } from './components/TeamStats';
import { VaultModal } from './components/VaultModal';
import { InfoModal } from './components/InfoModal';
import { EnemyTeamSection } from './components/EnemyTeamSection';
import { PokemonData, PokemonTeam, BoxPokemon, SavedTeam, SavedEnemyTeam, UserProfile, MasterSyncPackage } from './types';
import { fetchAllPokemonNames, fetchPokemon, fetchAllMoves, fetchAllItems, fetchPokemonBasic } from './services/pokeApi';
import { STAT_ABBREVIATIONS, GENERATIONS } from './constants';
import { Trash2, Save, Check, BarChart3, LayoutGrid, Fingerprint, PackagePlus, X, User, Loader2, Info, Heart, Layers } from 'lucide-react';

const APP_VERSION = "6.1.2";

const PokeballIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-slate-950 overflow-hidden shadow-sm ${className}`}>
    <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 border-b border-slate-950" />
    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white border border-slate-950 z-10" />
  </div>
);

const HeaderTrainerSprite: React.FC<{ name: string }> = ({ name }) => {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const url = `https://play.pokemonshowdown.com/sprites/trainers/${name}.png`;

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden shrink-0">
      {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-slate-600" />}
      {status === 'error' && <User className="w-5 h-5 text-slate-700" />}
      <img 
        src={url} 
        alt="Trainer" 
        className={`w-full h-full object-contain scale-125 translate-y-1 ${status === 'success' ? 'block' : 'hidden'}`}
        onLoad={() => setStatus('success')}
        onError={() => setStatus('error')}
      />
    </div>
  );
};

// HELPER: Strip fat from Pokemon objects for storage
const miniaturize = (p: PokemonData | null): PokemonData | null => {
  if (!p) return null;
  const { availableMoves, abilities, stats, ...essential } = p;
  return { 
    ...essential, 
    stats: [], // Empty stats for storage
    abilities: [] // Empty abilities for storage
  } as PokemonData;
};

// HELPER: Compression/Decompression
const compress = async (text: string) => {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  const compressedBlob = await new Response(stream).blob();
  const reader = new FileReader();
  return new Promise<string>((resolve) => {
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(`H6_${base64}`); // Header for versioning
    };
    reader.readAsDataURL(compressedBlob);
  });
};

const decompress = async (encoded: string) => {
  if (!encoded.startsWith('H6_')) throw new Error("Unsupported format");
  const base64 = encoded.slice(3);
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const decompressedText = await new Response(stream).text();
  return JSON.parse(decompressedText);
};

const App: React.FC = () => {
  const [team, setTeam] = useState<PokemonTeam>([null, null, null, null, null, null]);
  const [enemyTeam, setEnemyTeam] = useState<PokemonTeam>([null, null, null, null, null, null]);
  const [pokemonList, setPokemonList] = useState<{ name: string; id: number }[]>([]);
  const [allMovesList, setAllMovesList] = useState<string[]>([]);
  const [allItemsList, setAllItemsList] = useState<string[]>([]);
  const [selectedGen, setSelectedGen] = useState(9);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [showBulkStashFeedback, setShowBulkStashFeedback] = useState(false);
  const [isNamingTeam, setIsNamingTeam] = useState(false);
  const [teamNameToSave, setTeamNameToSave] = useState('');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  const [vaultState, setVaultState] = useState<{ open: boolean, tab: 'profile' | 'teams' | 'box' | 'intel' }>({ open: false, tab: 'profile' });
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('half-dozen-profile');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      name: "RED",
      trainerClass: "Ace Trainer",
      joinedAt: Date.now(),
      trainerId: `HD-${Math.floor(10000 + Math.random() * 90000)}`,
      avatar: 'red'
    };
  });

  const [box, setBox] = useState<BoxPokemon[]>(() => {
    try {
      const stored = localStorage.getItem('half-dozen-box');
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  });

  const [teams, setTeams] = useState<SavedTeam[]>(() => {
    try {
      const stored = localStorage.getItem('half-dozen-teams');
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  });

  const [enemyTeams, setEnemyTeams] = useState<SavedEnemyTeam[]>(() => {
    try {
      const stored = localStorage.getItem('half-dozen-enemy-teams');
      return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    const init = async () => {
      const [pList, mList, iList] = await Promise.all([
        fetchAllPokemonNames(selectedGen),
        fetchAllMoves(),
        fetchAllItems()
      ]);
      setPokemonList(pList);
      setAllMovesList(mList);
      setAllItemsList(iList);

      try {
        if (!enemyTeam.some(p => p !== null)) {
          const redNames = ['pikachu', 'lapras', 'snorlax', 'venusaur', 'charizard', 'blastoise'];
          const redTeamData = await Promise.all(redNames.map(name => fetchPokemonBasic(name)));
          setEnemyTeam(redTeamData as PokemonTeam);
          if (enemyTeams.length === 0) {
             setEnemyTeams([{
               id: 'trainer-red-classic',
               name: "Trainer Red",
               pokemon: redTeamData.map(p => miniaturize(p)),
               timestamp: Date.now()
             }]);
          }
        }
      } catch (err) {}
    };
    init();
  }, [selectedGen]);

  // Hydrate pokemon data when it is loaded into the active slots
  const hydrateSlot = async (index: number, partialData: PokemonData) => {
    try {
      const full = await fetchPokemon(partialData.id);
      setTeam(prev => {
        const next = [...prev];
        next[index] = { ...full, ...partialData, stats: full.stats, abilities: full.abilities, availableMoves: full.availableMoves };
        return next;
      });
    } catch (e) { console.error("Hydration Error:", e); }
  };

  useEffect(() => localStorage.setItem('half-dozen-box', JSON.stringify(box)), [box]);
  useEffect(() => localStorage.setItem('half-dozen-teams', JSON.stringify(teams)), [teams]);
  useEffect(() => localStorage.setItem('half-dozen-enemy-teams', JSON.stringify(enemyTeams)), [enemyTeams]);
  useEffect(() => localStorage.setItem('half-dozen-profile', JSON.stringify(profile)), [profile]);

  const handleSelectPokemon = (index: number, pokemon: PokemonData | null) => {
    const newTeam = [...team];
    newTeam[index] = pokemon;
    setTeam(newTeam);
  };

  const handleSelectEnemyPokemon = (index: number, pokemon: PokemonData | null) => {
    const newEnemyTeam = [...enemyTeam];
    newEnemyTeam[index] = pokemon;
    setEnemyTeam(newEnemyTeam);
  };

  const handleSaveToBox = (pokemon: PokemonData) => {
    const newEntry: BoxPokemon = {
      ...miniaturize(pokemon), 
      instanceId: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    } as BoxPokemon;
    setBox(prev => [newEntry, ...prev]);
  };

  const handleSaveAllToBox = () => {
    const activePokemon = team.filter((p): p is NonNullable<typeof p> => p !== null);
    if (activePokemon.length === 0) return;

    const newEntries: BoxPokemon[] = activePokemon.map(p => ({
      ...miniaturize(p),
      instanceId: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    } as BoxPokemon));

    setBox(prev => [...newEntries, ...prev]);
    setShowBulkStashFeedback(true);
    setTimeout(() => setShowBulkStashFeedback(false), 2000);
  };

  const handleUpdateBoxNickname = (id: string, newNickname: string) => {
    setBox(prev => prev.map(p => p.instanceId === id ? { ...p, nickname: newNickname } : p));
  };

  const handleDeleteFromBox = (id: string) => setBox(prev => prev.filter(p => p.instanceId !== id));
  
  const handleAddToTeamFromBox = (pokemon: BoxPokemon, slotIndex: number) => {
    const newTeam = [...team];
    newTeam[slotIndex] = JSON.parse(JSON.stringify(pokemon));
    setTeam(newTeam);
    hydrateSlot(slotIndex, pokemon); // Re-fetch the fat data (stats, moves)
  };

  const handleLoadTeam = (loadedTeam: PokemonTeam) => {
    const nextTeam = JSON.parse(JSON.stringify(loadedTeam));
    setTeam(nextTeam);
    nextTeam.forEach((p: PokemonData | null, idx: number) => {
      if (p) hydrateSlot(idx, p);
    });
  };

  const handleLoadEnemyTeam = (loadedTeam: PokemonTeam) => {
    setEnemyTeam(JSON.parse(JSON.stringify(loadedTeam)));
  };

  const handleClearTeam = () => {
    setTeam([null, null, null, null, null, null]);
  };

  const handleClearEnemyTeam = () => {
    setEnemyTeam([null, null, null, null, null, null]);
  };

  const handleStartSaveTeam = () => {
    if (!team.some(p => p !== null)) return;
    const now = new Date();
    setTeamNameToSave(`Team ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    setIsNamingTeam(true);
  };

  const handleConfirmSaveTeam = () => {
    try {
      const miniTeam = team.map(p => miniaturize(p));
      const newTeamEntry: SavedTeam = {
        id: Date.now().toString(),
        name: teamNameToSave || "Unnamed Team",
        pokemon: miniTeam,
        timestamp: Date.now()
      };
      setTeams(prev => [newTeamEntry, ...prev]);
      setShowSavedFeedback(true);
      setIsNamingTeam(false);
      setTimeout(() => setShowSavedFeedback(false), 2000);
    } catch (err) { console.error(err); }
  };

  const handleSaveEnemyTeam = (name: string) => {
    if (!enemyTeam.some(p => p !== null)) return;
    const miniEnemyTeam = enemyTeam.map(p => miniaturize(p as PokemonData));
    const newEntry: SavedEnemyTeam = {
      id: Date.now().toString(),
      name: name || `Rival Team ${new Date().toLocaleDateString()}`,
      pokemon: miniEnemyTeam,
      timestamp: Date.now()
    };
    setEnemyTeams(prev => [newEntry, ...prev]);
  };

  const handleDeleteTeam = (id: string) => setTeams(prev => prev.filter(t => t.id !== id));
  const handleDeleteEnemyTeam = (id: string) => setEnemyTeams(prev => prev.filter(t => t.id !== id));
  const handleRenameTeam = (id: string, newName: string) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const handleExportMasterKey = async () => {
    const pkg: MasterSyncPackage = { 
      profile, 
      team: team.map(p => miniaturize(p)), 
      box: box.map(p => miniaturize(p) as BoxPokemon), 
      teams, 
      enemyTeams, 
      version: APP_VERSION 
    };
    const jsonStr = JSON.stringify(pkg);
    return await compress(jsonStr);
  };

  const handleImportMasterKey = async (key: string) => {
    try {
      const decoded: MasterSyncPackage = await decompress(key);
      if (decoded.profile) setProfile(decoded.profile);
      if (decoded.team) setTeam(decoded.team);
      if (decoded.box) setBox(decoded.box);
      if (decoded.teams) setTeams(decoded.teams);
      if (decoded.enemyTeams) setEnemyTeams(decoded.enemyTeams);
      
      // Auto-hydrate the current team slots
      decoded.team.forEach((p, idx) => {
        if (p) hydrateSlot(idx, p);
      });
    } catch (e) { 
      console.error("Master Key Import Error:", e);
      throw new Error("Invalid sync package or format version"); 
    }
  };

  const isTeamEmpty = !team.some(p => p !== null);

  const teamAverages = useMemo(() => {
    const active = team.filter((p): p is NonNullable<typeof p> => p !== null && p.stats && p.stats.length > 0);
    if (active.length === 0) return null;
    const sums: Record<string, number> = { hp: 0, attack: 0, defense: 0, 'special-attack': 0, 'special-defense': 0, speed: 0 };
    active.forEach(p => p.stats.forEach(s => { if (sums[s.name] !== undefined) sums[s.name] += s.value; }));
    return Object.keys(sums).map(key => ({ name: STAT_ABBREVIATIONS[key] || key, value: Math.round(sums[key] / active.length) }));
  }, [team]);

  const getStatColor = (val: number) => {
    if (val < 70) return 'text-red-400';
    if (val < 95) return 'text-yellow-400';
    if (val < 120) return 'text-emerald-400';
    return 'text-blue-400';
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen pb-4 bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4 sm:py-6 sticky top-0 z-[60]">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden xl:grid grid-cols-3 gap-1 p-2 bg-slate-800 rounded-2xl shadow-lg border border-slate-700">
              <PokeballIcon /><PokeballIcon /><PokeballIcon /><PokeballIcon /><PokeballIcon /><PokeballIcon />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-slate-100 tracking-tight leading-none mb-0.5 sm:mb-1 uppercase italic">Half Dozen</h1>
              <p className="text-slate-600 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] leading-none italic hidden sm:block">Pokemon Team Architect</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 h-11 sm:h-14">
            {/* Generation Selector */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <select 
                value={selectedGen} 
                onChange={(e) => { 
                  setSelectedGen(Number(e.target.value)); 
                  handleClearTeam();
                }}
                className="bg-transparent text-[10px] font-black uppercase text-slate-300 outline-none cursor-pointer"
              >
                {GENERATIONS.map(g => (
                  <option key={g.id} value={g.id} className="bg-slate-900 text-white">{g.name} ({g.region})</option>
                ))}
              </select>
            </div>

            {/* Trainer Profile Button */}
            <div 
              className="h-11 w-11 sm:h-auto sm:w-auto flex items-center gap-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl sm:rounded-[1.25rem] transition-all group cursor-pointer overflow-hidden sm:px-4 sm:py-2" 
              onClick={() => setVaultState({ open: true, tab: 'profile' })}
            >
              <div className="text-right hidden sm:block">
                <p className="text-white text-xs font-black uppercase italic leading-none">{profile.name}</p>
                <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-1 opacity-60">ID #{profile.trainerId}</p>
              </div>
              <div className="w-11 h-11 sm:w-10 sm:h-10 shrink-0">
                <HeaderTrainerSprite name={profile.avatar || 'red'} />
              </div>
            </div>

            {/* Vault Button */}
            <button 
              onClick={() => setVaultState({ open: true, tab: 'teams' })}
              className="h-11 w-11 sm:h-14 sm:w-auto flex items-center justify-center gap-3 sm:px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl sm:rounded-[1.25rem] border border-slate-700 transition-all group shadow-xl"
            >
              <Fingerprint className="w-5 h-5 sm:w-5 sm:h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs uppercase italic font-black hidden sm:inline">The Vault</span>
            </button>

            {/* Info Button */}
            <button 
              onClick={() => setIsInfoOpen(true)}
              className="h-11 w-11 sm:h-14 sm:w-14 flex items-center justify-center bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl sm:rounded-[1.25rem] transition-all group shadow-lg shadow-indigo-500/5"
              title="Application Intel"
            >
              <Info className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-4 sm:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 sm:mb-6 h-auto sm:h-14">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-2 mr-2">
                <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight">Active Team</h2>
              </div>

              {/* Mobile Gen Selector */}
              <div className="md:hidden flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg">
                <Layers className="w-3 h-3 text-indigo-400" />
                <select 
                  value={selectedGen} 
                  onChange={(e) => { 
                    setSelectedGen(Number(e.target.value)); 
                    handleClearTeam();
                  }}
                  className="bg-transparent text-[10px] font-black uppercase text-slate-300 outline-none"
                >
                  {GENERATIONS.map(g => (
                    <option key={g.id} value={g.id} className="bg-slate-900 text-white">{g.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button 
                  onClick={handleSaveAllToBox}
                  disabled={isTeamEmpty}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest italic shadow-lg active:scale-95 disabled:opacity-30 ${
                    showBulkStashFeedback 
                      ? 'bg-emerald-600 border-emerald-500 text-white' 
                      : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                  }`}
                >
                  {showBulkStashFeedback ? <Check className="w-3.5 h-3.5" /> : <PackagePlus className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{showBulkStashFeedback ? 'Stashed' : 'Stash All'}</span>
                </button>

                <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

                <button 
                  onClick={handleStartSaveTeam} 
                  disabled={isTeamEmpty} 
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border shadow-lg ${showSavedFeedback ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500'} disabled:opacity-30`}
                >
                  {showSavedFeedback ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span className="text-[10px] uppercase italic font-black">{showSavedFeedback ? 'Saved' : 'Save Team'}</span>
                </button>

                <button 
                  onClick={handleClearTeam} 
                  disabled={isTeamEmpty} 
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-xl font-bold transition-all border border-slate-700 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-end flex-1 h-full">
              {teamAverages && (
                <div 
                  onClick={() => setIsStatsModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner animate-in fade-in zoom-in duration-500 cursor-pointer hover:bg-slate-800/80 transition-all active:scale-95"
                >
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-3 border-r border-slate-800 pr-3">Avg Stats</span>
                  {teamAverages.map(avg => (
                    <div key={avg.name} className="flex flex-col items-center min-w-[32px]">
                      <span className="text-[9px] font-black text-slate-600 uppercase mb-0.5">{avg.name}</span>
                      <span className={`text-[11px] font-black drop-shadow-sm ${getStatColor(avg.value)}`}>{avg.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 lg:gap-3 xl:gap-6 items-stretch">
            {team.map((pokemon, idx) => (
              <PokemonCard 
                key={idx} 
                index={idx} 
                pokemon={pokemon} 
                onSelect={handleSelectPokemon} 
                onSaveToBox={handleSaveToBox} 
                pokemonList={pokemonList} 
                allMovesList={allMovesList} 
                allItemsList={allItemsList}
                generation={selectedGen}
              />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          <TypeChart team={team} generation={selectedGen} />
          <div className="flex flex-col gap-8">
            <OffensiveMatrix team={team} generation={selectedGen} />
          </div>
        </div>

        <EnemyTeamSection 
          userTeam={team} 
          enemyTeam={enemyTeam} 
          onSelectEnemy={handleSelectEnemyPokemon} 
          pokemonList={pokemonList}
          onSaveEnemyTeam={handleSaveEnemyTeam}
          onClearEnemyTeam={handleClearEnemyTeam}
          onOpenLoadEnemyTeams={() => setVaultState({ open: true, tab: 'intel' })}
          generation={selectedGen}
        />
      </main>

      <footer className="max-w-[1920px] mx-auto px-8 py-12 mt-12 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-slate-400">
        <div className="flex items-center gap-3">
          <img 
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/598.png" 
            alt="Ferrothorn" 
            className="w-10 h-10 object-contain hover:grayscale-0 transition-all cursor-help drop-shadow-[0_0_8px_rgba(100,116,139,0.3)]"
            title="Iron Defense Enabled"
          />
          <p className="text-[11px] font-black uppercase tracking-[0.2em] italic text-slate-300">
            © {currentYear} Half Dozen <span className="ml-2 opacity-40 font-mono text-[9px] lowercase tracking-normal">v{APP_VERSION}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Made with <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> by <span className="text-slate-300 font-black italic">Handyful</span>
        </div>
      </footer>

      <div className="fixed bottom-6 right-6 sm:hidden z-50">
        <button 
          onClick={() => setIsStatsModalOpen(true)}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/40 border-2 border-indigo-400 active:scale-95 transition-transform"
        >
          <BarChart3 className="w-6 h-6" />
        </button>
      </div>

      {isNamingTeam && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Name Your Team</h3>
                <button onClick={() => setIsNamingTeam(false)} className="p-2 text-slate-500"><X className="w-5 h-5" /></button>
             </div>
             <input 
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-lg font-black uppercase italic outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
              value={teamNameToSave}
              onChange={e => setTeamNameToSave(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirmSaveTeam()}
             />
             <div className="flex gap-3">
               <button onClick={handleConfirmSaveTeam} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-sm shadow-xl hover:bg-indigo-500 transition-all">Confirm Save</button>
             </div>
          </div>
        </div>
      )}

      {vaultState.open && (
        <VaultModal 
          activeTab={vaultState.tab}
          profile={profile}
          teams={teams}
          box={box}
          enemyTeams={enemyTeams}
          onClose={() => setVaultState({...vaultState, open: false})}
          onUpdateProfile={setProfile}
          onDeleteTeam={handleDeleteTeam}
          onRenameTeam={handleRenameTeam}
          onLoadTeam={handleLoadTeam}
          onAddTeam={(t) => setTeams(prev => [t, ...prev])}
          onClearAllTeams={() => setTeams([])}
          onDeleteBoxPkmn={handleDeleteFromBox}
          onUpdateBoxNickname={handleUpdateBoxNickname}
          onAddToTeamFromBox={handleAddToTeamFromBox}
          onAddBoxPkmn={(p) => setBox(prev => [p, ...prev])}
          onClearAllBox={() => setBox([])}
          onDeleteEnemyTeam={handleDeleteEnemyTeam}
          onLoadEnemyTeam={handleLoadEnemyTeam}
          onClearAllEnemyTeams={() => setEnemyTeams([])}
          onExportMasterKey={handleExportMasterKey}
          onImportMasterKey={handleImportMasterKey}
        />
      )}

      {isInfoOpen && (
        <InfoModal onClose={() => setIsInfoOpen(false)} />
      )}
      
      {isStatsModalOpen && <TeamStats team={team} onClose={() => setIsStatsModalOpen(false)} />}
    </div>
  );
};

export default App;
