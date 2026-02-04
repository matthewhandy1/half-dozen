
import React from 'react';
import { X, HelpCircle, LayoutGrid, Fingerprint, Package, ShieldAlert, Zap, Dna, Share2, Swords, ShieldCheck, Trophy, Map, Link as LinkIcon } from 'lucide-react';

interface InfoModalProps {
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-[2rem] sm:rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 sm:p-10 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">App Guide</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">How to use Half Dozen</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-2xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-12 scrollbar-thin pb-20">
          
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 text-indigo-400" />
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">1. Building Your Team</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Finding Pokemon</p>
                <p className="text-xs text-slate-500 leading-relaxed italic">Click <span className="text-white font-black">"Add Pokemon"</span> on any slot to search. You can select moves, abilities, and even change a Pokemon's typing for special battle formats.</p>
              </div>
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Mobile Settings</p>
                <p className="text-xs text-slate-500 leading-relaxed italic">On mobile, tap a card to open the <span className="text-indigo-400 font-black italic">Config Menu</span>. Here you can set nicknames, pick from all available moves, and choose your ability.</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">2. Rival Scouting & Champions</h3>
            </div>
            <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-slate-800 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <p className="text-sm font-black text-white uppercase italic">Hall of Champions</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed italic">In the Vault, you can find teams used by legendary Champions like <span className="text-white">Cynthia</span>, <span className="text-white">Blue</span>, and <span className="text-white">Leon</span>. Load them into the scout section to test your team's strength against them.</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Map className="w-5 h-5 text-indigo-400" />
                    <p className="text-sm font-black text-white uppercase italic">Saved Rival Teams</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed italic">Manual scouts can be saved as <span className="text-white">Field Recon</span> data. Save your friends' or rivals' teams to keep a permanent record of their weaknesses.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Share2 className="w-6 h-6 text-indigo-400" />
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">3. Modern Sharing</h3>
            </div>
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2rem] space-y-6">
               <p className="text-xs text-slate-400 leading-relaxed italic">
                 Half Dozen uses <span className="text-white font-black italic">Share Cards</span> to move data between devices instantly.
               </p>
               <div className="bg-slate-950/40 p-6 rounded-2xl border border-white/5 space-y-3 max-w-md">
                  <div className="flex items-center gap-2">
                     <LinkIcon className="w-4 h-4 text-indigo-400" />
                     <p className="text-[11px] font-black text-white uppercase italic">Shareable Links</p>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Generate a link to a specific team or build. When a friend clicks it, they can load your build instantly into their app.</p>
               </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">4. Storage & Backups</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">The Storage Box</p>
                <p className="text-xs text-slate-500 leading-relaxed italic">Store specific builds of individual Pokemon. Use <span className="text-amber-400 font-black italic">"Save All to Box"</span> to quickly stash your entire current team.</p>
              </div>
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Full Backups</p>
                <p className="text-xs text-slate-500 leading-relaxed italic">Found in the Profile tab, the <span className="text-emerald-400 font-black italic">Backup Key</span> allows you to export your entire vault (all teams and stored Pokemon) to another device.</p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-950 border-t border-slate-800 text-center">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase italic text-sm shadow-xl active:scale-95 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
