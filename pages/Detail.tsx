import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wallpaper, User, AppComment } from '../types';
import { soundService } from '../services/soundService';
import { geminiService } from '../services/geminiService';
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
  VolumeX
} from 'lucide-react';
import { SparklesIcon } from '../components/ui/Icons';

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

  // Video state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = wallpaper.type === 'live' && wallpaper.videoUrl;

  // Auto-play video when component mounts
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, user needs to interact
        setIsPlaying(false);
      });
    }
  }, [isVideo]);

  useEffect(() => {
    // 1. Fetch AI Insight
    geminiService.getWallpaperInsight(wallpaper.title, wallpaper.tags)
      .then(res => setAiInsight(res))
      .catch(() => setAiInsight("Artistic masterpiece."))
      .finally(() => setLoadingInsight(false));


    // Firestore calls disabled - deploy rules to Firebase Console to re-enable
    // const isFirestoreWallpaper = !wallpaper.id.startsWith('pexels-');
    // if (isFirestoreWallpaper) {
    //   dbService.getComments(wallpaper.id).then(setComments).catch(() => {});
    //   dbService.incrementStats(wallpaper.id, 'views').catch(() => {});
    // }
  }, [wallpaper]);

  const handleDownload = async () => {
    setIsDownloading(true);
    soundService.playTap();
    try {
      await downloadService.downloadImage(wallpaper.url, wallpaper.title);
      // Stats disabled - uncomment after deploying Firebase rules
      // if (!wallpaper.id.startsWith('pexels-')) {
      //   dbService.incrementStats(wallpaper.id, 'downloads').catch(() => {});
      // }
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

  // Video controls
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
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
      const commentData = {
        wallpaperId: wallpaper.id,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: newComment.trim(),
      };

      await dbService.addComment(commentData);
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-white dark:bg-black overflow-y-auto no-scrollbar"
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-12 min-h-screen">

        {/* Navigation */}
        <header className="flex items-center justify-between mb-8 sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md py-4 -mx-4 px-4 lg:-mx-8 lg:px-8">
          <button
            onClick={onBack}
            className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <Share2 size={24} />
            </button>
            <button className="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <MoreHorizontal size={24} />
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
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                  />
                  {/* Video Controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <button
                      onClick={togglePlayPause}
                      className="size-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                    </button>
                    <button
                      onClick={toggleMute}
                      className="size-12 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                  </div>
                  {/* Video badge */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-white flex items-center gap-1.5">
                    <Play size={12} className="fill-white" />
                    Live Wallpaper
                  </div>
                </>
              ) : (
                <img
                  src={wallpaper.url}
                  className="w-full h-full object-cover"
                  alt={wallpaper.title}
                />
              )}
            </div>

            {/* Desktop Only Actions - Below Image */}
            <div className="hidden lg:flex items-center justify-between mt-8 gap-4">
              <div className="flex gap-4">
                <button
                  onClick={onToggleLike}
                  className={`h-12 w-12 flex items-center justify-center rounded-full border transition-all ${isLiked ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-500' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
                >
                  <AnimateIcon animation={isLiked ? 'default' : 'initial'}>
                    <Heart size={24} className={isLiked ? 'fill-current' : ''} />
                  </AnimateIcon>
                </button>
                <button
                  onClick={onToggleSave}
                  className={`h-12 w-12 flex items-center justify-center rounded-full border transition-all ${isSaved ? 'border-accent bg-blue-50 dark:bg-blue-900/20 text-accent' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}
                >
                  <AnimateIcon animation={isSaved ? 'default' : 'initial'}>
                    <Bookmark size={24} className={isSaved ? 'fill-current' : ''} />
                  </AnimateIcon>
                </button>
              </div>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 h-12 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                {isDownloading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
                {isDownloading ? 'Downloading...' : 'Download Wallpaper'}
              </button>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="w-full lg:w-1/2 flex flex-col gap-10 pb-24 lg:pb-0">

            {/* Title & Author */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                {wallpaper.title}
              </h1>
              <div className="flex items-center gap-4">
                <img src={wallpaper.authorAvatar} className="size-10 rounded-full bg-gray-200" alt="" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{wallpaper.author}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">@auraflow_creator</p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 py-6 border-y border-gray-100 dark:border-gray-800">
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold font-mono">{wallpaper.views || 0}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Views</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold font-mono">{wallpaper.downloads || 0}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Downloads</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold font-mono">{wallpaper.likes || 0}</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Likes</span>
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

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {wallpaper.tags.map(tag => (
                <span key={tag} className="px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 text-sm font-medium text-gray-600 dark:text-gray-300">
                  {tag}
                </span>
              ))}
            </div>

            {/* Comments Section */}
            <div className="space-y-6 pt-6">
              <h3 className="text-xl font-bold">Comments ({comments.length})</h3>

              {/* Comment Input */}
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

              {/* Comment List */}
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
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-black/90 backdrop-blur-lg lg:hidden flex gap-4 z-[900]">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 h-14 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-sm flex items-center justify-center gap-2"
          >
            {isDownloading ? <RefreshCw size={20} className="animate-spin" /> : <Download size={20} />}
            Download
          </button>
          <button
            onClick={onToggleLike}
            className={`aspect-square h-14 rounded-full border flex items-center justify-center ${isLiked ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 dark:border-gray-700'}`}
          >
            <Heart size={24} className={isLiked ? 'fill-current' : ''} />
          </button>
          <button
            onClick={onToggleSave}
            className={`aspect-square h-14 rounded-full border flex items-center justify-center ${isSaved ? 'border-accent bg-blue-50 text-accent' : 'border-gray-200 dark:border-gray-700'}`}
          >
            <Bookmark size={24} className={isSaved ? 'fill-current' : ''} />
          </button>
        </div>

      </div>
    </motion.div>
  );
};
