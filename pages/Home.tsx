import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallpaper } from '../types';
import { soundService } from '../services/soundService';
import { pexelsService, WallpaperItem } from '../services/pexelsService';
import { wallhavenService, WallhavenItem } from '../services/wallhavenService';
import { Skeleton } from '../components/Skeleton';
import { AnimateIcon } from '../components/ui/AnimateIcon';
import { HeartIcon } from '../components/ui/Icons';
import { Play, RefreshCw } from 'lucide-react';

interface HomeProps {
  onSelect: (w: Wallpaper) => void;
  likedIds: string[];
  onLike: (id: string) => void;
  customWallpapers?: Wallpaper[];
  onSearchClick?: () => void;
}

// Convert Pexels item to Wallpaper type
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

const WallpaperCard = React.memo(({
  item,
  onSelect,
  onLike,
  isLiked,
  index
}: {
  item: WallpaperItem;
  onSelect: (w: Wallpaper) => void;
  onLike: (e: React.MouseEvent, id: string) => void;
  isLiked: boolean;
  index: number;
}) => {
  const wp = useMemo(() => toWallpaper(item), [item]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = item.type === 'video' && item.videoUrl;

  // Play/pause video on hover
  useEffect(() => {
    if (isVideo && videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, isVideo]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: (index % 5) * 0.05 }}
      onClick={() => onSelect(wp)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer"
    >
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 transition-all group-hover:border-black/20 dark:group-hover:border-white/20 group-hover:shadow-xl"
        style={{ backgroundColor: item.avgColor || undefined }}
      >
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 rounded-none w-full h-full" />
        )}

        {/* Video preview on hover */}
        {isVideo && isHovered ? (
          <video
            ref={videoRef}
            src={item.videoUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
          />
        ) : (
          <img
            src={item.thumbnailUrl || item.url}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-transform duration-700 ease-out ${imageLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`}
            alt={wp.title}
            loading="lazy"
          />
        )}

        {/* Video indicator - only show if there's an actual video */}
        {isVideo && (
          <div className={`absolute top-3 right-3 size-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 transition-opacity ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
            <Play size={14} className="text-white fill-white ml-0.5" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Quick like button on hover */}
        <button
          onClick={(e) => onLike(e, wp.id)}
          className={`absolute bottom-3 right-3 size-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${isLiked
            ? 'bg-red-500 text-white'
            : 'bg-white/20 text-white hover:bg-white/30'
            }`}
        >
          <AnimateIcon animation={isLiked ? 'default' : 'initial'}>
            <HeartIcon size={18} className={isLiked ? 'fill-current' : ''} />
          </AnimateIcon>
        </button>
      </div>

      <div className="mt-3 px-1">
        <h3 className="text-sm font-semibold text-primary dark:text-white truncate">
          {wp.title}
        </h3>
        <p className="text-xs text-black/50 dark:text-white/50 mt-0.5">
          by {wp.author}
        </p>
      </div>
    </motion.div>
  );
});

export const Home: React.FC<HomeProps> = ({ onSelect, likedIds, onLike, customWallpapers = [], onSearchClick }) => {
  const [selectedCategory, setSelectedCategory] = useState('Curated');
  const [pexelsItems, setPexelsItems] = useState<WallpaperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const categories = ['Curated', 'Live', 'Anime', 'Gaming', 'Nature', 'Abstract', 'Minimal', 'Dark', 'Space', 'City'];

  // Fetch wallpapers from Pexels or Wallhaven
  const fetchWallpapers = async (category: string, pageNum: number, append: boolean = false) => {
    setLoading(true);
    try {
      let items: WallpaperItem[] = [];

      if (category === 'Curated') {
        items = await pexelsService.getMixedFeed(pageNum);
      } else if (category === 'Live') {
        items = await pexelsService.getPopularVideos(pageNum, 20);
      } else if (category === 'Anime') {
        // Use Wallhaven for anime
        const wallhavenItems = await wallhavenService.getAnime(pageNum);
        items = wallhavenItems.map(w => ({
          ...w,
          videoUrl: undefined
        }));
      } else if (category === 'Gaming') {
        // Use Wallhaven for gaming
        const wallhavenItems = await wallhavenService.getGaming(pageNum);
        items = wallhavenItems.map(w => ({
          ...w,
          videoUrl: undefined
        }));
      } else {
        items = await pexelsService.getByCategory(category, pageNum);
      }

      if (items.length === 0) {
        setHasMore(false);
      } else {
        setPexelsItems(prev => append ? [...prev, ...items] : items);
        setHasMore(items.length >= 15);
      }
    } catch (error) {
      console.error('Failed to fetch wallpapers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and category change
  useEffect(() => {
    setPexelsItems([]);
    setPage(1);
    setHasMore(true);
    fetchWallpapers(selectedCategory, 1, false);
  }, [selectedCategory]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchWallpapers(selectedCategory, nextPage, true);
        }
      },
      { rootMargin: '400px', threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore, page, selectedCategory]);

  const toggleLike = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    soundService.playTick();
    onLike(id);
  }, [onLike]);

  const customItems: WallpaperItem[] = useMemo(() => customWallpapers.map(wp => ({
    id: wp.id,
    title: wp.title,
    url: wp.url,
    thumbnailUrl: wp.url,
    author: wp.author,
    authorAvatar: wp.authorAvatar,
    type: wp.type === 'live' ? 'video' : 'image',
    tags: wp.tags,
    views: typeof wp.views === 'string' ? parseInt(wp.views) || 0 : wp.views || 0,
    downloads: typeof wp.downloads === 'string' ? parseInt(wp.downloads) || 0 : wp.downloads || 0,
    likes: typeof wp.likes === 'string' ? parseInt(wp.likes) || 0 : wp.likes || 0,
    width: 1080,
    height: 1920,
    videoUrl: wp.videoUrl
  })), [customWallpapers]);

  // Filter items based on selected category
  const displayItems = useMemo(() => {
    if (selectedCategory === 'Curated') {
      // Show custom uploads + Pexels mixed feed
      return [...customItems, ...pexelsItems];
    } else if (selectedCategory === 'Live') {
      // Show ONLY items with actual video URLs
      const liveCustom = customItems.filter(i => i.type === 'video' && i.videoUrl);
      const liveVideos = pexelsItems.filter(i => i.type === 'video' && i.videoUrl);
      return [...liveCustom, ...liveVideos];
    } else {
      // Show only Pexels items for other categories
      return pexelsItems;
    }
  }, [selectedCategory, customItems, pexelsItems]);

  const allItems = displayItems;

  return (
    <div className="pb-32 px-4 lg:px-12">
      {/* Header Section */}
      <header className="py-3 lg:py-16">


        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 lg:mx-0 lg:px-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); soundService.playTick(); }}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/20'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Loading skeleton for initial load */}
      {loading && allItems.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] rounded-2xl" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
        <AnimatePresence>
          {allItems.map((item, idx) => (
            <WallpaperCard
              key={`${item.id}-${idx}`}
              item={item}
              index={idx}
              onSelect={onSelect}
              onLike={toggleLike}
              isLiked={likedIds.includes(item.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Load more indicator */}
      {hasMore && allItems.length > 0 && (
        <div ref={loaderRef} className="py-16 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="size-8 border-2 border-black/10 dark:border-white/10 border-t-accent rounded-full"
          />
        </div>
      )}

      {/* No more results */}
      {!hasMore && allItems.length > 0 && (
        <div className="py-16 text-center text-sm text-black/40 dark:text-white/40">
          You've seen all the wallpapers in this category
        </div>
      )}
    </div>
  );
};
