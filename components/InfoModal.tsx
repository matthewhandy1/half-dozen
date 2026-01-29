
import React from 'react';
import { X, Info, LayoutGrid, Fingerprint, Package, ShieldAlert, Zap, Dna, Share2, Swords, ShieldCheck } from 'lucide-react';

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
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Technical Intel</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Half Dozen Terminal Operation Guide</p>
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
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">1. Building Your Squad</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Active Slotting</p>
                <p className="text-xs text-slate-500 leading-relaxed italic">Click <span className="text-white font-black">"Add Pokemon"</span> on any empty slot to search the PokeAPI directory. Once a Pokemon is selected, its base stats and default attributes are initialized.</p>
              </div>
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">The Architect Mode</p>
                <p className="text-xs text-slate-500 leading-relaxed italic">On mobile, tap a Pokemon to open the full <span className="text-indigo-400 font-black italic">Architect Modal</span>. On desktop, use the icons on the card to edit nicknames, change moves, or adjust typing.</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">2. The Vault System</h3>
            </div>
            <div className="bg-slate-950/50 p-8 rounded-[2rem] border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-amber-400" />
                    <p className="text-sm font-black text-white uppercase italic">The Box (Stash)</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed italic">The Box is your permanent storage for individual Pokemon builds. Use <span className="text-amber-400 font-black italic">"Stash All"</span> to save your entire current team into the Box for later use.</p>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-indigo-400" />
                    <p className="text-sm font-black text-white uppercase italic">Team Configurations</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed italic">Save full 6-Pokemon lineups in the Teams tab. You can name them, rename them, or quickly deploy them to the main view.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Swords className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">3. Battle Analytics</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex flex-col items-center text-center">
                <ShieldCheck className="w-8 h-8 text-red-500 mb-4" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Defensive Matrix</p>
                <p className="text-[10px] text-slate-600 leading-tight italic">Analyze team-wide type vulnerabilities. Lower scores indicate better coverage.</p>
              </div>
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex flex-col items-center text-center">
                <Zap className="w-8 h-8 text-emerald-500 mb-4" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Offensive Matrix</p>
                <p className="text-[10px] text-slate-600 leading-tight italic">Tracks your move coverage. Ensures your team can hit every type for Super Effective damage.</p>
              </div>
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex flex-col items-center text-center">
                <ShieldAlert className="w-8 h-8 text-red-400 mb-4" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Enemy Scouting</p>
                <p className="text-[10px] text-slate-600 leading-tight italic">Scout rival teams (like Red) and view a direct Matchup Matrix against your active squad.</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <Dna className="w-6 h-6 text-indigo-400" />
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">4. DNA Transmission (Sharing)</h3>
            </div>
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2rem] space-y-4">
               <p className="text-xs text-slate-400 leading-relaxed italic">
                 Half Dozen uses <span className="text-white font-black italic">DNA Sequences</span> to share data without a central server.
               </p>
               <ul className="space-y-4">
                 <li className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0 text-indigo-400 font-black text-xs">A</div>
                   <div>
                     <p className="text-[11px] font-black text-white uppercase italic">Individual DNA Chips</p>
                     <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Share a single Pokemon or Team config using the DNA icon in the Vault.</p>
                   </div>
                 </li>
                 <li className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0 text-indigo-400 font-black text-xs">B</div>
                   <div>
                     <p className="text-[11px] font-black text-white uppercase italic">Master Sync Key</p>
                     <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">The ultimate backup. Found in the Trainer Profile, this key stores your ENTIRE archive.</p>
                   </div>
                 </li>
               </ul>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-950 border-t border-slate-800 text-center">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase italic text-sm shadow-xl active:scale-95 transition-all"
          >
            Acknowledge Intel
          </button>
        </div>
      </div>
    </div>
  );
};
