import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallpaper, User, AppComment } from '../types';
import { soundService } from '../services/soundService';
import { LensResult } from '../services/geminiService';
import { aiCacheService } from '../services/aiCacheService';
import { downloadService } from '../services/downloadService';
import { dbService } from '../services/dbService';
import { Skeleton } from '../components/Skeleton';
import { AnimateIcon } from '../components/ui/AnimateIcon';
import {
  Heart,
  Bookmark,
  Download,
  Share2,
  ArrowLeft,
  Send,
  MoreHorizontal,
  RefreshCw,
  Eye,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SparklesIcon, LensIcon } from '../components/ui/Icons';

interface DetailProps {
  wallpaper: Wallpaper;
  isLiked: boolean;
  isSaved: boolean;
  currentUser: User | null;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onBack: () => void;
}

export const Detail: React.FC<DetailProps> = ({
  wallpaper, isLiked, isSaved, currentUser, onToggleLike, onToggleSave, onBack
}) => {
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [comments, setComments] = useState<AppComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // AI Lens state
  const [lensOpen, setLensOpen] = useState(false);
  const [lensResult, setLensResult] = useState<LensResult | null>(null);
  const [lensLoading, setLensLoading] = useState(false);

  // Video state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = wallpaper.type === 'live' && wallpaper.videoUrl;

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [isVideo]);

  useEffect(() => {
    // Use cached insight (localStorage → Firestore → API)
    aiCacheService.getInsight(wallpaper)
      .then(res => setAiInsight(res))
      .catch(() => setAiInsight("Artistic masterpiece."))
      .finally(() => setLoadingInsight(false));
  }, [wallpaper]);

  const handleLensAnalysis = async () => {
    if (lensResult) {
      setLensOpen(!lensOpen);
      return;
    }
    setLensOpen(true);
    setLensLoading(true);
    soundService.playTap();
    try {
      // Use cached lens analysis (localStorage → Firestore → API)
      const result = await aiCacheService.getLensAnalysis(wallpaper);
      setLensResult(result);
      soundService.playSuccess();
    } catch (error) {
      console.error('Lens analysis failed:', error);
    } finally {
      setLensLoading(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    soundService.playTap();
    try {
      await downloadService.downloadImage(wallpaper.url, wallpaper.title);
    } catch (e) { }
    setIsDownloading(false);
  };

  const handleShare = async () => {
    soundService.playTick();
    try {
      if (navigator.share) {
        await navigator.share({
          title: wallpaper.title,
          text: `Check out ${wallpaper.title} on AuraFlow`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied');
      }
    } catch (err) { }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !currentUser || isPosting) return;
    setIsPosting(true);
    soundService.playTap();
    try {
      await dbService.addComment({
        wallpaperId: wallpaper.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: newComment.trim(),
      });
      setNewComment('');
      const updated = await dbService.getComments(wallpaper.id);
      setComments(updated);
      soundService.playSuccess();
    } catch (err) {
      console.error('Comment failed', err);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 100 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.05, y: 50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[1000] bg-surface overflow-y-auto no-scrollbar"
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-8 min-h-screen">

        {/* Navigation */}
        <header className="flex items-center justify-between mb-8 sticky top-0 z-50 bg-surface/80 backdrop-blur-md py-4 -mx-4 px-4 lg:-mx-8 lg:px-8 border-b border-outline/10">
          <button onClick={onBack} className="p-3 rounded-full hover:bg-surface-variant/50 transition-colors">
            <ArrowLeft size={24} className="text-on-surface" />
          </button>
          <div className="flex gap-2">
            <button onClick={handleShare} className="p-3 rounded-full hover:bg-surface-variant/50 transition-colors">
              <Share2 size={24} className="text-on-surface" />
            </button>
            <button className="p-3 rounded-full hover:bg-surface-variant/50 transition-colors">
              <MoreHorizontal size={24} className="text-on-surface" />
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">

          {/* Left Column: Image or Video */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-24">
            <div className="relative rounded-[32px] overflow-hidden shadow-2xl bg-gray-100 dark:bg-gray-900 aspect-[3/4] lg:aspect-auto ring-1 ring-black/5 dark:ring-white/10">
              {isVideo ? (
                <>
                  <video
                    ref={videoRef}
                    src={wallpaper.videoUrl}
                    poster={wallpaper.url}
                    className="w-full h-full object-cover"
                    autoPlay loop muted={isMuted} playsInline
                  />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <button onClick={togglePlayPause} className="size-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                      {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                    </button>
                    <button onClick={toggleMute} className="size-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-white flex items-center gap-1.5">
                    <Play size={12} className="fill-white" />
                    Live Wallpaper
                  </div>
                </>
              ) : (
                <img src={wallpaper.url} className="w-full h-full object-cover" alt={wallpaper.title} />
              )}
            </div>

            {/* Desktop Only Actions */}
            <div className="hidden lg:flex items-center justify-between mt-8 gap-4">
              <div className="flex gap-4">
                <button onClick={onToggleLike} className={`h-12 w-12 flex items-center justify-center rounded-full border transition-all ${isLiked ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-500' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}>
                  <AnimateIcon animation={isLiked ? 'default' : 'initial'}>
                    <Heart size={24} className={isLiked ? 'fill-current' : ''} />
                  </AnimateIcon>
                </button>
                <button onClick={onToggleSave} className={`h-12 w-12 flex items-center justify-center rounded-full border transition-all ${isSaved ? 'border-accent bg-blue-50 dark:bg-blue-900/20 text-accent' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}>
                  <AnimateIcon animation={isSaved ? 'default' : 'initial'}>
                    <Bookmark size={24} className={isSaved ? 'fill-current' : ''} />
                  </AnimateIcon>
                </button>
              </div>
              <button onClick={handleDownload} disabled={isDownloading} className="flex-1 h-12 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]">
                {isDownloading ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                {isDownloading ? 'Downloading...' : 'Download Wallpaper'}
              </button>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="w-full lg:w-1/2 flex flex-col gap-10 pb-24 lg:pb-0">

            {/* Title & Author */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-on-surface leading-tight">
                {wallpaper.title}
              </h1>
              <div className="flex items-center gap-4">
                <img src={wallpaper.authorAvatar} className="size-11 rounded-full bg-surface-variant" alt="" />
                <div>
                  <p className="font-bold text-on-surface">{wallpaper.author}</p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant">@auraflow_creator</p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 py-8 border-y border-outline/10">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-black font-mono text-primary">{wallpaper.views || 0}</span>
                <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-[0.2em]">Views</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-black font-mono text-primary">{wallpaper.downloads || 0}</span>
                <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-[0.2em]">Downloads</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-black font-mono text-primary">{wallpaper.likes || 0}</span>
                <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-[0.2em]">Likes</span>
              </div>
            </div>

            {/* AI Insight */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-accent text-sm font-medium">
                <SparklesIcon size={16} />
                <span>AI Insight</span>
              </div>
              {loadingInsight ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
              ) : (
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed italic">
                  "{aiInsight}"
                </p>
              )}
            </div>

            {/* ── AI Lens Panel ── */}
            <div className="space-y-4">
              <button
                onClick={handleLensAnalysis}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <LensIcon size={20} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-on-surface block">AI Lens Analysis</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {lensResult ? 'Powered by Gemini Vision' : 'Tap to analyze with Gemini'}
                    </span>
                  </div>
                </div>
                {lensLoading ? (
                  <RefreshCw size={16} className="text-primary animate-spin" />
                ) : (
                  lensOpen ? <ChevronUp size={16} className="text-on-surface-variant" /> : <ChevronDown size={16} className="text-on-surface-variant" />
                )}
              </button>

              <AnimatePresence>
                {lensOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    {lensLoading ? (
                      <div className="p-6 rounded-2xl bg-surface-variant/20 border border-outline/10 space-y-4">
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-5/6 rounded" />
                        <Skeleton className="h-4 w-3/4 rounded" />
                        <div className="flex gap-2 mt-4">
                          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
                        </div>
                      </div>
                    ) : lensResult ? (
                      <div className="p-6 rounded-2xl bg-surface-variant/20 border border-outline/10 space-y-6">
                        {/* Description */}
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-accent mb-2 block">Description</span>
                          <p className="text-sm text-on-surface/80 leading-relaxed italic">"{lensResult.description}"</p>
                        </div>

                        {/* Style */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">Style:</span>
                          <span className="px-3 py-1 rounded-full bg-accent/10 text-[10px] font-bold text-accent border border-accent/20">{lensResult.style}</span>
                        </div>

                        {/* Color Palette */}
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-3 block">Color Palette</span>
                          <div className="flex gap-3 flex-wrap">
                            {lensResult.colors.map((c, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex flex-col items-center gap-1.5"
                              >
                                <div className="size-10 rounded-xl ring-2 ring-black/10 dark:ring-white/10 shadow-sm" style={{ backgroundColor: c.hex }} />
                                <span className="text-[8px] font-bold uppercase tracking-wider text-on-surface-variant">{c.name}</span>
                                <span className="text-[8px] font-mono text-on-surface-variant/60">{c.hex}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Objects */}
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Identified Elements</span>
                          <div className="flex flex-wrap gap-2">
                            {lensResult.objects.map((obj, i) => (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="px-3 py-1.5 rounded-full bg-primary/10 text-[9px] font-bold uppercase tracking-widest text-primary border border-primary/20"
                              >
                                {obj}
                              </motion.span>
                            ))}
                          </div>
                        </div>

                        {/* Search Terms */}
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Similar Search Terms</span>
                          <div className="flex flex-wrap gap-2">
                            {lensResult.searchTerms.map((term, i) => (
                              <span key={i} className="px-3 py-1.5 rounded-full bg-secondary-container/30 text-[9px] font-bold uppercase tracking-widest text-on-secondary-container border border-outline/10">
                                {term}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {wallpaper.tags.map(tag => (
                <span key={tag} className="px-5 py-2.5 rounded-full bg-secondary-container/30 text-[10px] font-black uppercase tracking-widest text-on-secondary-container border border-outline/10">
                  {tag}
                </span>
              ))}
            </div>

            {/* Comments Section */}
            <div className="space-y-6 pt-6">
              <h3 className="text-xl font-bold">Comments ({comments.length})</h3>

              {currentUser ? (
                <div className="flex gap-4">
                  <img src={currentUser.avatar} className="size-10 rounded-full" alt="" />
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="w-full h-12 rounded-full border border-gray-200 dark:border-gray-800 bg-transparent px-6 focus:outline-none focus:border-accent transition-colors"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                    />
                    <button
                      onClick={handlePostComment}
                      disabled={!newComment.trim() || isPosting}
                      className="absolute right-2 top-2 h-8 w-8 bg-accent text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-center text-sm text-gray-500">
                  Log in to join the conversation.
                </div>
              )}

              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <img src={comment.userAvatar} className="size-10 rounded-full" alt="" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{comment.userName}</span>
                        <span className="text-xs text-gray-400">Just now</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 border-t border-outline/10 bg-surface/90 backdrop-blur-lg lg:hidden flex gap-4 z-[900]">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 h-16 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2 active:scale-95 transition-all"
          >
            {isDownloading ? <RefreshCw size={20} className="animate-spin" /> : <Download size={20} />}
            Download
          </button>
          <button
            onClick={onToggleLike}
            className={`aspect-square h-16 rounded-full border flex items-center justify-center transition-all ${isLiked ? 'bg-primary-container text-on-primary-container border-transparent' : 'bg-surface text-on-surface border-outline/20'}`}
          >
            <Heart size={24} className={isLiked ? 'fill-current' : ''} />
          </button>
          <button
            onClick={onToggleSave}
            className={`aspect-square h-16 rounded-full border flex items-center justify-center transition-all ${isSaved ? 'bg-secondary-container text-on-secondary-container border-transparent' : 'bg-surface text-on-surface border-outline/20'}`}
          >
            <Bookmark size={24} className={isSaved ? 'fill-current' : ''} />
          </button>
        </div>

      </div>
    </motion.div>
  );
};
