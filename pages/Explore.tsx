import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundService } from '../services/soundService';
import { pexelsService, WallpaperItem } from '../services/pexelsService';
import { wallhavenService } from '../services/wallhavenService';
import { Skeleton } from '../components/Skeleton';
import { Wallpaper } from '../types';
import { AnimateIcon } from '../components/ui/AnimateIcon';
import { Search, X, TrendingUp, Sparkles, Play, Image, Film, Clock, Zap } from 'lucide-react';

interface ExploreProps {
  onSelect: (wp: Wallpaper) => void;
}

// Convert item to Wallpaper type
const toWallpaper = (item: WallpaperItem): Wallpaper => ({
  id: item.id,
  title: item.title,
  url: item.url,
  author: item.author,
  authorAvatar: item.authorAvatar,
  type: item.type === 'video' ? 'live' : 'static',
  tags: item.tags,
  views: item.views,
  downloads: item.downloads,
  likes: item.likes,
  videoUrl: item.videoUrl
});

type SearchFilter = 'all' | 'photos' | 'videos' | 'anime';

const trendingSearches = [
  'Nature', 'Anime', 'Dark', 'Minimal', 'Space',
  'Naruto', 'Gaming', 'Abstract', 'City', 'Ocean'
];

const popularCharacters = [
  'Iron Man', 'Spider-Man', 'Batman', 'Naruto', 'Goku',
  'Demon Slayer', 'Attack on Titan', 'One Piece'
];

const categoryImages: Record<string, string> = {
  'Anime': 'https://images.pexels.com/photos/2832382/pexels-photo-2832382.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Gaming': 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Nature': 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Dark': 'https://images.pexels.com/photos/1229042/pexels-photo-1229042.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Space': 'https://images.pexels.com/photos/956981/milky-way-starry-sky-night-sky-star-956981.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Abstract': 'https://images.pexels.com/photos/2110951/pexels-photo-2110951.jpeg?auto=compress&cs=tinysrgb&w=600',
};

export const Explore: React.FC<ExploreProps> = ({ onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WallpaperItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  // Save recent search
  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Perform search based on filter
  const performSearch = async (query: string, pageNum: number = 1) => {
    setIsSearching(true);
    try {
      let results: WallpaperItem[] = [];

      if (filter === 'all') {
        // Search both APIs
        const [pexelsResults, wallhavenResults] = await Promise.all([
          pexelsService.searchPhotos(query, pageNum, 12),
          wallhavenService.searchCharacter(query, pageNum)
        ]);
        const wallhavenAsItems: WallpaperItem[] = wallhavenResults.map(w => ({
          ...w, videoUrl: undefined
        }));
        results = [...wallhavenAsItems, ...pexelsResults];
      } else if (filter === 'photos') {
        results = await pexelsService.searchPhotos(query, pageNum, 24);
      } else if (filter === 'videos') {
        results = await pexelsService.searchVideos(query, pageNum, 24);
      } else if (filter === 'anime') {
        const wallhavenResults = await wallhavenService.search(query, pageNum, '010');
        results = wallhavenResults.map(w => ({ ...w, videoUrl: undefined }));
      }

      if (pageNum === 1) {
        setSearchResults(results);
        saveRecentSearch(query);
      } else {
        setSearchResults(prev => [...prev, ...results]);
      }
      setHasSearched(true);
      setHasMore(results.length >= 12);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      setPage(1);
      performSearch(searchQuery, 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, filter]);

  // Load more results
  const loadMore = async () => {
    if (!hasMore || isSearching || !searchQuery.trim()) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await performSearch(searchQuery, nextPage);
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && searchQuery.trim() && !isSearching) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, searchQuery, page, isSearching]);

  const handleSearch = (term: string) => {
    soundService.playTap();
    setSearchQuery(term);
    inputRef.current?.focus();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const filters: { key: SearchFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <Zap size={14} /> },
    { key: 'photos', label: 'Photos', icon: <Image size={14} /> },
    { key: 'videos', label: 'Videos', icon: <Film size={14} /> },
    { key: 'anime', label: 'Anime', icon: <Sparkles size={14} /> },
  ];

  return (
    <div className="pb-32 px-4 lg:px-12 pt-6 lg:pt-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-2 text-on-surface uppercase tracking-widest">Search</h1>
        <p className="text-sm font-medium text-on-surface-variant uppercase tracking-[0.2em]">
          Find wallpapers from millions of photos
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 max-w-2xl">
        <div className="relative group">
          <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for perfection..."
            className="w-full h-16 pl-14 pr-12 bg-surface-variant/30 rounded-full outline-none font-bold text-base focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50 border border-outline/10 shadow-1"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-surface-variant/80 transition-colors"
            >
              <X size={18} className="text-on-surface-variant" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar py-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => { soundService.playTap(); setFilter(f.key); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${filter === f.key
              ? 'bg-secondary-container text-on-secondary-container border-transparent shadow-sm'
              : 'bg-surface text-on-surface-variant border-outline/30 hover:bg-surface-variant/30'
              }`}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {hasSearched ? (
          /* Search Results */
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between py-2 border-b border-outline/10">
              <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">
                Results for "{searchQuery}"
              </h3>
              {searchResults.length > 0 && (
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {searchResults.length} found
                </span>
              )}
            </div>

            {isSearching && searchResults.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-3xl overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                  {searchResults.map((item, i) => (
                    <motion.div
                      key={`${item.id}-${i}`}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: (i % 10) * 0.03 }}
                      onClick={() => { soundService.playTap(); onSelect(toWallpaper(item)); }}
                      className="aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer group relative border border-outline/10 transition-all hover:border-primary/30 shadow-1 hover:shadow-3"
                      style={{ backgroundColor: item.avgColor || '#1a1a1a' }}
                    >
                      <img
                        src={item.thumbnailUrl}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        alt={item.title}
                        loading="lazy"
                      />
                      {item.type === 'video' && item.videoUrl && (
                        <div className="absolute top-4 right-4 size-8 bg-surface/60 backdrop-blur-md rounded-full flex items-center justify-center border border-outline/20">
                          <Play size={12} className="text-on-surface fill-on-surface ml-0.5" />
                        </div>
                      )}
                      {/* Source badge */}
                      <div className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 ${item.id.startsWith('wallhaven')
                        ? 'bg-primary/80 text-on-primary'
                        : 'bg-secondary/80 text-on-secondary'
                        }`}>
                        {item.id.startsWith('wallhaven') ? 'Wallhaven' : 'Pexels'}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                        <p className="text-on-surface text-[10px] font-black uppercase tracking-widest truncate">{item.author}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Load more indicator */}
                <div ref={loaderRef} className="py-12 flex items-center justify-center">
                  {isSearching ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="size-8 border-4 border-primary/20 border-t-primary rounded-full"
                    />
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/50">Keep scrolling for more</span>
                  )}
                </div>
              </>
            ) : (
              <div className="py-20 text-center">
                <p className="text-black/40 dark:text-white/40 mb-2">No wallpapers found</p>
                <p className="text-sm text-black/20 dark:text-white/20">Try a different search term</p>
              </div>
            )}
          </motion.div>
        ) : (
          /* Discovery View */
          <motion.div
            key="discovery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-10"
          >
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">Recent</h3>
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSearch(term)}
                      className="px-6 py-2.5 rounded-full bg-surface border border-outline/30 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Searches */}
            <section>
              <div className="flex items-center gap-2 mb-4 px-2">
                <TrendingUp size={16} className="text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">Trending Searches</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-6 py-2.5 rounded-full bg-surface border border-outline/30 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>

            {/* Popular Characters */}
            <section>
              <div className="flex items-center gap-2 mb-4 px-2">
                <Sparkles size={16} className="text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">Popular Characters</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularCharacters.map((char) => (
                  <button
                    key={char}
                    onClick={() => handleSearch(char)}
                    className="px-6 py-2.5 rounded-full bg-primary-container/20 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/20 transition-colors"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </section>

            {/* Browse Categories */}
            <section className="pb-12">
              <div className="flex items-center gap-2 mb-5 px-2">
                <Image size={18} className="text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">Browse Categories</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {Object.entries(categoryImages).map(([name, image], idx) => (
                  <motion.div
                    key={name}
                    whileHover={{ scale: 0.98, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    className={`relative overflow-hidden rounded-[32px] cursor-pointer group h-32 lg:h-44 border border-outline/10 shadow-1 hover:shadow-2 ${idx === 0 ? 'md:col-span-2' : ''}`}
                    onClick={() => handleSearch(name)}
                  >
                    <img
                      src={image}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      alt={name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <h4 className="text-on-surface font-black text-xl uppercase tracking-tighter">{name}</h4>
                    </div>
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
