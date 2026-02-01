
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallpaper } from '../types';
import { soundService } from '../services/soundService';

interface SavedProps {
  onSelect: (w: Wallpaper) => void;
  savedIds: string[];
  wallpapers: Wallpaper[];
}

export const Saved: React.FC<SavedProps> = ({ onSelect, savedIds, wallpapers }) => {
  const savedItems = useMemo(() => {
    return wallpapers.filter(wp => savedIds.includes(wp.id));
  }, [savedIds, wallpapers]);

  return (
    <div className="p-6 pb-40 min-h-screen bg-background-dark">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vault</h2>
          <p className="text-white/40 text-sm">Your offline collection</p>
        </div>
        <div className="size-12 rounded-2xl bg-surface-dark border border-white/5 flex items-center justify-center">
          <span className="material-symbols-outlined text-white/40">bookmark</span>
        </div>
      </div>

      {savedItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {savedItems.map((wp, i) => (
            <motion.div
              key={wp.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { soundService.playTap(); onSelect(wp); }}
              className="group relative aspect-[3/4.5] rounded-[24px] overflow-hidden border border-white/5 bg-surface-dark cursor-pointer active:scale-95 transition-transform"
            >
              <img src={wp.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={wp.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                <p className="text-xs font-bold truncate mb-1">{wp.title}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-white/40 truncate">by {wp.author.split(' ')[0]}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="size-24 rounded-full bg-surface-dark flex items-center justify-center mb-6 border border-white/5"
          >
            <span className="material-symbols-outlined text-4xl text-white/20">bookmarks</span>
          </motion.div>
          <h3 className="text-xl font-bold mb-2">Vault is empty</h3>
          <p className="text-white/40 text-sm max-w-[200px] mb-8">
            Bookmark your favorite auras to see them here.
          </p>
        </div>
      )}
    </div>
  );
};
