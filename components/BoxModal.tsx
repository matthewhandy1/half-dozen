
import React, { useState, useEffect } from 'react';
import { BoxPokemon } from '../types';
import { X, Trash2, Edit3, Plus, Package, Save, Upload, Check, Copy, Cloud } from 'lucide-react';
import { TYPE_COLORS } from '../constants';

interface BoxModalProps {
  box: BoxPokemon[];
  onClose: () => void;
  onDelete: (instanceId: string) => void;
  onUpdateNickname: (instanceId: string, name: string) => void;
  onAddToTeam: (pokemon: BoxPokemon, slotIndex: number) => void;
  onImportBox: (boxData: BoxPokemon[]) => void;
}

export const BoxModal: React.FC<BoxModalProps> = ({ box, onClose, onDelete, onUpdateNickname, onAddToTeam, onImportBox }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempNickname, setTempNickname] = useState('');
  const [addingToSlot, setAddingToSlot] = useState<string | null>(null);
  const [showImportArea, setShowImportArea] = useState(false);
  const [importText, setImportText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (box.length >= 0) {
      setSaveStatus('saving');
      const timer = setTimeout(() => setSaveStatus('saved'), 800);
      return () => clearTimeout(timer);
    }
  }, [box]);

  const handleStartEdit = (p: BoxPokemon) => {
    setEditingId(p.instanceId);
    setTempNickname(p.nickname || p.name);
  };

  const handleSaveNickname = (id: string) => {
    onUpdateNickname(id, tempNickname);
    setEditingId(null);
  };

  const handleExport = () => {
    const data = btoa(JSON.stringify(box));
    navigator.clipboard.writeText(data);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleImport = () => {
    try {
      const decoded = JSON.parse(atob(importText));
      if (Array.isArray(decoded)) {
        onImportBox(decoded);
        setImportText('');
        setShowImportArea(false);
      } else {
        alert("Invalid format");
      }
    } catch (e) {
      alert("Invalid data string");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-[3rem] shadow-2xl w-full max-w-6xl h-[90vh] sm:h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-8 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between shrink-0 bg-slate-900/50 gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight">The Box</h2>
              <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">{box.length} Pokémon Stored</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white sm:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700/50 shrink-0">
              <button onClick={() => setShowImportArea(!showImportArea)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold transition-all uppercase"><Upload className="w-3.5 h-3.5" /> Import</button>
              <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold transition-all border-l border-slate-700/50 uppercase">
                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} Share
              </button>
            </div>
            <button onClick={onClose} className="hidden sm:block p-3 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-2xl">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {showImportArea && (
          <div className="p-4 sm:p-8 bg-slate-950 border-b border-slate-800 animate-in slide-in-from-top duration-300">
            <div className="flex flex-col sm:flex-row gap-4">
              <textarea 
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-[10px] font-mono text-indigo-300 outline-none focus:ring-2 focus:ring-indigo-500/50 h-20"
                placeholder="Paste code here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="flex flex-row sm:flex-col gap-2">
                <button onClick={handleImport} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] transition-all">Import</button>
                <button onClick={() => setShowImportArea(false)} className="px-4 py-2 bg-slate-800 text-slate-400 rounded-xl font-bold uppercase text-[10px]">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-thin">
          {box.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Package className="w-16 h-16 mb-4 text-slate-700" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-sm italic">Empty Box</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {box.map((p) => (
                <div key={p.instanceId} className="bg-slate-950/50 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 group hover:border-indigo-500/30 transition-all flex flex-col">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center p-2 relative shrink-0">
                      <img src={p.sprite} alt={p.name} className="w-full h-full object-contain drop-shadow-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === p.instanceId ? (
                        <div className="flex items-center gap-2 mb-2">
                          <input autoFocus className="bg-slate-900 border border-indigo-500 text-white text-xs font-bold p-1.5 rounded-lg w-full outline-none" value={tempNickname} onChange={(e) => setTempNickname(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname(p.instanceId)} />
                          <button onClick={() => handleSaveNickname(p.instanceId)} className="text-emerald-500"><Save className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1 group/name">
                          <h4 className="text-sm sm:text-base font-black text-white truncate uppercase italic">{p.nickname || p.name}</h4>
                          <button onClick={() => handleStartEdit(p)} className="p-1 opacity-0 group-hover:opacity-100 sm:group-hover/name:opacity-100 transition-opacity text-slate-500"><Edit3 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                      <p className="text-[9px] sm:text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">{p.name}</p>
                      <div className="flex gap-1 mb-2">
                        {p.types.map(t => (<div key={t.name} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[t.name] }} />))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                    <button onClick={() => onDelete(p.instanceId)} className="p-2 text-slate-700 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    <div className="relative">
                      {addingToSlot === p.instanceId ? (
                        <div className="flex items-center gap-1 bg-indigo-600 p-1 rounded-lg sm:rounded-xl animate-in fade-in zoom-in-95 duration-200">
                          {[0, 1, 2, 3, 4, 5].map(idx => (
                            <button key={idx} onClick={() => { onAddToTeam(p, idx); setAddingToSlot(null); }} className="w-7 h-7 flex items-center justify-center bg-indigo-500 hover:bg-white hover:text-indigo-600 rounded-lg text-white text-[10px] font-black">{idx + 1}</button>
                          ))}
                          <button onClick={() => setAddingToSlot(null)} className="p-1 text-white"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingToSlot(p.instanceId)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl text-[10px] font-black uppercase transition-all shadow-lg"><Plus className="w-3.5 h-3.5" /> Deploy</button>
                      )}
                    </div>
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
