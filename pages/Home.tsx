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
  // Memoize the wallpaper object so it doesn't change on every render
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
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.96 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: (index % 5) * 0.05 }}
      onClick={() => onSelect(wp)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer"
    >
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-surface-variant/20 border border-outline/10 transition-all group-hover:border-primary/30 group-hover:shadow-3 group-active:scale-95"
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
            className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${imageLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`}
            alt={wp.title}
            loading="lazy"
          />
        )}

        {/* Video indicator */}
        {isVideo && (
          <div className={`absolute top-4 right-4 size-8 bg-surface/60 backdrop-blur-md rounded-full flex items-center justify-center border border-outline/20 transition-opacity ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
            <Play size={14} className="text-on-surface fill-on-surface ml-0.5" />
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Quick like button on hover */}
        <button
          onClick={(e) => onLike(e, wp.id)}
          className={`absolute bottom-4 right-4 size-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${isLiked
            ? 'bg-primary text-on-primary'
            : 'bg-surface/40 text-on-surface hover:bg-surface/60 border border-outline/10'
            }`}
        >
          <AnimateIcon animation={isLiked ? 'default' : 'initial'}>
            <HeartIcon size={18} className={isLiked ? 'fill-current' : ''} />
          </AnimateIcon>
        </button>
      </div>

      <div className="mt-4 px-2">
        <h3 className="text-sm font-bold text-on-surface truncate tracking-tight">
          {wp.title}
        </h3>
        <p className="text-[11px] font-medium text-on-surface-variant mt-0.5 uppercase tracking-wider">
          {wp.author}
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

  const customItems = useMemo<WallpaperItem[]>(() => customWallpapers.map(wp => ({
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
  const allItems = useMemo(() => {
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

  return (
    <div className="pb-32 px-4 lg:px-12">
      {/* Header Section */}
      <header className="py-3 lg:py-16">


        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); soundService.playTick(); }}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap border ${selectedCategory === cat
                ? 'bg-secondary-container text-on-secondary-container border-transparent shadow-sm'
                : 'bg-surface text-on-surface-variant border-outline/30 hover:bg-surface-variant/30'
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
              key={item.id}
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
            className="size-8 border-4 border-primary/20 border-t-primary rounded-full"
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
