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
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-1">Search</h1>
        <p className="text-sm text-black/50 dark:text-white/50">
          Find wallpapers from millions of photos
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4 max-w-2xl">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wallpapers, characters, anime..."
            className="w-full h-14 pl-12 pr-12 bg-gray-100 dark:bg-white/10 rounded-2xl outline-none font-medium text-base focus:ring-2 focus:ring-accent transition-all placeholder:text-black/30 dark:placeholder:text-white/30"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X size={18} className="text-black/40 dark:text-white/40" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => { soundService.playTap(); setFilter(f.key); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === f.key
                ? 'bg-accent text-white'
                : 'bg-gray-100 dark:bg-white/10 text-black/70 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/20'
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-black/50 dark:text-white/50">
                Results for "{searchQuery}"
              </h3>
              {searchResults.length > 0 && (
                <span className="text-xs text-black/30 dark:text-white/30">
                  {searchResults.length} wallpapers
                </span>
              )}
            </div>

            {isSearching && searchResults.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {searchResults.map((item, i) => (
                    <motion.div
                      key={`${item.id}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (i % 10) * 0.03 }}
                      onClick={() => { soundService.playTap(); onSelect(toWallpaper(item)); }}
                      className="aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group relative"
                      style={{ backgroundColor: item.avgColor || '#1a1a1a' }}
                    >
                      <img
                        src={item.thumbnailUrl}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={item.title}
                        loading="lazy"
                      />
                      {item.type === 'video' && item.videoUrl && (
                        <div className="absolute top-3 right-3 size-7 bg-black/60 backdrop-blur rounded-full flex items-center justify-center">
                          <Play size={12} className="text-white fill-white ml-0.5" />
                        </div>
                      )}
                      {/* Source badge */}
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur ${item.id.startsWith('wallhaven')
                          ? 'bg-purple-500/80 text-white'
                          : 'bg-green-500/80 text-white'
                        }`}>
                        {item.id.startsWith('wallhaven') ? 'Wallhaven' : 'Pexels'}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-medium truncate">{item.author}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Load more indicator */}
                {hasMore && (
                  <div ref={loaderRef} className="py-8 flex items-center justify-center">
                    {isSearching ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="size-6 border-2 border-black/10 dark:border-white/10 border-t-accent rounded-full"
                      />
                    ) : (
                      <span className="text-xs text-black/30 dark:text-white/30">Scroll for more</span>
                    )}
                  </div>
                )}
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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-black/40 dark:text-white/40" />
                    <h3 className="text-sm font-medium">Recent</h3>
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-accent hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSearch(term)}
                      className="px-4 py-2 rounded-full bg-gray-100 dark:bg-white/10 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Trending Searches */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-accent" />
                <h3 className="text-sm font-medium">Trending</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-4 py-2 rounded-full bg-gray-100 dark:bg-white/10 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>

            {/* Popular Characters */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-purple-500" />
                <h3 className="text-sm font-medium">Popular Characters</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularCharacters.map((char) => (
                  <button
                    key={char}
                    onClick={() => handleSearch(char)}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 text-sm font-medium hover:from-purple-500/20 hover:to-pink-500/20 transition-colors"
                  >
                    {char}
                  </button>
                ))}
              </div>
            </section>

            {/* Browse Categories */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Image size={16} className="text-blue-500" />
                <h3 className="text-sm font-medium">Browse Categories</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(categoryImages).map(([name, image], idx) => (
                  <motion.div
                    key={name}
                    whileHover={{ scale: 0.98 }}
                    whileTap={{ scale: 0.96 }}
                    className={`relative overflow-hidden rounded-2xl cursor-pointer group h-28 lg:h-36 ${idx === 0 ? 'md:col-span-2' : ''}`}
                    onClick={() => handleSearch(name)}
                  >
                    <img
                      src={image}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt={name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-0 p-4 flex items-end">
                      <h4 className="text-white font-bold text-lg">{name}</h4>
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
