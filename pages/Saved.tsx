
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallpaper } from '../types';
import { soundService } from '../services/soundService';
import { Skeleton } from '../components/Skeleton';
import { useState } from 'react';
import { AnimateIcon } from '../components/ui/AnimateIcon';
import { BookmarkIcon } from '../components/ui/Icons';
import { Masonry } from '../components/ui/Masonry';

interface SavedProps {
  onSelect: (w: Wallpaper) => void;
  savedIds: string[];
  wallpapers: Wallpaper[];
}

const SavedComp: React.FC<SavedProps> = ({ onSelect, savedIds, wallpapers }) => {
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
          <AnimateIcon animation="path">
            <BookmarkIcon size={24} className="text-white/40" />
          </AnimateIcon>
        </div>
      </div>

      {savedItems.length > 0 ? (
        <Masonry<Wallpaper>
          items={savedItems}
          gap={8}
          renderItem={(wp) => (
            <motion.div
              key={wp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={() => { soundService.playTap(); onSelect(wp); }}
            >
              <div
                className="pin-card"
                style={{
                  aspectRatio: wp.width && wp.height ? `${wp.width}/${wp.height}` : '3/4'
                }}
              >
                <img
                  src={wp.url}
                  className="w-full h-full object-cover"
                  alt={wp.title}
                  loading="lazy"
                />
                <div className="pin-overlay" />
              </div>
              <div className="pin-meta">
                <h3 className="text-on-surface">{wp.title}</h3>
                <p className="text-on-surface-variant text-xs truncate">{wp.author}</p>
              </div>
            </motion.div>
          )}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="size-24 rounded-full bg-surface-dark flex items-center justify-center mb-6 border border-white/5"
          >
            <AnimateIcon animation="path">
              <BookmarkIcon size={40} className="text-white/20" />
            </AnimateIcon>
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

// Optimization: Memoize Saved to prevent re-renders when App state changes
export const Saved = React.memo(SavedComp);
