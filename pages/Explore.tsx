
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_COLLECTIONS, MOCK_WALLPAPERS, CATEGORY_ASSETS } from '../constants';
import { soundService } from '../services/soundService';
import { Wallpaper } from '../types';

interface ExploreProps {
  onSelect: (wp: Wallpaper) => void;
}

const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

export const Explore: React.FC<ExploreProps> = ({ onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setDebouncedQuery('');
    }
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const filteredWallpapers = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = normalize(debouncedQuery);
    return MOCK_WALLPAPERS.filter(wp => 
      normalize(wp.title).includes(q) || 
      wp.tags.some(t => normalize(t).includes(q))
    ).slice(0, 20);
  }, [debouncedQuery]);

  const exploreCategories = Object.entries(CATEGORY_ASSETS).filter(([name]) => name !== 'All');

  return (
    <div className="pb-40 px-6 lg:px-12 pt-8 lg:pt-20">
      <div className="mb-12">
        <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-4">Discover</h2>
        <p className="text-black/40 dark:text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Explore the Visual Frontier</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-16 max-w-4xl">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-black/20 dark:text-white/20 text-2xl group-focus-within:text-accent transition-colors">search</span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search characters or series..." 
            className="w-full h-16 pl-10 bg-transparent border-b border-black/10 dark:border-white/10 outline-none font-bold text-xl focus:border-accent transition-all placeholder:text-black/10 dark:placeholder:text-white/10"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {debouncedQuery ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <h3 className="label-meta text-black/30 dark:text-white/30 px-1">Search Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {filteredWallpapers.map((wp, i) => (
                <motion.div 
                  key={wp.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => { soundService.playTap(); onSelect(wp); }}
                  className="aspect-[3/4.5] rounded-xl overflow-hidden border border-black/5 dark:border-white/5 bg-surface-light dark:bg-surface-dark group cursor-pointer relative"
                >
                  <img src={wp.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="label-meta text-white text-[9px]">View Detail</span>
                  </div>
                </motion.div>
              ))}
            </div>
            {filteredWallpapers.length === 0 && !isSearching && (
              <div className="py-20 text-center">
                <p className="label-meta text-black/20 dark:text-white/20">No matching auras found</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="discovery-feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-24"
          >
            {/* Categories Grid */}
            <section>
              <h3 className="label-meta text-black/30 dark:text-white/30 mb-8 ml-1">Universal Sectors</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {exploreCategories.map(([name, image], idx) => (
                  <motion.div
                    key={name}
                    whileHover={{ scale: 0.98 }}
                    whileTap={{ scale: 0.96 }}
                    className={`relative overflow-hidden rounded-2xl cursor-pointer group h-32 lg:h-40 border border-black/5 dark:border-white/5 ${idx === 0 ? 'md:col-span-2' : ''}`}
                    onClick={() => { soundService.playTap(); setSearchQuery(name); }}
                  >
                    <img src={image} className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" alt="" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                    <div className="absolute inset-0 p-6 flex items-end">
                      <h4 className="text-white font-black uppercase tracking-widest text-xs lg:text-sm">{name}</h4>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Curated Collections */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="label-meta text-black/30 dark:text-white/30 ml-1">Curated Collections</h3>
                <span className="material-symbols-outlined text-black/20 dark:text-white/20">auto_awesome_motion</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {MOCK_COLLECTIONS.map((col) => (
                  <div key={col.id} className="group cursor-pointer">
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 mb-4">
                      <img src={col.previewImages[0]} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
                        <span className="label-meta text-white/50 text-[8px] mb-1">{col.itemCount} Visual Assets</span>
                        <h4 className="text-2xl font-black text-white tracking-tighter uppercase">{col.name}</h4>
                        <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-1">Curated by {col.author}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Featured Creators Carousel */}
            <section className="pb-10">
              <h3 className="label-meta text-black/30 dark:text-white/30 mb-8 ml-1">Elite Artisans</h3>
              <div className="flex gap-6 overflow-x-auto no-scrollbar -mx-6 px-6">
                {[
                  { name: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?u=alex', role: 'Minimalist' },
                  { name: 'Otaku Visuals', avatar: 'https://i.pravatar.cc/150?u=otaku', role: 'Anime Guru' },
                  { name: 'Marvelous Art', avatar: 'https://i.pravatar.cc/150?u=marvel', role: 'MCU Specialist' },
                  { name: 'Cyber Spirit', avatar: 'https://i.pravatar.cc/150?u=cyber', role: 'Neo-Tokyo' },
                  { name: 'Gotham Designer', avatar: 'https://i.pravatar.cc/150?u=gotham', role: 'Dark Knight' },
                ].map((artist) => (
                  <motion.div 
                    key={artist.name} 
                    whileHover={{ y: -5 }}
                    className="flex flex-col items-center min-w-[120px] text-center"
                  >
                    <div className="size-20 rounded-full border-2 border-black/5 dark:border-white/10 p-1 mb-4">
                      <img src={artist.avatar} className="size-full rounded-full grayscale hover:grayscale-0 transition-all cursor-pointer" alt="" />
                    </div>
                    <h5 className="text-[10px] font-black uppercase tracking-tight truncate w-full">{artist.name}</h5>
                    <p className="text-[8px] font-medium text-black/40 dark:text-white/40 uppercase tracking-widest mt-1">{artist.role}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
