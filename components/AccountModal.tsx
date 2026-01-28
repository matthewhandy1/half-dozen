
import React, { useState } from 'react';
import { UserProfile, MasterSyncPackage } from '../types';
import { X, User, ShieldCheck, RefreshCw, LogOut, Copy, Check, Upload, Save, Fingerprint, Award, CreditCard } from 'lucide-react';

interface AccountModalProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onClose: () => void;
  onExportMasterKey: () => string;
  onImportMasterKey: (key: string) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ profile, onUpdateProfile, onClose, onExportMasterKey, onImportMasterKey }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const [tempClass, setTempClass] = useState(profile.trainerClass);
  const [importKey, setImportKey] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');

  const handleSaveProfile = () => {
    onUpdateProfile({ ...profile, name: tempName, trainerClass: tempClass });
    setIsEditing(false);
  };

  const handleCopyKey = () => {
    const key = onExportMasterKey();
    navigator.clipboard.writeText(key);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }, 1500);
  };

  const handleImport = () => {
    if (!importKey.trim()) return;
    try {
      onImportMasterKey(importKey);
      setImportKey('');
      handleSync();
    } catch (e) {
      alert("Invalid Master Sync Key!");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl sm:rounded-[3rem] shadow-2xl w-full max-w-4xl h-[90vh] sm:h-auto flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tight">Trainer Passport</h2>
              <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Global Identity & Sync Hub</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 sm:p-3 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-xl sm:rounded-2xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 sm:space-y-12">
          {/* Trainer Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-slate-950/50 border border-slate-800 rounded-[2.2rem] p-6 sm:p-10 backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full -ml-24 -mb-24 blur-3xl"></div>
              
              <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start relative z-10">
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-slate-900 rounded-[2rem] border-4 border-slate-800 flex items-center justify-center relative overflow-hidden group/avatar shadow-2xl shrink-0">
                  <User className="w-16 h-16 sm:w-20 sm:h-20 text-slate-700" />
                  <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity"></div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-4 w-full">
                  <div className="space-y-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input 
                          className="bg-slate-900 border border-indigo-500 text-white text-2xl font-black p-3 rounded-2xl w-full outline-none uppercase italic"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                        />
                        <select 
                          className="bg-slate-900 border border-slate-700 text-slate-400 text-sm font-black p-3 rounded-2xl w-full outline-none uppercase"
                          value={tempClass}
                          onChange={(e) => setTempClass(e.target.value)}
                        >
                          <option value="Ace Trainer">Ace Trainer</option>
                          <option value="Pokemon Master">Pokemon Master</option>
                          <option value="Hex Maniac">Hex Maniac</option>
                          <option value="Youngster">Youngster</option>
                          <option value="Elite Four">Elite Four</option>
                        </select>
                        <button onClick={handleSaveProfile} className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs">Confirm Identity</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center sm:justify-start gap-4">
                          <h3 className="text-3xl sm:text-4xl font-black text-white uppercase italic tracking-tighter">{profile.name}</h3>
                          <button onClick={() => setIsEditing(true)} className="p-2 text-slate-600 hover:text-indigo-400 transition-colors"><Fingerprint className="w-5 h-5" /></button>
                        </div>
                        <p className="text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs italic">{profile.trainerClass}</p>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Passport ID</span>
                      <span className="text-xs sm:text-sm font-mono text-slate-300 font-bold">{profile.trainerId}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Issue Date</span>
                      <span className="text-xs sm:text-sm font-mono text-slate-300 font-bold">{new Date(profile.joinedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Master Sync Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Save className="w-3.5 h-3.5" /> Cloud Export
              </h4>
              <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 space-y-4">
                <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase">Generate a Master Sync Key to backup all your teams, your box, and your trainer profile in one string.</p>
                <button 
                  onClick={handleCopyKey}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase text-xs transition-all ${copySuccess ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copySuccess ? 'Key Copied' : 'Generate Key'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} /> Master Restore
              </h4>
              <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 space-y-4">
                <input 
                  type="text"
                  placeholder="Paste Master Key..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] font-mono text-indigo-300 outline-none focus:ring-2 focus:ring-indigo-500/50"
                  value={importKey}
                  onChange={(e) => setImportKey(e.target.value)}
                />
                <button 
                  onClick={handleImport}
                  disabled={!importKey}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs disabled:opacity-30 shadow-lg shadow-indigo-600/20"
                >
                  <Upload className="w-4 h-4" /> Import Data
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-slate-500">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Local Persistence Enabled</span>
            </div>
            <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest text-center sm:text-right">A backend (Supabase/Firebase) would allow for real-time automatic syncing across sessions.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
