
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallpaper } from '../types';
import { soundService } from '../services/soundService';

interface SearchOverlayProps {
  wallpapers: Wallpaper[];
  onSelect: (wp: Wallpaper) => void;
  onClose: () => void;
}

const TRENDING_TAGS = ['Anime', 'Spider-man', 'Cyberpunk', 'Ghibli', 'Minimal', 'Neon'];

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ wallpapers, onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return wallpapers.filter(wp => 
      wp.title.toLowerCase().includes(q) || 
      wp.tags.some(tag => tag.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [query, wallpapers]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] bg-white dark:bg-black flex flex-col"
    >
      {/* Header */}
      <div className="px-10 pt-16 pb-10 flex flex-col gap-12">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => { soundService.playTick(); onClose(); }}
            className="group flex items-center gap-3 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="label-meta">Close Search</span>
          </button>
          <span className="label-meta text-[8px] text-black/20 dark:text-white/20">Aura Global Search</span>
        </div>

        <div className="relative group max-w-4xl">
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search criteria..."
            className="w-full bg-transparent border-b border-black/10 dark:border-white/10 py-6 font-black text-4xl lg:text-5xl tracking-tighter outline-none focus:border-accent transition-all placeholder:text-black/10 dark:placeholder:text-white/10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-10">
        <AnimatePresence mode="wait">
          {!query ? (
            <motion.div 
              key="trending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12"
            >
              <p className="label-meta text-black/30 dark:text-white/30 mb-8 ml-1">Popular Queries</p>
              <div className="flex flex-wrap gap-3">
                {TRENDING_TAGS.map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => { soundService.playTick(); setQuery(tag); }}
                    className="px-8 py-3 rounded-full border border-black/5 dark:border-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-12 pb-32"
            >
              <p className="label-meta text-black/30 dark:text-white/30 mb-10 ml-1">
                {results.length} results matching '{query}'
              </p>
              
              {results.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {results.map((wp, i) => (
                    <motion.div
                      key={wp.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => { soundService.playTap(); onSelect(wp); }}
                      className="aspect-[3/4.5] rounded-lg overflow-hidden border border-black/5 dark:border-white/5 bg-surface-light dark:bg-surface-dark group cursor-pointer"
                    >
                      <img src={wp.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center text-center">
                  <h4 className="text-4xl font-black mb-4 tracking-tighter">No Match Found</h4>
                  <p className="label-meta text-black/30 dark:text-white/30 max-w-xs mx-auto leading-relaxed uppercase">Refine your search parameters to access other multiverses.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
