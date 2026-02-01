
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundService } from '../services/soundService';
import { geminiService } from '../services/geminiService';
import { cloudinaryService } from '../services/cloudinaryService';
import { Wallpaper, AspectRatio } from '../types';
import { MoodDiscovery } from './MoodDiscovery';
import { AnimateIcon } from '../components/ui/AnimateIcon';
import { CloudUploadIcon, BrainIcon, ArrowRightIcon, ArrowLeftIcon, SparklesIcon, XIcon, EyeIcon, EyeOffIcon } from '../components/ui/Icons';

interface UploadProps {
  onUploadSuccess: (wp: Wallpaper) => void;
}

type StudioMode = 'choice' | 'upload' | 'ai-lab' | 'analyzing' | 'metadata' | 'publishing';

export const Upload: React.FC<UploadProps> = ({ onUploadSuccess }) => {
  const [mode, setMode] = useState<StudioMode>('choice');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('9:16');
  const [deviceTarget, setDeviceTarget] = useState<'phone' | 'pc' | 'tab'>('phone');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBack = () => {
    soundService.playTick();
    setMode('choice');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundService.playTick();
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      setMode('analyzing');

      try {
        const base64Data = base64.split(',')[1];
        const suggestedTags = await geminiService.suggestTags(base64Data);
        setTags(suggestedTags);
        const cleanName = file.name.split('.')[0].replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        soundService.playSuccess();
        setMode('metadata');
      } catch (err) {
        setTags(['Original', 'Upload']);
        setMode('metadata');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinalize = async () => {
    if (!previewUrl || isPublishing) return;
    setIsPublishing(true);
    setMode('publishing');
    soundService.playSuccess();

    try {
      // Upload to Cloudinary instead of using base64
      const cloudinaryUrl = await cloudinaryService.uploadImage(previewUrl);

      const newWallpaper: Wallpaper = {
        id: `aura-${Date.now()}`,
        title: title || 'Untitled Aura',
        author: 'You',
        authorAvatar: 'https://i.pravatar.cc/150?u=you',
        url: cloudinaryUrl, // Now a secure remote URL
        views: '0',
        downloads: '0',
        likes: '0',
        type: isLive ? 'live' : 'static',
        tags: tags.length > 0 ? tags : ['Original'],
        aspectRatio: selectedRatio,
        deviceTarget: deviceTarget,
        visibility: visibility
      };

      await onUploadSuccess(newWallpaper);
    } catch (error) {
      console.error('Finalize error:', error);
      alert('Failed to publish wallpaper. Please try again.');
      setMode('metadata');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-12 lg:px-12 flex flex-col justify-center max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        {mode === 'choice' && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center -mt-20"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-16"
            >
              <div className="inline-block px-3 py-1 bg-accent/10 rounded-full border border-accent/20 mb-6">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Creative Studio</span>
              </div>
              <h2 className="text-6xl lg:text-7xl font-black mb-4 tracking-tighter leading-none italic">Aura Studio</h2>
              <p className="text-black/30 dark:text-white/30 font-bold text-sm label-meta tracking-widest text-center">Visual Synthesis Engine v4.0</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              {[
                {
                  id: 'upload',
                  icon: CloudUploadIcon,
                  title: 'Direct Upload',
                  desc: 'Publish your high-res originals',
                  color: 'primary',
                  action: () => fileInputRef.current?.click()
                },
                {
                  id: 'ai',
                  icon: BrainIcon,
                  title: 'AI Mood Lab',
                  desc: 'Synthesize new auras with AI',
                  color: 'accent',
                  action: () => setMode('ai-lab')
                }
              ].map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  onClick={() => { soundService.playTap(); item.action(); }}
                  className="group relative flex flex-col items-start p-10 rounded-[32px] border border-black/5 dark:border-white/5 bg-surface-light dark:bg-surface-dark overflow-hidden transition-all duration-500 hover:border-accent/40 hover:scale-[1.02] text-left"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`size-16 rounded-2xl bg-${item.color}/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                    <AnimateIcon animation="path">
                      <item.icon size={40} className={`text-${item.color}`} />
                    </AnimateIcon>
                  </div>
                  <h3 className="text-2xl font-black mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-black/40 dark:text-white/40 text-[10px] font-black uppercase tracking-widest leading-relaxed mb-6">{item.desc}</p>
                  <div className="flex items-center gap-2 text-accent opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest">Connect Engine</span>
                    <AnimateIcon animation="default">
                      <ArrowRightIcon size={14} />
                    </AnimateIcon>
                  </div>
                </motion.button>
              ))}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </motion.div>
        )}

        {mode === 'ai-lab' && (
          <motion.div
            key="lab"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="w-full h-full pt-10"
          >
            <div className="mb-12 flex items-center justify-between">
              <button onClick={handleBack} className="group flex items-center gap-3 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors">
                <div className="size-10 rounded-full border border-black/5 dark:border-white/5 flex items-center justify-center group-hover:border-black/20 dark:group-hover:border-white/20 transition-all">
                  <AnimateIcon animation="default">
                    <ArrowLeftIcon size={14} />
                  </AnimateIcon>
                </div>
                <span className="label-meta">Back to Studio</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="size-2 bg-accent rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">AI Engine Ready</span>
              </div>
            </div>
            <MoodDiscovery />
          </motion.div>
        )}

        {mode === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center h-[70vh] text-center"
          >
            <div className="relative size-48 mb-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="absolute inset-0 border-t-2 border-accent rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                className="absolute inset-4 border-r-2 border-primary/40 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <AnimateIcon animation="path">
                  <BrainIcon size={48} className="text-accent fill-icon" />
                </AnimateIcon>
              </motion.div>

              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="flex gap-1 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                      className="w-1 bg-accent rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>

            <h3 className="text-3xl font-black mb-4 tracking-tighter leading-none">AI Insight Synthesis</h3>
            <p className="text-black/30 dark:text-white/30 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Scanning Visual Chromatics...</p>
          </motion.div>
        )}

        {mode === 'publishing' && (
          <motion.div
            key="publishing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-3xl"
          >
            <div className="max-w-md w-full px-10 text-center">
              <div className="relative size-32 mx-auto mb-16">
                <svg className="w-full h-full -rotate-90">
                  <motion.circle
                    cx="64" cy="64" r="60"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-black/5 dark:text-white/5"
                  />
                  <motion.circle
                    cx="64" cy="64" r="60"
                    fill="none"
                    stroke="url(#aura-grad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 400" }}
                    animate={{ strokeDasharray: "400 400" }}
                    transition={{ duration: 4, ease: "easeInOut" }}
                  />
                  <defs>
                    <linearGradient id="aura-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimateIcon animation="default">
                    <SparklesIcon size={40} className="text-accent" />
                  </AnimateIcon>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <h3 className="text-3xl font-black tracking-tight leading-none italic">Synchronizing Aura</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 dark:text-white/40 leading-relaxed">
                  Encrypting and propagating your creation<br />to the community grid
                </p>

                <div className="pt-8 flex justify-center gap-1.5">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      className="size-1.5 rounded-full bg-accent"
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {mode === 'metadata' && (
          <motion.div key="metadata" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-xl mx-auto pb-32">
            <div className="flex items-center justify-between mb-16">
              <h2 className="text-3xl font-black tracking-tight">Final Details</h2>
              <button onClick={handleBack} className="text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">
                <AnimateIcon animation="default">
                  <XIcon size={24} />
                </AnimateIcon>
              </button>
            </div>

            <div className="space-y-12">
              <div className="space-y-4">
                <label className="label-meta text-black/30 dark:text-white/30">Target Format</label>
                <div className="grid grid-cols-4 gap-3">
                  {['Mobile', 'Desktop', 'Tablet', 'Square'].map((label) => (
                    <button
                      key={label}
                      className={`py-4 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${selectedRatio === (label === 'Mobile' ? '9:16' : '1:1')
                        ? 'bg-primary text-white border-primary'
                        : 'bg-transparent border-black/5 dark:border-white/5 text-black/40 dark:text-white/40'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="label-meta text-black/30 dark:text-white/30">Aura Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-b border-black/10 dark:border-white/10 py-4 font-black text-xl tracking-tight outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="bg-black/5 dark:bg-white/5 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest mb-1">Public Universe</p>
                  <p className="text-[9px] text-black/40 dark:text-white/40 uppercase tracking-widest">Visible to everyone in the feed</p>
                </div>
                <button
                  onClick={() => setVisibility(v => v === 'public' ? 'private' : 'public')}
                  className={`size-12 rounded-xl flex items-center justify-center transition-all ${visibility === 'public' ? 'bg-accent text-white' : 'bg-black/10 text-black/40'}`}
                >
                  <AnimateIcon animation="default">
                    {visibility === 'public' ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
                  </AnimateIcon>
                </button>
              </div>

              <button
                onClick={handleFinalize}
                disabled={isPublishing}
                className="w-full bg-primary dark:bg-white text-white dark:text-black h-20 rounded-lg font-black text-[11px] uppercase tracking-[0.3em] shadow-subtle hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isPublishing ? 'Synchronizing...' : 'Publish to Universe'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
