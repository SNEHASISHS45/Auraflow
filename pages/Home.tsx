
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_WALLPAPERS } from '../constants';
import { Wallpaper } from '../types';
import { soundService } from '../services/soundService';

interface HomeProps {
  onSelect: (w: Wallpaper) => void;
  likedIds: string[];
  onLike: (id: string) => void;
  customWallpapers?: Wallpaper[];
  onSearchClick?: () => void;
}

const ITEMS_PER_PAGE = 15;

const WallpaperCard = React.memo(({ 
  wp, 
  onSelect, 
  onLike, 
  isLiked,
  index
}: { 
  wp: Wallpaper; 
  onSelect: (w: Wallpaper) => void; 
  onLike: (e: React.MouseEvent, id: string) => void;
  isLiked: boolean;
  index: number;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: (index % 5) * 0.05 }}
      onClick={() => onSelect(wp)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 transition-colors group-hover:border-black/20 dark:group-hover:border-white/20">
        <img 
          src={wp.url} 
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${imageLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`} 
          alt={wp.title} 
          loading="lazy" 
        />
        
        {wp.type !== 'static' && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-[8px] font-bold text-white uppercase tracking-widest border border-white/10">
            {wp.type}
          </div>
        )}
      </div>
      
      <div className="mt-3 px-1 flex items-start justify-between">
        <div>
          <h3 className="text-[11px] font-extrabold uppercase tracking-tight text-primary dark:text-white truncate max-w-[120px]">
            {wp.title}
          </h3>
          <p className="text-[9px] font-medium text-black/40 dark:text-white/40 uppercase tracking-widest mt-0.5">
            {wp.author}
          </p>
        </div>
        <button 
          onClick={(e) => onLike(e, wp.id)}
          className={`transition-colors ${isLiked ? 'text-red-500' : 'text-black/10 dark:text-white/10 hover:text-black/30 dark:hover:text-white/30'}`}
        >
          <span className={`material-symbols-outlined text-[18px] ${isLiked ? 'fill-icon' : ''}`}>favorite</span>
        </button>
      </div>
    </motion.div>
  );
});

export const Home: React.FC<HomeProps> = ({ onSelect, likedIds, onLike, customWallpapers = [], onSearchClick }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement>(null);

  const categories = ['All', 'Anime', 'Marvel', 'Cinema', 'Gaming', 'Space', 'Minimal'];

  const allWallpapers = useMemo(() => {
    return [...customWallpapers, ...MOCK_WALLPAPERS];
  }, [customWallpapers]);

  const filteredWallpapers = useMemo(() => {
    if (selectedCategory === 'All') return allWallpapers;
    const query = selectedCategory.toLowerCase();
    return allWallpapers.filter(wp => 
      wp.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [selectedCategory, allWallpapers]);

  const visibleWallpapers = useMemo(() => {
    return filteredWallpapers.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredWallpapers, page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleWallpapers.length < filteredWallpapers.length) {
          setPage(prev => prev + 1);
        }
      },
      { rootMargin: '400px', threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [visibleWallpapers.length, filteredWallpapers.length]);

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    soundService.playTick();
    onLike(id);
  };

  return (
    <div className="pb-32 px-6 lg:px-12">
      {/* Header Section */}
      <header className="py-12 lg:py-20 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-none mb-4">
            Aura Gallery
          </h1>
          <p className="text-sm font-medium text-black/40 dark:text-white/40 max-w-sm uppercase tracking-widest">
            Curated visual experiences for the high-end digital space.
          </p>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 -mx-6 px-6 lg:mx-0 lg:px-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setPage(1); soundService.playTick(); }}
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                selectedCategory === cat 
                  ? 'bg-primary text-white border-primary dark:bg-white dark:text-black dark:border-white' 
                  : 'bg-transparent text-black/30 border-black/5 dark:text-white/30 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
        <AnimatePresence>
          {visibleWallpapers.map((wp, idx) => (
            <WallpaperCard 
              key={`${wp.id}-${idx}`}
              wp={wp}
              index={idx}
              onSelect={onSelect}
              onLike={toggleLike}
              isLiked={likedIds.includes(wp.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {visibleWallpapers.length < filteredWallpapers.length && (
        <div ref={loaderRef} className="py-32 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="size-6 border-2 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full"
          />
        </div>
      )}
    </div>
  );
};
