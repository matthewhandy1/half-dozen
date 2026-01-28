
import React, { useState } from 'react';
import { UserProfile, PokemonTeam, BoxPokemon, SavedTeam, SavedEnemyTeam, PokemonData, SelectedMove } from '../types';
import { 
  X, Fingerprint, Users, Package, ShieldAlert, 
  Save, Copy, Check, Upload, Trash2, Edit3, 
  Calendar, Trophy, User, RefreshCw,
  Share2, Zap, Download, Loader2, Dna,
  UserCheck, BadgeCheck
} from 'lucide-react';
import { TYPE_COLORS } from '../constants';
import { fetchPokemon, fetchMoveDetails, fetchItemDescription } from '../services/pokeApi';

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
  onDeleteBoxPkmn: (id: string) => void;
  onUpdateBoxNickname: (id: string, name: string) => void;
  onAddToTeamFromBox: (pokemon: BoxPokemon, slotIndex: number) => void;
  onAddBoxPkmn: (pokemon: BoxPokemon) => void;
  onDeleteEnemyTeam: (id: string) => void;
  onLoadEnemyTeam: (team: PokemonTeam) => void;
  onExportMasterKey: () => string;
  onImportMasterKey: (key: string) => void;
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

  const [exchangeMode, setExchangeMode] = useState<'none' | 'import' | 'export'>('none');
  const [exchangeCode, setExchangeCode] = useState('');
  const [exchangeFeedback, setExchangeFeedback] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Trainer', icon: Fingerprint, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'teams', label: 'Teams', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 'box', label: 'The Box', icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'intel', label: 'Intel', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10' },
  ] as const;

  const handleCopyKey = () => {
    try {
      const key = props.onExportMasterKey();
      navigator.clipboard.writeText(key)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(err => {
          console.error("Clipboard Error:", err);
          alert("Automatic clipboard copy blocked by browser. Please ensure you are interacting with the page.");
        });
    } catch (e) {
      console.error("Master Key Export Error:", e);
      alert("An error occurred while generating your Master Key. Check the console for details.");
    }
  };

  const handleImport = () => {
    if (!importKey.trim()) return;
    try {
      props.onImportMasterKey(importKey);
      setImportKey('');
      setExchangeFeedback("Archive Synchronized!");
      setTimeout(() => setExchangeFeedback(null), 3000);
    } catch (e) {
      alert("Invalid Master Sync Key!");
    }
  };

  const serializePkmnDNA = (p: PokemonData) => ({
    id: p.id,
    n: p.nickname || null,
    a: p.selectedAbility || null,
    i: p.selectedItem || null,
    m: p.selectedMoves.map(m => m.name || null),
    ct: p.customTypes || null
  });

  const handleExportIndividual = (type: 'team' | 'pkmn', data: any) => {
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
      const jsonStr = JSON.stringify(payload);
      // Safe base64 for Unicode
      const code = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => 
        String.fromCharCode(parseInt(p1, 16))
      ));
      setExchangeCode(code);
      setExchangeMode('export');
      navigator.clipboard.writeText(code).catch(() => {});
      setExchangeFeedback("DNA Chip Transmitted!");
      setTimeout(() => setExchangeFeedback(null), 3000);
    } catch (e) {
      console.error("DNA Export Error:", e);
      alert("Could not generate DNA chip.");
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

  const handleImportIndividual = async () => {
    if (!exchangeCode.trim()) return;
    setIsProcessing(true);
    try {
      // Decode base64 to Unicode string
      const jsonStr = decodeURIComponent(Array.prototype.map.call(atob(exchangeCode.trim()), (c) => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const payload = JSON.parse(jsonStr);
      if (payload.v === 2) {
        if (payload.t === 't') {
          const pData = await Promise.all(
            payload.d.p.map((dna: any) => dna ? reconstructPkmnFromDNA(dna) : null)
          );
          const newTeam: SavedTeam = {
            id: Date.now().toString(),
            name: `Import: ${payload.d.n}`,
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
      setExchangeFeedback("DNA Reconstructed!");
      setTimeout(() => setExchangeFeedback(null), 3000);
    } catch (e) {
      console.error("DNA Reconstruct Error:", e);
      alert("DNA Sequence Error.");
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
      <button onClick={onRename} className="p-3.5 sm:p-3 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 transition-colors border-r border-slate-800" title="Rename"><Edit3 className="w-5 h-5 sm:w-4 sm:h-4" /></button>
      <button onClick={onExport} className="p-3.5 sm:p-3 hover:bg-amber-500/10 text-slate-500 hover:text-amber-400 transition-colors border-r border-slate-800" title="Share DNA"><Share2 className="w-5 h-5 sm:w-4 sm:h-4" /></button>
      <button onClick={onDelete} className="p-3.5 sm:p-3 hover:bg-red-500/10 text-slate-700 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-5 h-5 sm:w-4 sm:h-4" /></button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl w-full max-w-6xl h-[95vh] sm:h-[85vh] flex flex-col sm:flex-row overflow-hidden animate-in zoom-in-95 duration-300 relative">
        
        {/* DNA Exchange Overlay */}
        {exchangeMode !== 'none' && (
          <div className="absolute inset-0 z-[310] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-300">
            <button onClick={() => setExchangeMode('none')} disabled={isProcessing} className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2.5 sm:p-3 bg-slate-800 rounded-xl sm:rounded-2xl text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
            <div className="w-full max-w-lg space-y-6 sm:space-y-8 text-center">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl`}>
                {isProcessing ? <Dna className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" /> : exchangeMode === 'import' ? <Download className="w-8 h-8 sm:w-10 sm:h-10" /> : <Share2 className="w-8 h-8 sm:w-10 sm:h-10" />}
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight">{exchangeMode === 'import' ? 'DNA Receiver' : 'DNA Transmitter'}</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] sm:text-xs">High-Density DNA Sequence Exchange</p>
              </div>
              <div className="space-y-4 w-full">
                <textarea 
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-[10px] font-mono text-indigo-300 outline-none h-32 focus:ring-2 focus:ring-indigo-500/50" 
                  placeholder="Paste DNA Chip..." 
                  value={exchangeCode} 
                  onChange={e => setExchangeCode(e.target.value)} 
                  readOnly={exchangeMode === 'export'} 
                />
                {exchangeMode === 'import' ? (
                  <button onClick={handleImportIndividual} disabled={isProcessing || !exchangeCode.trim()} className="w-full py-4 sm:py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl sm:rounded-3xl font-black uppercase text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 sm:gap-3">{isProcessing ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'Reconstruct DNA'}</button>
                ) : (
                  <button onClick={() => { navigator.clipboard.writeText(exchangeCode).catch(() => {}); setExchangeFeedback("Copied!"); setTimeout(() => setExchangeFeedback(null), 2000); }} className="w-full py-4 sm:py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl sm:rounded-3xl font-black uppercase text-xs sm:text-sm flex items-center justify-center gap-2 sm:gap-3"><Copy className="w-4 h-4 sm:w-5 sm:h-5" /> Copy DNA Chip</button>
                )}
              </div>
            </div>
          </div>
        )}

        {exchangeFeedback && (
          <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 z-[400] px-5 py-2.5 bg-emerald-600 text-white rounded-full font-black uppercase text-[10px] sm:text-xs shadow-2xl flex items-center gap-2 sm:gap-3 animate-in slide-in-from-top-4">
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {exchangeFeedback}
          </div>
        )}

        {/* Sidebar Nav */}
        <div className="w-full sm:w-64 bg-slate-950/50 border-b sm:border-b-0 sm:border-r border-slate-800 p-3 sm:p-8 flex flex-col shrink-0">
          <div className="hidden sm:block mb-8">
            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">The Vault</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Master Terminal</p>
          </div>
          
          <div className="grid grid-cols-4 sm:flex sm:flex-col gap-2 sm:gap-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-3 p-2 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl transition-all ${
                  currentTab === tab.id ? `${tab.bg} border border-white/10 shadow-lg` : 'hover:bg-slate-800 text-slate-500'
                }`}
              >
                <tab.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${currentTab === tab.id ? tab.color : ''}`} />
                <span className={`text-[8px] sm:text-xs font-black uppercase tracking-widest text-center sm:text-left ${currentTab === tab.id ? 'text-white' : ''}`}>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 sm:mt-auto">
            <button 
              onClick={() => { setExchangeCode(''); setExchangeMode('import'); }}
              className="w-full flex items-center justify-center gap-2 py-3 sm:py-4 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/20 rounded-xl sm:rounded-2xl font-black uppercase text-[8px] sm:text-[10px] transition-all"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> DNA Receiver
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/40">
          <div className="px-4 py-4 sm:px-8 sm:py-8 border-b border-slate-800 flex items-center justify-between shrink-0">
            <h3 className="text-lg sm:text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-3">
              {tabs.find(t => t.id === currentTab)?.label}
            </h3>
            <button onClick={props.onClose} className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-800 rounded-lg sm:rounded-xl"><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-10 scrollbar-thin">
            {currentTab === 'profile' && (
              <div className="space-y-8 sm:space-y-12 max-w-4xl mx-auto">
                <div className="bg-slate-950/50 border border-slate-800 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-12 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center">
                    <div className="w-32 h-32 sm:w-48 sm:h-48 bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border-4 border-slate-800 flex items-center justify-center shadow-2xl shrink-0 overflow-hidden relative group/avatar">
                      <TrainerSprite 
                        id={tempProfile.avatar || props.profile.avatar || 'red'} 
                        className="w-full h-full object-contain scale-125 translate-y-2 drop-shadow-xl" 
                      />
                      <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      {isEditingProfile ? (
                        <div className="space-y-6 max-w-lg mx-auto sm:mx-0">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 px-1">
                              <UserCheck className="w-3.5 h-3.5" /> Identity Label
                            </div>
                            <input 
                              className="bg-slate-900 border border-emerald-500 text-white text-xl sm:text-2xl font-black p-4 rounded-xl sm:rounded-2xl w-full outline-none uppercase italic shadow-inner" 
                              value={tempProfile.name} 
                              onChange={e => setTempProfile({...tempProfile, name: e.target.value})} 
                              placeholder="Name"
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 px-1">
                              <BadgeCheck className="w-3.5 h-3.5" /> Trainer Class
                            </div>
                            <select 
                              className="bg-slate-900 border border-slate-700 text-white text-sm font-black p-4 rounded-xl sm:rounded-2xl w-full outline-none uppercase italic shadow-inner appearance-none cursor-pointer"
                              value={tempProfile.class}
                              onChange={e => setTempProfile({...tempProfile, class: e.target.value})}
                            >
                              {TRAINER_CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                            </select>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 px-1">
                              <Zap className="w-3.5 h-3.5" /> Profile Sprite
                            </div>
                            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 p-3 bg-slate-900/50 rounded-2xl border border-slate-800 max-h-40 overflow-y-auto scrollbar-thin">
                              {TRAINER_AVATARS.map(avatar => (
                                <button
                                  key={avatar.id}
                                  onClick={() => setTempProfile({...tempProfile, avatar: avatar.id})}
                                  className={`aspect-square rounded-lg flex items-center justify-center p-1 transition-all overflow-hidden ${tempProfile.avatar === avatar.id ? 'bg-emerald-600 ring-2 ring-emerald-400' : 'bg-slate-800 hover:bg-slate-700'}`}
                                >
                                  <TrainerSprite id={avatar.id} name={avatar.name} className="w-full h-full" />
                                </button>
                              ))}
                            </div>
                          </div>

                          <button 
                            onClick={() => { 
                              props.onUpdateProfile({
                                ...props.profile, 
                                name: tempProfile.name, 
                                trainerClass: tempProfile.class,
                                avatar: tempProfile.avatar
                              }); 
                              setIsEditingProfile(false); 
                            }} 
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl sm:rounded-2xl font-black uppercase text-xs sm:text-sm shadow-xl shadow-emerald-900/40 transition-all active:scale-95"
                          >
                            Update Trainer DNA
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-center sm:justify-start gap-4 mb-2">
                            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase italic tracking-tighter">{props.profile.name}</h2>
                            <button onClick={() => { setTempProfile({name: props.profile.name, class: props.profile.trainerClass, avatar: props.profile.avatar}); setIsEditingProfile(true); }} className="p-2 text-slate-600 hover:text-emerald-400 transition-colors"><Edit3 className="w-6 h-6" /></button>
                          </div>
                          <div className="inline-flex items-center px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                            <p className="text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs italic">{props.profile.trainerClass}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 sm:gap-12 mt-8 sm:mt-10 pt-8 border-t border-slate-800/50">
                            <div><span className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase block tracking-widest mb-1">Passport ID</span><span className="text-xs sm:text-lg font-mono text-slate-200 font-bold">{props.profile.trainerId}</span></div>
                            <div><span className="text-[8px] sm:text-[10px] font-black text-slate-600 uppercase block tracking-widest mb-1">Issue Date</span><span className="text-xs sm:text-lg font-mono text-slate-200 font-bold">{new Date(props.profile.joinedAt).toLocaleDateString()}</span></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2"><Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Global Export</h4>
                    <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 space-y-4">
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase leading-relaxed italic">Full Archive of Vault Data</p>
                      <button onClick={handleCopyKey} className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs transition-all flex items-center justify-center gap-2 ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                        {copySuccess ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} Master Key
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2"><RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Global Restore</h4>
                    <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800 space-y-4">
                      <input className="w-full bg-slate-900 border border-slate-800 rounded-lg sm:rounded-xl p-3 text-[10px] font-mono text-indigo-300 outline-none" placeholder="Paste Master Key..." value={importKey} onChange={e => setImportKey(e.target.value)} />
                      <button onClick={handleImport} disabled={!importKey} className="w-full py-3 sm:py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs shadow-lg active:scale-95 disabled:opacity-30">Import Archive</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'teams' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {props.teams.length === 0 ? (
                  <div className="col-span-full py-20 text-center opacity-30"><Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest italic text-xs sm:text-sm">No Teams Stored</p></div>
                ) : props.teams.map(t => (
                  <div key={t.id} className="bg-slate-950/50 border border-slate-800 rounded-[1.5rem] sm:rounded-3xl p-4 sm:p-6 hover:border-indigo-500/30 transition-all flex flex-col gap-4 sm:gap-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                        {editingId === t.id ? (
                          <div className="flex items-center gap-1.5 sm:gap-2 w-full animate-in zoom-in-95">
                            <input autoFocus className="bg-slate-900 border border-indigo-500 text-white text-sm sm:text-lg font-black p-2 rounded-lg sm:rounded-xl w-full outline-none uppercase italic" value={tempRenameValue} onChange={e => setTempRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmRename('team')} />
                            <button onClick={() => confirmRename('team')} className="p-3 bg-indigo-600 text-white rounded-lg sm:rounded-xl"><Check className="w-5 h-5 sm:w-5 sm:h-5" /></button>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-sm sm:text-lg font-black text-white uppercase italic tracking-tight truncate">{t.name}</h4>
                            <span className="text-[8px] sm:text-[10px] text-slate-600 font-bold">{new Date(t.timestamp).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      <ActionGroup onRename={() => startRename(t.id, t.name)} onExport={() => handleExportIndividual('team', t)} onDelete={() => props.onDeleteTeam(t.id)} />
                    </div>
                    <div className="bg-slate-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between border border-slate-800/50 gap-4">
                      <div className="flex -space-x-3">
                        {t.pokemon.map((p, idx) => p ? <img key={idx} src={p.sprite} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md" /> : <div key={idx} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-dashed border-slate-800" />)}
                      </div>
                      <button onClick={() => { props.onLoadTeam(t.pokemon); props.onClose(); }} className="w-full sm:w-auto px-5 py-3 sm:px-5 sm:py-2.5 bg-indigo-600 text-white rounded-lg sm:rounded-xl font-black uppercase text-[10px] sm:text-[10px] italic shadow-lg active:scale-95">Deploy Team</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentTab === 'box' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {props.box.length === 0 ? (
                  <div className="col-span-full py-20 text-center opacity-30"><Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest italic text-xs sm:text-sm">The Box is Empty</p></div>
                ) : props.box.map(p => (
                  <div key={p.instanceId} className="bg-slate-950/50 border border-slate-800 rounded-[1.5rem] sm:rounded-3xl p-4 sm:p-5 hover:border-amber-500/30 transition-all flex flex-col gap-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center p-2 shrink-0"><img src={p.sprite} className="w-full h-full object-contain drop-shadow-md" /></div>
                      <div className="flex-1 min-w-0">
                        {editingId === p.instanceId ? (
                          <div className="flex items-center gap-1.5 sm:gap-2 animate-in zoom-in-95">
                            <input autoFocus className="bg-slate-900 border border-amber-500 text-white text-[10px] sm:text-sm font-black p-2 rounded-lg w-full outline-none uppercase italic" value={tempRenameValue} onChange={e => setTempRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirmRename('box')} />
                            <button onClick={() => confirmRename('box')} className="p-2 bg-amber-600 text-white rounded-lg"><Check className="w-5 h-5 sm:w-4 sm:h-4" /></button>
                          </div>
                        ) : (
                          <>
                            <h4 className="text-xs sm:text-sm font-black text-white uppercase italic truncate">{p.nickname || p.name}</h4>
                            <p className="text-[8px] sm:text-[9px] text-slate-600 font-black uppercase tracking-widest">{p.name}</p>
                            <div className="flex gap-1 mt-1.5">
                              {(p.customTypes || p.types.map(t => t.name)).map(tName => <div key={tName} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{backgroundColor: TYPE_COLORS[tName] || '#777'}} />)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-800/50">
                      <ActionGroup onRename={() => startRename(p.instanceId, p.nickname || p.name)} onExport={() => handleExportIndividual('pkmn', p)} onDelete={() => props.onDeleteBoxPkmn(p.instanceId)} />
                      <div className="relative">
                        {addingToSlot === p.instanceId ? (
                          <div className="flex gap-1 bg-amber-600 p-1.5 rounded-xl animate-in zoom-in-95">
                            {[0,1,2,3,4,5].map(idx => (
                              <button key={idx} onClick={() => { props.onAddToTeamFromBox(p, idx); setAddingToSlot(null); props.onClose(); }} className="w-9 h-9 flex items-center justify-center bg-amber-500 text-white rounded-lg font-black text-xs sm:text-[10px]">{idx+1}</button>
                            ))}
                          </div>
                        ) : (
                          <button onClick={() => setAddingToSlot(p.instanceId)} className="px-5 py-3 sm:px-4 sm:py-2 bg-amber-600 text-white rounded-lg sm:rounded-xl font-black uppercase text-[10px] sm:text-[10px] shadow-lg active:scale-95">Deploy</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentTab === 'intel' && (
              <div className="space-y-3 sm:space-y-4">
                {props.enemyTeams.length === 0 ? (
                  <div className="py-20 text-center opacity-30"><ShieldAlert className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" /><p className="font-black uppercase tracking-widest italic text-xs sm:text-sm">No Intel Logs</p></div>
                ) : props.enemyTeams.map(t => (
                  <div key={t.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 hover:border-red-500/30 transition-all">
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-2">
                        {t.id === 'trainer-red-classic' && <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />}
                        <h4 className="text-sm sm:text-lg font-black text-white uppercase italic truncate">{t.name}</h4>
                      </div>
                      <div className="flex gap-1.5 sm:gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                        {t.pokemon.map((p, idx) => p ? <div key={idx} className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 border border-slate-800 rounded-lg sm:rounded-xl p-1 shrink-0"><img src={p.sprite} className="w-full h-full object-contain" /></div> : <div key={idx} className="w-8 h-8 sm:w-10 sm:h-10 border border-dashed border-slate-800 rounded-lg sm:rounded-xl shrink-0" />)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
                      {t.id !== 'trainer-red-classic' && <button onClick={() => props.onDeleteEnemyTeam(t.id)} className="flex-1 sm:flex-none p-3.5 sm:p-3 bg-slate-900 text-slate-700 hover:text-red-500 rounded-lg sm:rounded-2xl transition-colors"><Trash2 className="w-5 h-5 sm:w-5 sm:h-5" /></button>}
                      <button onClick={() => { props.onLoadEnemyTeam(t.pokemon as PokemonTeam); props.onClose(); }} className="flex-[2] sm:flex-none px-6 py-4 sm:px-6 sm:py-3 bg-red-900 text-white rounded-lg sm:rounded-2xl font-black uppercase text-[10px] sm:text-xs italic shadow-lg active:scale-95">Analyze</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
