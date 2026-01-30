
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { MoveDetails, SelectedMove } from '../types';
import { TYPE_COLORS } from '../constants';
import { fetchMoveDetails } from '../services/pokeApi';
import { MoveTooltip, CategoryIcon } from './PokemonSharedUI';

interface MoveSearchSelectorProps {
  selectedMove: SelectedMove;
  onChange: (val: string) => void | Promise<void>;
  placeholder: string;
  options: string[];
  globalOptions: string[];
  openUpwards?: boolean;
}

export const MoveSearchSelector = React.memo(({
  selectedMove,
  onChange,
  placeholder,
  options,
  globalOptions,
  openUpwards = false,
}: MoveSearchSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(selectedMove.name);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [tooltipData, setTooltipData] = useState<MoveDetails | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(selectedMove.name);
  }, [selectedMove.name]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(selectedMove.name); 
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedMove.name]);

  const filtered = (searchTerm ? globalOptions : options)
    .filter(m => m.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 50);

  const handleFetchAndShow = async () => {
    if (!selectedMove.name || isOpen) return;
    setShowTooltip(true);
    if (!tooltipData || tooltipData.name !== selectedMove.name) {
      try {
        const details = await fetchMoveDetails(selectedMove.name);
        setTooltipData(details);
      } catch (err) {}
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') setIsOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlightedIndex]) {
        onChange(filtered[highlightedIndex]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm(selectedMove.name);
    }
  };

  const typeColor = TYPE_COLORS[selectedMove.type] || '';

  return (
    <div className={`relative w-full flex items-center gap-2 ${isOpen ? 'z-[100]' : 'z-0 hover:z-[50]'}`} ref={dropdownRef} onClick={e => e.stopPropagation()}>
      <div 
        className="relative flex-1" 
        onMouseEnter={handleFetchAndShow} 
        onMouseLeave={() => setShowTooltip(false)}
      >
        <input
          type="text"
          className={`w-full border text-[10px] font-black py-2.5 pl-4 pr-10 rounded-xl outline-none transition-all truncate shadow-sm uppercase tracking-tight ring-1 ring-inset ring-white/10 ${
            typeColor 
              ? 'text-white border-white/20' 
              : 'bg-slate-950/80 border-slate-800 text-slate-300 focus:ring-1 focus:ring-indigo-500/30'
          }`}
          style={typeColor ? { backgroundColor: typeColor } : {}}
          value={searchTerm}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {selectedMove.damageClass && !isOpen && <CategoryIcon category={selectedMove.damageClass} className="w-3.5 h-3.5" />}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''} ${typeColor ? 'text-white/80' : 'text-slate-600'}`} />
        </div>
        {tooltipData && <MoveTooltip move={tooltipData} visible={showTooltip} />}
      </div>
      {isOpen && (
        <div className={`absolute left-0 right-0 ${openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'} bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[210] max-h-48 overflow-y-auto scrollbar-thin`}>
          {filtered.length > 0 ? filtered.map((m, idx) => (
            <button key={m} className={`w-full text-left px-4 py-2.5 text-[10px] font-bold transition-colors border-b border-slate-800 last:border-0 group flex items-center justify-between ${highlightedIndex === idx ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} onClick={() => { onChange(m); setIsOpen(false); }}>
              <span className="uppercase">{m}</span>
            </button>
          )) : <div className="px-4 py-2.5 text-[10px] text-slate-600 italic">No moves found</div>}
        </div>
      )}
    </div>
  );
});
