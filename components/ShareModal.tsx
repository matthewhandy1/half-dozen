
import React, { useState } from 'react';
import { PokemonTeam } from '../types';
import { X, Copy, Upload, CheckCircle2, Share2, Clipboard } from 'lucide-react';

interface ShareModalProps {
  team: PokemonTeam;
  onClose: () => void;
  onLoadTeam: (team: PokemonTeam) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ team, onClose, onLoadTeam }) => {
  const [importCode, setImportCode] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  const getTeamCode = () => {
    return btoa(JSON.stringify(team));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getTeamCode());
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      const decodedTeam = JSON.parse(atob(importCode));
      if (Array.isArray(decodedTeam)) {
        onLoadTeam(decodedTeam);
        onClose();
      } else {
        alert("Invalid team code format.");
      }
    } catch (e) {
      alert("Invalid team code!");
    }
  };

  const isTeamEmpty = !team.some(p => p !== null);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Team Share</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Import or Export Team Codes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-2xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Export Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Export Current Team
            </h3>
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 flex flex-col items-center gap-6">
              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Generate a unique code for your current team configuration to share with others or back up your setup.
              </p>
              <button
                onClick={handleCopyCode}
                disabled={isTeamEmpty}
                className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl transition-all group disabled:opacity-30 ${
                  showCopied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                } active:scale-95`}
              >
                {showCopied ? (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-black uppercase tracking-tight text-lg">Code Copied!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="font-black uppercase tracking-tight text-lg">Copy Team Code</span>
                  </>
                )}
              </button>
              {isTeamEmpty && <p className="text-[10px] text-red-500 font-bold uppercase">Add Pokémon to your team first</p>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] font-black text-slate-700 uppercase">OR</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Import Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import Team Code
            </h3>
            <div className="relative">
              <textarea
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="Paste a team code here..."
                className="w-full h-40 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none text-xs font-mono placeholder-slate-700 transition-all"
              />
              <button
                onClick={handleImport}
                disabled={!importCode}
                className="absolute bottom-4 right-4 flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50 text-xs font-black uppercase shadow-xl"
              >
                <Upload className="w-4 h-4" /> Load Team
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
