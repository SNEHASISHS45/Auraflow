import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallpaper } from '../types';
import { soundService } from '../services/soundService';
import { pexelsService, WallpaperItem } from '../services/pexelsService';
import { wallhavenService, WallhavenItem } from '../services/wallhavenService';
import { Skeleton } from '../components/Skeleton';
import { Play } from 'lucide-react';
import { Masonry } from '../components/ui/Masonry';

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
  videoUrl: item.videoUrl,
  width: item.width,
  height: item.height
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
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: (index % 6) * 0.04 }}
      onClick={() => onSelect(wp)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Pin Image Container */}
      <div
        className="pin-card"
        style={{
          backgroundColor: item.avgColor || '#1a1a1a',
          aspectRatio: wp.width && wp.height ? `${wp.width}/${wp.height}` : '3/4'
        }}
      >
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 rounded-none w-full h-full" />
        )}

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
            className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            alt={wp.title}
            loading="lazy"
          />
        )}

        {/* Hover dim overlay */}
        <div className="pin-overlay" />

        {/* Video indicator badge */}
        {isVideo && (
          <div className="absolute top-3 left-3 size-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center z-10">
            <Play size={12} className="text-white fill-white ml-0.5" />
          </div>
        )}

        {/* Hover action buttons */}
        <div className="pin-actions absolute inset-0 z-10 p-3 flex flex-col justify-between">
          {/* Top-right: Save pill */}
          <div className="flex justify-end">
            <button
              onClick={(e) => onLike(e, wp.id)}
              className={`px-4 py-2 rounded-full text-[11px] font-bold transition-colors ${isLiked
                ? 'bg-primary text-on-primary'
                : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
            >
              {isLiked ? 'Saved' : 'Save'}
            </button>
          </div>
          {/* Bottom spacer */}
          <div />
        </div>
      </div>

      {/* Always-visible bottom metadata */}
      <div className="pin-meta">
        <h3 className="text-on-surface">{wp.title}</h3>
        <p className="text-on-surface-variant text-xs flex items-center gap-1">
          {wp.authorAvatar && (
            <img src={wp.authorAvatar} className="size-5 rounded-full object-cover" alt="" />
          )}
          <span className="truncate">{wp.author}</span>
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
    width: wp.width || 1080,
    height: wp.height || 1920,
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

      {/* Masonry Loading Skeleton */}
      {loading && allItems.length === 0 && (
        <Masonry<{ id: number }>
          items={Array.from({ length: 10 }).map((_, i) => ({ id: i }))}
          gap={8}
          renderItem={(item) => (
            <div key={item.id} className="space-y-3">
              <Skeleton
                className="rounded-2xl w-full"
                style={{ aspectRatio: item.id % 2 === 0 ? '3/4' : '9/16' }}
              />
              <div className="px-2 space-y-2">
                <Skeleton className="h-3 w-2/3 rounded-full opacity-50" />
                <Skeleton className="h-2 w-1/3 rounded-full opacity-30" />
              </div>
            </div>
          )}
        />
      )}

      {/* Masonry Feed */}
      <AnimatePresence mode="popLayout">
        <Masonry<WallpaperItem>
          items={allItems}
          gap={8}
          renderItem={(item, idx) => (
            <WallpaperCard
              key={item.id}
              item={item}
              index={idx}
              onSelect={onSelect}
              onLike={toggleLike}
              isLiked={likedIds.includes(item.id)}
            />
          )}
        />
      </AnimatePresence>

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
