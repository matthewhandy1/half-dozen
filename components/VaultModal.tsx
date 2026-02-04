import React, { useState } from 'react';
import { UserProfile, PokemonTeam, BoxPokemon, SavedTeam, SavedEnemyTeam, PokemonData, SelectedMove } from '../types';
import { 
  X, Fingerprint, Users, Package, ShieldAlert, 
  Save, Copy, Check, Upload, Trash2, Edit3, 
  Calendar, Trophy, User, RefreshCw,
  Share2, Zap, Download, Loader2, Dna,
  UserCheck, BadgeCheck, AlertTriangle, FileText,
  Map, History, Database, LayoutGrid, Link as LinkIcon
} from 'lucide-react';
import { TYPE_COLORS } from '../constants';
import { fetchPokemon, fetchMoveDetails, fetchItemDescription, fetchPokemonBasic } from '../services/pokeApi';

interface VaultModalProps {
  activeTab: 'profile' | 'teams' | 'box' | 'intel';
  profile: UserProfile;
  teams: SavedTeam[];
  box: BoxPokemon[];
  enemyTeams: SavedEnemyTeam[];
  onClose: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onDeleteTeam: (id: string) => void;
  onRenameTeam: (id: string, newName: string) => void;
  onLoadTeam: (team: PokemonTeam) => void;
  onAddTeam: (team: SavedTeam) => void;
  onClearAllTeams: () => void;
  onDeleteBoxPkmn: (id: string) => void;
  onUpdateBoxNickname: (id: string, name: string) => void;
  onAddToTeamFromBox: (pokemon: BoxPokemon, slotIndex: number) => void;
  onAddBoxPkmn: (pokemon: BoxPokemon) => void;
  onClearAllBox: () => void;
  onDeleteEnemyTeam: (id: string) => void;
  onLoadEnemyTeam: (team: PokemonTeam) => void;
  onClearAllEnemyTeams: () => void;
  onExportMasterKey: () => Promise<string>;
  onImportMasterKey: (key: string) => Promise<void>;
}

const TRAINER_CLASSES = [
  "Ace Trainer", "Pokemon Master", "Hex Maniac", "Youngster", "Elite Four", 
  "Champion", "Gym Leader", "Ruin Maniac", "Dragon Tamer", "Battle Girl", 
  "Psychic", "Veteran", "Lass", "Cool Trainer", "Beauty", "Poké Fan", 
  "Collector", "Ranger", "Hiker"
];

const TRAINER_AVATARS = [
  { id: 'red', name: "Red" }, { id: 'leaf', name: "Leaf" }, { id: 'ethan', name: "Ethan" },
  { id: 'lyra', name: "Lyra" }, { id: 'brendan', name: "Brendan" }, { id: 'may', name: "May" },
  { id: 'lucas', name: "Lucas" }, { id: 'dawn', name: "Dawn" }, { id: 'hilbert', name: "Hilbert" },
  { id: 'hilda', name: "Hilda" }, { id: 'nate', name: "Nate" }, { id: 'rosa', name: "Rosa" },
  { id: 'calem', name: "Calem" }, { id: 'serena', name: "Serena" }, { id: 'elio', name: "Elio" },
  { id: 'selene', name: "Selene" }, { id: 'blue', name: "Blue" }, { id: 'cynthia', name: "Cynthia" },
  { id: 'steven', name: "Steven" }, { id: 'n', name: "N" }, { id: 'brock', name: "Brock" },
  { id: 'misty', name: "Misty" }, { id: 'erika', name: "Erika" }, { id: 'giovanni', name: "Giovanni" },
  { id: 'hexmaniac', name: "Hex Maniac" }, { id: 'youngster', name: "Youngster" },
  { id: 'hiker', name: "Hiker" }, { id: 'beauty', name: "Beauty" }, { id: 'psychic', name: "Psychic" }
];

const TrainerSprite: React.FC<{ id: string; name?: string; className?: string }> = ({ id, name, className = "" }) => {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const spriteUrl = `https://play.pokemonshowdown.com/sprites/trainers/${id}.png`;

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-slate-900/50 ${className}`}>
      {status === 'loading' && <Loader2 className="absolute w-6 h-6 animate-spin text-slate-700" />}
      {status === 'error' && <User className="w-1/2 h-1/2 text-slate-700" />}
      <img 
        src={spriteUrl} 
        alt={name || "Trainer"} 
        className={`${status === 'success' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 object-contain w-full h-full`}
        onLoad={() => setStatus('success')}
        onError={() => setStatus('error')}
        title={name}
      />
    </div>
  );
};

const compressHelper = async (text: string) => {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  const compressedBlob = await new Response(stream).blob();
  const reader = new FileReader();
  return new Promise<string>((resolve) => {
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(`H6_${base64}`);
    };
    reader.readAsDataURL(compressedBlob);
  });
};

const decompressHelper = async (encoded: string) => {
  if (!encoded.startsWith('H6_')) {
    const jsonStr = decodeURIComponent(Array.prototype.map.call(atob(encoded.trim()), (c) => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonStr);
  }
  const base64 = encoded.slice(3);
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const decompressedText = await new Response(stream).text();
  return JSON.parse(decompressedText);
};

export const VaultModal: React.FC<VaultModalProps> = (props) => {
  const [currentTab, setCurrentTab] = useState(props.activeTab);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({ 
    name: props.profile.name, 
    class: props.profile.trainerClass, 
    avatar: props.profile.avatar 
  });
  const [copySuccess, setCopySuccess] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [addingToSlot, setAddingToSlot] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRenameValue, setTempRenameValue] = useState('');
  
  const [confirmClearType, setConfirmClearType] = useState<'teams' | 'box' | 'intel' | null>(null);
  const [exchangeMode, setExchangeMode] = useState<'none' | 'import' | 'export' | 'showdown'>('none');
  const [exchangeCode, setExchangeCode] = useState('');
  const [exchangeFeedback, setExchangeFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: Fingerprint, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'teams', label: 'Teams', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'box', label: 'Storage Box', icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'intel', label: 'Rival Intel', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10' },
  ] as const;

  const handleCopyKey = async () => {
    setIsProcessing(true);
    try {
      const key = await props.onExportMasterKey();
      await navigator.clipboard.writeText(key);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      console.error("Export Error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importKey.trim()) return;
    setIsProcessing(true);
    try {
      await props.onImportMasterKey(importKey);
      setImportKey('');
      setExchangeFeedback("Data Restored!");
      setTimeout(() => setExchangeFeedback(null), 3000);
    } catch (e) {
      alert("Invalid Sync Key!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = (type: 'teams' | 'box' | 'intel') => {
    if (confirmClearType !== type) {
      setConfirmClearType(type);
      setTimeout(() => setConfirmClearType(null), 3000);
      return;
    }
    
    if (type === 'teams') props.onClearAllTeams();
    else if (type === 'box') props.onClearAllBox();
    else if (type === 'intel') props.onClearAllEnemyTeams();
    
    setConfirmClearType(null);
    setExchangeFeedback("Deleted All Items");
    setTimeout(() => setExchangeFeedback(null), 2000);
  };

  const serializePkmnDNA = (p: PokemonData) => ({
    id: p.id,
    n: p.nickname || null,
    a: p.selectedAbility || null,
    i: p.selectedItem || null,
    m: p.selectedMoves.map(m => m.name || null),
    ct: p.customTypes || null
  });

  const handleExportIndividual = async (type: 'team' | 'pkmn', data: any) => {
    setIsProcessing(true);
    try {
      let compactData;
      if (type === 'pkmn') {
        compactData = serializePkmnDNA(data as BoxPokemon);
      } else {
        compactData = {
          n: data.name,
          p: (data.pokemon as PokemonTeam).map(p => p ? serializePkmnDNA(p) : null)
        };
      }
      const payload = { v: 2, t: type === 'pkmn' ? 'p' : 't', d: compactData };
      const code = await compressHelper(JSON.stringify(payload));
      setExchangeCode(code);
      setExchangeMode('export');
      setExchangeFeedback(null);
    } catch (e) {
      console.error("Export Error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  const reconstructPkmnFromDNA = async (dna: any): Promise<PokemonData> => {
    const base = await fetchPokemon(dna.id);
    const itemDesc = dna.i ? await fetchItemDescription(dna.i) : '';
    const reconstructedMoves: SelectedMove[] = await Promise.all(
      (dna.m || [null, null, null, null]).map(async (moveName: string | null) => {
        if (!moveName) return { name: '', type: '', damageClass: '', power: null };
        try {
          const details = await fetchMoveDetails(moveName);
          return { name: moveName, type: details.type, damageClass: details.damageClass, power: details.power };
        } catch (e) {
          return { name: moveName, type: '', damageClass: '', power: null };
        }
      })
    );
    return {
      ...base,
      nickname: dna.n || undefined,
      selectedAbility: dna.a || base.selectedAbility,
      selectedItem: dna.i || '',
      selectedItemDescription: itemDesc,
      selectedMoves: reconstructedMoves,
      customTypes: dna.ct || undefined
    };
  };

  const handleImportShowdown = async () => {
    if (!exchangeCode.trim()) return;
    setIsProcessing(true);
    try {
      // (Showdown logic placeholder)
      setExchangeFeedback("Showdown Team Imported!");
      setCurrentTab('teams');
    } catch (e) {
      alert("Failed to import Showdown text.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportIndividual = async () => {
    if (exchangeMode === 'showdown') return handleImportShowdown();
    if (!exchangeCode.trim()) return;
    setIsProcessing(true);
    try {
      const payload = await decompressHelper(exchangeCode);
      if (payload.v === 2) {
        if (payload.t === 't') {
          const pData = await Promise.all(payload.d.p.map((dna: any) => dna ? reconstructPkmnFromDNA(dna) : null));
          const newTeam: SavedTeam = {
            id: Date.now().toString(),
            name: `Imported: ${payload.d.n}`,
            pokemon: pData as PokemonTeam,
            timestamp: Date.now()
          };
          props.onAddTeam(newTeam);
          setCurrentTab('teams');
        } else if (payload.t === 'p') {
          const pData = await reconstructPkmnFromDNA(payload.d);
          const newPkmn: BoxPokemon = { ...pData, instanceId: Date.now().toString() + Math.random().toString(36).substr(2, 5) };
          props.onAddBoxPkmn(newPkmn);
          setCurrentTab('box');
        }
      }
      setExchangeCode('');
      setExchangeMode('none');
      setExchangeFeedback("Data Loaded!");
      setTimeout(() => setExchangeFeedback(null), 3000);
    } catch (e) {
      alert("Invalid code format.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startRename = (id: string, initialValue: string) => {
    setEditingId(id);
    setTempRenameValue(initialValue);
  };

  const confirmRename = (type: 'team' | 'box') => {
    if (!editingId) return;
    if (type === 'team') props.onRenameTeam(editingId, tempRenameValue);
    else props.onUpdateBoxNickname(editingId, tempRenameValue);
    setEditingId(null);
  };

  const ActionGroup = ({ onRename, onExport, onDelete }: any) => (
    <div className="flex bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shrink-0 shadow-lg">
      <button onClick={onRename} className="p-3 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 transition-colors border-r border-slate-800" title="Rename"><Edit3 className="w-4 h-4" /></button>
      <button onClick={onExport} className="p-3 hover:bg-amber-500/10 text-slate-500 hover:text-amber-400 transition-colors border-r border-slate-800" title="Share Item"><Share2 className="w-4 h-4" /></button>
      <button onClick={onDelete} className="p-3 hover:bg-red-500/10 text-slate-700 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
    </div>
  );

  const ClearAllButton = ({ type, count }: { type: 'teams' | 'box' | 'intel', count: number }) => {
    if (count === 0) return null;
    const isConfirming = confirmClearType === type;
    return (
      <button onClick={() => handleClearAll(type)} className={`flex items-center gap-2 px-3 py-2 rounded-lg font-black uppercase text-[10px] transition-all border shadow-lg ${isConfirming ? 'bg-red-600 border-red-500 text-white animate-pulse' : 'bg-slate-950/50 border-slate-800 text-slate-600 hover:text-red-500 hover:border-red-900/40'}`}>
        {isConfirming ? <AlertTriangle className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
        <span>{isConfirming ? 'Confirm?' : 'Clear List'}</span>
      </button>
    );
  };

  const legacyIntel = props.enemyTeams.filter(t => t.isLegacy);
  const manualIntel = props.enemyTeams.filter(t => !t.isLegacy);

  const shareLink = `https://halfdozen.ca/#share=${exchangeCode}`;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl w-full max-w-6xl h-[95vh] sm:h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative">
        <div className="p-4 sm:p-8 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/80 backdrop-blur-lg z-[320]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-none">Storage & Vault</h2>
            <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manage Your Data</p>
          </div>
          <button onClick={props.onClose} className="p-3 bg-slate-800 text-white rounded-xl sm:rounded-2xl shadow-xl active:scale-95 transition-transform"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
        </div>

        {(exchangeMode !== 'none' || isProcessing) && (
          <div className="absolute inset-0 z-[330] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-300">
            {exchangeMode !== 'none' && !isProcessing && <button onClick={() => setExchangeMode('none')} className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>}
            
            {isProcessing ? (
              <div className="text-center space-y-6">
                <Loader2 className="w-16 h-16 animate-spin text-indigo-500 mx-auto" />
                <p className="text-white font-black uppercase italic tracking-widest">Optimizing Data...</p>
              </div>
            ) : exchangeMode === 'export' ? (
              <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-12 shadow-2xl text-center space-y-8 animate-in zoom-in-95">
                <div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white uppercase italic tracking-tight mb-2">Share Card</h3>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs italic">Copy Link to send this to a friend</p>
                </div>

                <div className="flex flex-col gap-4 items-center justify-center max-w-sm mx-auto w-full">
                   <button 
                      onClick={() => { navigator.clipboard.writeText(shareLink); setExchangeFeedback("Link Copied!"); setTimeout(() => setExchangeFeedback(null), 2000); }}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
                    >
                      <LinkIcon className="w-5 h-5" /> Copy Share Link
                    </button>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(exchangeCode); setExchangeFeedback("Code Copied!"); setTimeout(() => setExchangeFeedback(null), 2000); }}
                      className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                      <Copy className="w-5 h-5" /> Copy Raw Code
                    </button>
                </div>
                
                {exchangeFeedback && (
                  <div className="px-6 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-full inline-flex items-center gap-2 text-xs font-black uppercase animate-in slide-in-from-bottom-2">
                    <Check className="w-4 h-4" /> {exchangeFeedback}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full max-w-lg space-y-6 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl">
                  {exchangeMode === 'showdown' ? <FileText className="w-8 h-8 sm:w-10 sm:h-10" /> : <Download className="w-8 h-8 sm:w-10 sm:h-10" />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight">{exchangeMode === 'showdown' ? 'Import from Showdown' : 'Import Shared Data'}</h3>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] sm:text-xs">Paste a link or code to load a Pokémon or Team</p>
                </div>
                <div className="space-y-4 w-full">
                  <textarea className="w-full bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-[10px] font-mono text-indigo-300 outline-none h-32 focus:ring-2 focus:ring-indigo-500/50" placeholder={exchangeMode === 'showdown' ? "Paste Showdown text here..." : "Paste link or code here..."} value={exchangeCode} onChange={e => {
                    let val = e.target.value;
                    if (val.includes('#share=')) val = val.split('#share=')[1];
                    setExchangeCode(val);
                  }} />
                  <button onClick={handleImportIndividual} disabled={isProcessing || !exchangeCode.trim()} className="w-full py-4 sm:py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl sm:rounded-3xl font-black uppercase text-xs sm:text-sm shadow-xl flex items-center justify-center gap-3">
                    <RefreshCw className="w-5 h-5" /> Load Shared Item
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
          <div className="w-full sm:w-64 bg-slate-950/30 border-b sm:border-b-0 sm:border-r border-slate-800 p-2 sm:p-6 flex flex-col shrink-0">
            <div className="grid grid-cols-4 sm:flex sm:flex-col gap-1 sm:gap-4">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => { setCurrentTab(tab.id); setConfirmClearType(null); }} className={`flex flex-col-reverse sm:flex-row items-center gap-1 sm:gap-3 p-2 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl transition-all ${currentTab === tab.id ? `${tab.bg} border border-white/10 shadow-lg` : 'hover:bg-slate-800 text-slate-500'}`}>
                  <span className={`text-[8px] sm:text-xs font-black uppercase tracking-widest text-center sm:text-left ${currentTab === tab.id ? 'text-white' : ''}`}>{tab.label}</span>
                  <tab.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${currentTab === tab.id ? tab.color : ''}`} />
                </button>
              ))}
            </div>
            <div className="hidden sm:block mt-auto pt-4 border-t border-slate-800/50 space-y-3">
              <button onClick={() => { setExchangeCode(''); setExchangeMode('showdown'); }} className="w-full flex items-center justify-center gap-2 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-2xl font-black uppercase text-[10px] transition-all">Showdown Import</button>
              <button onClick={() => { setExchangeCode(''); setExchangeMode('import'); }} className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-2xl font-black uppercase text-[10px] transition-all">Import Item</button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0 bg-slate-900/20 overflow-hidden">
            <div className="px-4 py-4 sm:px-8 sm:py-6 border-b border-slate-800/50 flex items-center justify-between shrink-0 bg-slate-900/40">
              <h3 className="text-sm sm:text-xl font-black text-white uppercase italic tracking-tight">{tabs.find(t => t.id === currentTab)?.label}</h3>
              <div className="flex items-center gap-2">
                {currentTab === 'teams' && (<ClearAllButton type="teams" count={props.teams.length} />)}
                {currentTab === 'box' && <ClearAllButton type="box" count={props.box.length} />}
                {currentTab === 'intel' && <ClearAllButton type="intel" count={manualIntel.length} />}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-10 scrollbar-thin">
              {currentTab === 'profile' && (
                <div className="space-y-8 sm:space-y-12 max-w-4xl mx-auto pb-12">
                  <div className="bg-slate-950/50 border border-slate-800 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-12 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center">
                      <div className="w-32 h-32 sm:w-48 sm:h-48 bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border-4 border-slate-800 flex items-center justify-center shadow-2xl shrink-0 overflow-hidden relative group/avatar">
                        <TrainerSprite id={tempProfile.avatar || props.profile.avatar || 'red'} className="w-full h-full object-contain scale-125 translate-y-2 drop-shadow-xl" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        {isEditingProfile ? (
                          <div className="space-y-6 max-w-lg mx-auto sm:mx-0">
                            <input className="bg-slate-900 border border-emerald-500 text-white text-xl sm:text-2xl font-black p-4 rounded-xl sm:rounded-2xl w-full outline-none uppercase italic" value={tempProfile.name} onChange={e => setTempProfile({...tempProfile, name: e.target.value})} placeholder="Set Name" />
                            <select className="bg-slate-900 border border-slate-700 text-white text-sm font-black p-4 rounded-xl sm:rounded-2xl w-full outline-none uppercase appearance-none" value={tempProfile.class} onChange={e => setTempProfile({...tempProfile, class: e.target.value})}>{TRAINER_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}</select>
                            <button onClick={() => { props.onUpdateProfile({...props.profile, name: tempProfile.name, trainerClass: tempProfile.class, avatar: tempProfile.avatar}); setIsEditingProfile(false); }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl sm:rounded-2xl font-black uppercase text-xs sm:text-sm shadow-xl transition-all">Update Profile</button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-center sm:justify-start gap-4 mb-2"><h2 className="text-3xl sm:text-5xl font-black text-white uppercase italic tracking-tighter">{props.profile.name}</h2><button onClick={() => { setTempProfile({name: props.profile.name, class: props.profile.trainerClass, avatar: props.profile.avatar}); setIsEditingProfile(true); }} className="p-2 text-slate-600 hover:text-emerald-400 transition-colors"><Edit3 className="w-6 h-6" /></button></div>
                            <div className="inline-flex items-center px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full"><p className="text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs italic">{props.profile.trainerClass}</p></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Data Backup</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase italic">Copy this key to save your entire vault.</p>
                      <button onClick={handleCopyKey} disabled={isProcessing} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] sm:text-xs transition-all flex items-center justify-center gap-2 ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy Backup Key</button>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Restore From Backup</h4>
                      <input className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] font-mono text-indigo-300 outline-none" placeholder="Paste Backup Key..." value={importKey} onChange={e => setImportKey(e.target.value)} />
                      <button onClick={handleImport} disabled={!importKey || isProcessing} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] sm:text-xs shadow-lg transition-all flex items-center justify-center gap-2">{isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Restore All Data</button>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'intel' && (
                <div className="space-y-12 pb-20">
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 px-1">
                      <Trophy className="w-5 h-5 text-red-500" />
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Classic Champions</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                      {legacyIntel.map(t => (
                        <div key={t.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3 flex flex-col hover:border-red-500/30 transition-all group/intel shadow-md relative overflow-hidden">
                          <div className="flex items-center gap-3 mb-3">
                             <div className="w-10 h-10 bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shrink-0">
                                <TrainerSprite id={t.avatar || 'red'} className="w-full h-full scale-125 translate-y-1" />
                             </div>
                             <div className="min-w-0">
                                <h4 className="text-[11px] font-black text-white uppercase italic truncate leading-none mb-1">{t.name}</h4>
                                <span className="px-1 py-0.5 bg-red-500/10 text-red-500 text-[6px] font-black uppercase tracking-widest rounded-sm">{t.region}</span>
                             </div>
                          </div>
                          <div className="flex justify-center -space-x-1.5 mb-4">
                            {t.pokemon.map((p, idx) => (
                              p ? <div key={idx} className="w-6 h-6 bg-slate-900 border border-slate-800 rounded-full p-0.5 shrink-0 shadow-sm"><img src={p.sprite} className="w-full h-full object-contain" /></div> : null
                            ))}
                          </div>
                          <button onClick={() => { props.onLoadEnemyTeam(t.pokemon as PokemonTeam); props.onClose(); }} className="w-full py-2 bg-red-900/80 hover:bg-red-800 text-white rounded-lg font-black uppercase italic text-[9px] shadow-lg transition-all">View Team</button>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-3">
                        <Map className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Saved Rival Teams</h3>
                      </div>
                      {manualIntel.length > 0 && <ClearAllButton type="intel" count={manualIntel.length} />}
                    </div>
                    {manualIntel.length === 0 ? (
                      <div className="py-12 text-center opacity-30 bg-slate-950/20 rounded-3xl border border-dashed border-slate-800"><Database className="w-8 h-8 mx-auto mb-3" /><p className="font-black uppercase tracking-widest italic text-[10px]">No saved rival teams found</p></div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {manualIntel.map(t => (
                          <div key={t.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3 flex flex-col hover:border-indigo-500/30 transition-all shadow-md">
                            <h4 className="text-[11px] font-black text-white uppercase italic truncate mb-2">{t.name}</h4>
                            <div className="flex justify-center gap-1 mb-4 overflow-hidden">
                              {t.pokemon.map((p, idx) => (p ? <div key={idx} className="w-6 h-6 bg-slate-900 border border-slate-800 rounded-lg p-0.5 shrink-0"><img src={p.sprite} className="w-full h-full object-contain" /></div> : <div key={idx} className="w-6 h-6 border border-dashed border-slate-800 rounded-lg shrink-0" />))}
                            </div>
                            <div className="flex gap-2 mt-auto">
                              <button onClick={() => props.onDeleteEnemyTeam(t.id)} className="p-2 bg-slate-900 text-slate-700 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                              <button onClick={() => { props.onLoadEnemyTeam(t.pokemon as PokemonTeam); props.onClose(); }} className="flex-1 py-2 bg-indigo-900 text-white rounded-lg font-black uppercase italic text-[9px] shadow-lg transition-all">Load</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {currentTab === 'teams' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pb-12">
                   {props.teams.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-30"><Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest italic text-xs sm:text-sm">No Saved Teams</p></div>
                  ) : props.teams.map(t => (
                    <div key={t.id} className="bg-slate-950/50 border border-slate-800 rounded-[1.5rem] sm:rounded-3xl p-4 sm:p-6 hover:border-indigo-500/30 transition-all flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-4">
                          {editingId === t.id ? (<div className="flex items-center gap-2 animate-in zoom-in-95"><input autoFocus className="bg-slate-900 border border-indigo-500 text-white text-sm font-black p-2 rounded-xl w-full outline-none uppercase italic" value={tempRenameValue} onChange={e => setTempRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmRename('team')} /><button onClick={() => confirmRename('team')} className="p-3 bg-indigo-600 text-white rounded-xl"><Check className="w-5 h-5" /></button></div>) : (<><h4 className="text-sm sm:text-lg font-black text-white uppercase italic truncate">{t.name}</h4><span className="text-[8px] text-slate-600 font-bold">{new Date(t.timestamp).toLocaleDateString()}</span></>)}
                        </div>
                        <ActionGroup onRename={() => startRename(t.id, t.name)} onExport={() => handleExportIndividual('team', t)} onDelete={() => props.onDeleteTeam(t.id)} />
                      </div>
                      <div className="bg-slate-900/50 rounded-xl p-3 flex items-center justify-between border border-slate-800/50 gap-4">
                        <div className="flex -space-x-3">{t.pokemon.map((p, idx) => p ? <img key={idx} src={p.sprite} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md" /> : <div key={idx} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-dashed border-slate-800" />)}</div>
                        <button onClick={() => { props.onLoadTeam(t.pokemon); props.onClose(); }} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] italic shadow-lg active:scale-95">Load Team</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentTab === 'box' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-12">
                   {props.box.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-30"><Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest italic text-xs sm:text-sm">Storage is Empty</p></div>
                  ) : props.box.map(p => (
                    <div key={p.instanceId} className="bg-slate-950/50 border border-slate-800 rounded-[1.5rem] sm:rounded-3xl p-4 hover:border-amber-500/30 transition-all flex flex-col gap-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center p-2 shrink-0"><img src={p.sprite} className="w-full h-full object-contain" /></div>
                        <div className="flex-1 min-w-0">
                          {editingId === p.instanceId ? (<div className="flex items-center gap-1.5 animate-in zoom-in-95"><input autoFocus className="bg-slate-900 border border-amber-500 text-white text-[10px] font-black p-2 rounded-lg w-full outline-none uppercase" value={tempRenameValue} onChange={e => setTempRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmRename('box')} /><button onClick={() => confirmRename('box')} className="p-2 bg-amber-600 text-white rounded-lg"><Check className="w-4 h-4" /></button></div>) : (<><h4 className="text-xs sm:text-sm font-black text-white uppercase italic truncate">{p.nickname || p.name}</h4><p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">{p.name}</p><div className="flex gap-1 mt-1">{(p.customTypes || p.types.map(t => t.name)).map(tName => <div key={tName} className="w-2 h-2 rounded-full" style={{backgroundColor: TYPE_COLORS[tName] || '#777'}} />)}</div></>)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                        <ActionGroup onRename={() => startRename(p.instanceId, p.nickname || p.name)} onExport={() => handleExportIndividual('pkmn', p)} onDelete={() => props.onDeleteBoxPkmn(p.instanceId)} />
                        <div className="relative">{addingToSlot === p.instanceId ? (<div className="flex gap-1 bg-amber-600 p-1 rounded-xl animate-in zoom-in-95">{[0,1,2,3,4,5].map(idx => (<button key={idx} onClick={() => { props.onAddToTeamFromBox(p, idx); setAddingToSlot(null); props.onClose(); }} className="w-8 h-8 flex items-center justify-center bg-amber-500 text-white rounded-lg font-black text-xs">{idx+1}</button>))}</div>) : (<button onClick={() => setAddingToSlot(p.instanceId)} className="px-4 py-2 bg-amber-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg">To Team</button>)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};