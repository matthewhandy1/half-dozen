import React, { useState, useEffect } from 'react';
import { PokemonTeam } from '../types';
import { X, Copy, Upload, CheckCircle2, Share2, Clipboard, Link as LinkIcon, Download, Loader2 } from 'lucide-react';

interface ShareModalProps {
  team: PokemonTeam;
  onClose: () => void;
  onLoadTeam: (team: PokemonTeam) => void;
}

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

export const ShareModal: React.FC<ShareModalProps> = ({ team, onClose, onLoadTeam }) => {
  const [importCode, setImportCode] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [exchangeCode, setExchangeCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const generateCode = async () => {
      setIsProcessing(true);
      try {
        const payload = { 
          v: 2, 
          t: 't', 
          d: {
            n: "Shared Team",
            p: team.map(p => {
              if (!p) return null;
              return {
                id: p.id,
                n: p.nickname || null,
                a: p.selectedAbility || null,
                i: p.selectedItem || null,
                m: p.selectedMoves.map(m => m.name || null),
                ct: p.customTypes || null
              };
            })
          }
        };
        const code = await compressHelper(JSON.stringify(payload));
        setExchangeCode(code);
      } catch (e) {
        console.error("Failed to generate share code", e);
      } finally {
        setIsProcessing(false);
      }
    };
    generateCode();
  }, [team]);

  const shareLink = `https://halfdozen.ca/#share=${exchangeCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setFeedback("Link Copied!");
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(exchangeCode);
    setFeedback("Code Copied!");
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleImport = async () => {
    try {
      let val = importCode.trim();
      if (val.includes('#share=')) val = val.split('#share=')[1];
      
      const payload = await decompressHelper(val);
      
      if (payload.v === 2 && payload.t === 't') {
        onLoadTeam(payload.d.p);
        onClose();
      } else {
        alert("Invalid link or code.");
      }
    } catch (e) {
      alert("Failed to load data.");
    }
  };

  const isTeamEmpty = !team.some(p => p !== null);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Share Team</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Send your lineup to a friend</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-colors hover:bg-slate-800 rounded-2xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin">
          {/* Export Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Share This Team
            </h3>
            
            <div className="bg-slate-950 rounded-[2.5rem] border border-slate-800 p-8 flex flex-col items-center gap-6">
              <p className="text-sm text-slate-400 text-center max-w-lg leading-relaxed italic">
                {isTeamEmpty 
                  ? "Add at least one Pokémon to generate a share link." 
                  : "Copy the link below to share this team configuration instantly. Your friend can click it to import your exact lineup."}
              </p>

              {isProcessing && !isTeamEmpty ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Generating Link...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                  <button
                    onClick={handleCopyLink}
                    disabled={isTeamEmpty || isProcessing}
                    className="flex items-center justify-center gap-2 px-6 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs transition-all disabled:opacity-30 shadow-lg active:scale-95"
                  >
                    <LinkIcon className="w-4 h-4" /> Copy Link
                  </button>
                  <button
                    onClick={handleCopyCode}
                    disabled={isTeamEmpty || isProcessing}
                    className="flex items-center justify-center gap-2 px-6 py-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase text-xs transition-all disabled:opacity-30 active:scale-95"
                  >
                    <Copy className="w-4 h-4" /> Copy Code
                  </button>
                </div>
              )}

              {feedback && (
                <div className="text-center">
                  <span className="px-4 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1">
                    <CheckCircle2 className="w-3 h-3" /> {feedback}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] font-black text-slate-700 uppercase">OR</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Import Section */}
          <div className="space-y-6 pb-10">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <Upload className="w-4 h-4" /> Load External Team
            </h3>
            <div className="relative">
              <textarea
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="Paste a link or code here..."
                className="w-full h-32 p-5 rounded-[1.5rem] bg-slate-950 border border-slate-800 text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none text-xs font-mono placeholder-slate-700 transition-all"
              />
              <button
                onClick={handleImport}
                disabled={!importCode}
                className="absolute bottom-4 right-4 flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50 text-[10px] font-black uppercase shadow-xl"
              >
                <Download className="w-4 h-4" /> Load Team
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};