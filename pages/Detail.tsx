
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallpaper } from '../types';
import { soundService } from '../services/soundService';
import { geminiService } from '../services/geminiService';
import { downloadService } from '../services/downloadService';

interface DetailProps {
  wallpaper: Wallpaper;
  isLiked: boolean;
  isSaved: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onBack: () => void;
}

export const Detail: React.FC<DetailProps> = ({ 
  wallpaper, isLiked, isSaved, onToggleLike, onToggleSave, onBack 
}) => {
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const insight = await geminiService.getWallpaperInsight(wallpaper.title, wallpaper.tags);
        setAiInsight(insight || '');
      } catch (e) {
        setAiInsight('A meticulously crafted visual asset optimized for high-density displays.');
      } finally {
        setLoadingInsight(false);
      }
    };
    fetchInsight();
  }, [wallpaper]);

  const handleDownload = async () => {
    setIsDownloading(true);
    soundService.playTap();
    await downloadService.downloadImage(wallpaper.url, wallpaper.title);
    setIsDownloading(false);
  };

  const handleShare = async () => {
    soundService.playTick();
    await downloadService.shareImage(wallpaper.title, wallpaper.url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-white dark:bg-black overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row no-scrollbar"
    >
      {/* Desktop Navigation */}
      <div className="absolute top-12 left-12 z-[1100] hidden lg:block">
        <button 
          onClick={onBack}
          className="group flex items-center gap-3 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="label-meta">Back to Gallery</span>
        </button>
      </div>

      {/* Hero Image Section */}
      <div className="w-full lg:flex-1 relative bg-surface-light dark:bg-surface-dark flex items-center justify-center p-0 lg:p-12 min-h-[70vh] lg:min-h-0">
        <motion.div 
          layoutId={`image-${wallpaper.id}`}
          className="relative w-full h-full lg:h-full lg:max-h-[85vh] lg:aspect-[9/16] shadow-2xl lg:rounded-3xl overflow-hidden lg:border border-black/10 dark:border-white/10"
        >
          <img src={wallpaper.url} className="w-full h-full object-cover" alt={wallpaper.title} />
          
          {/* Tags Overlay on Mobile Image */}
          <div className="absolute bottom-6 left-6 flex flex-wrap gap-2 lg:hidden">
            {wallpaper.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-3 py-1 bg-black/40 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest rounded-full border border-white/10">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
        
        {/* Mobile Header Overlay */}
        <div className="absolute top-0 left-0 right-0 h-24 p-6 flex items-center justify-between lg:hidden z-20">
          <button 
            onClick={onBack} 
            className="size-12 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-black/5 dark:border-white/10 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
          <button 
            onClick={handleShare}
            className="size-12 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-black/5 dark:border-white/10 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
          </button>
        </div>
      </div>

      {/* Details & Actions Sheet */}
      <div className="w-full lg:w-[500px] bg-white dark:bg-black p-8 lg:p-16 flex flex-col border-t lg:border-t-0 lg:border-l border-black/5 dark:border-white/5 pb-32 lg:pb-16">
        <div className="flex-1 space-y-12">
          {/* Meta Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="label-meta text-accent">ID #{wallpaper.id.padStart(4, '0')}</span>
              {wallpaper.type !== 'static' && (
                <span className="px-2 py-0.5 bg-accent/10 text-accent text-[8px] font-black uppercase tracking-widest rounded border border-accent/20">
                  {wallpaper.type}
                </span>
              )}
            </div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">
              {wallpaper.title}
            </h2>
            <div className="flex items-center gap-4 pt-4">
              <img src={wallpaper.authorAvatar} className="size-10 rounded-full border border-black/5" alt="" />
              <div>
                <p className="label-meta text-[7px] text-black/30 dark:text-white/30 uppercase">Creator</p>
                <p className="text-[11px] font-extrabold uppercase tracking-widest">{wallpaper.author}</p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 py-6 border-y border-black/5 dark:border-white/5">
            <div className="text-center">
              <p className="text-sm font-black tracking-tight">{wallpaper.views}</p>
              <p className="label-meta text-[7px] text-black/30 dark:text-white/30">Views</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black tracking-tight">{wallpaper.downloads}</p>
              <p className="label-meta text-[7px] text-black/30 dark:text-white/30">Installs</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black tracking-tight">{wallpaper.likes}</p>
              <p className="label-meta text-[7px] text-black/30 dark:text-white/30">Likes</p>
            </div>
          </div>

          {/* AI Insights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="label-meta text-black/30 dark:text-white/30">Aura Intel</h4>
              <span className="material-symbols-outlined text-[14px] text-accent animate-pulse">psychology</span>
            </div>
            {loadingInsight ? (
              <div className="space-y-3">
                <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full w-full animate-pulse" />
                <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full w-4/5 animate-pulse" />
              </div>
            ) : (
              <p className="text-[13px] font-medium leading-relaxed italic text-black/60 dark:text-white/60">
                "{aiInsight}"
              </p>
            )}
          </div>
        </div>

        {/* Fixed Action Area on Mobile */}
        <div className="mt-12 space-y-4">
          <div className="flex gap-4">
            <button 
              onClick={() => { soundService.playTick(); onToggleLike(); }}
              className={`flex-1 h-14 rounded-2xl border transition-all flex flex-col items-center justify-center ${
                isLiked ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-transparent border-black/10 dark:border-white/10 text-black/30 dark:text-white/30'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] mb-0.5 ${isLiked ? 'fill-icon' : ''}`}>favorite</span>
              <span className="label-meta text-[7px]">{isLiked ? 'Admired' : 'Admire'}</span>
            </button>
            <button 
              onClick={() => { soundService.playTick(); onToggleSave(); }}
              className={`flex-1 h-14 rounded-2xl border transition-all flex flex-col items-center justify-center ${
                isSaved ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-transparent border-black/10 dark:border-white/10 text-black/30 dark:text-white/30'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] mb-0.5 ${isSaved ? 'fill-icon' : ''}`}>bookmark</span>
              <span className="label-meta text-[7px]">{isSaved ? 'Vaulted' : 'Vault'}</span>
            </button>
          </div>
          
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full h-16 bg-primary dark:bg-white text-white dark:text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isDownloading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="material-symbols-outlined text-sm">sync</motion.span>
                Syncing...
              </span>
            ) : 'Acquire High-Res'}
          </button>
          
          <p className="text-center text-[8px] font-black uppercase text-black/20 dark:text-white/20 tracking-[0.2em] pt-2">
            Optimized for {wallpaper.aspectRatio || '9:16'} High-Density Displays
          </p>
        </div>
      </div>
    </motion.div>
  );
};
