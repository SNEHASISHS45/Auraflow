
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundService } from '../services/soundService';
import { ImageAnalysis } from '../services/geminiService';
import { aiCacheService } from '../services/aiCacheService';
import { cloudinaryService } from '../services/cloudinaryService';
import { Wallpaper, AspectRatio, User } from '../types';
import { MoodDiscovery } from './MoodDiscovery';
import { AnimateIcon } from '../components/ui/AnimateIcon';
import { CloudUploadIcon, BrainIcon, ArrowRightIcon, ArrowLeftIcon, SparklesIcon, XIcon, EyeIcon, EyeOffIcon, LensIcon } from '../components/ui/Icons';
import { useNavigate } from 'react-router-dom';

interface UploadProps {
  onUploadSuccess: (wp: Wallpaper) => void;
  currentUser: User | null;
  onAuthRequired: () => void;
}

type StudioMode = 'choice' | 'upload' | 'ai-lab' | 'analyzing' | 'metadata' | 'publishing';

export const Upload: React.FC<UploadProps> = ({ onUploadSuccess, currentUser, onAuthRequired }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<StudioMode>('choice');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<ImageAnalysis | null>(null);
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
        // Use cached AI analysis (localStorage → Gemini API)
        const analysis = await aiCacheService.getImageAnalysis(base64);
        setAiAnalysis(analysis);
        setTags(analysis.tags);
        setTitle(analysis.title || file.name.split('.')[0].replace(/[-_]/g, ' '));
        soundService.playSuccess();
        setMode('metadata');
      } catch (err) {
        setTags(['Original', 'Upload']);
        setTitle(file.name.split('.')[0].replace(/[-_]/g, ' '));
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
      const cloudinaryUrl = await cloudinaryService.uploadImage(previewUrl);
      const newWallpaper: Wallpaper = {
        id: `aura-${Date.now()}`,
        title: title || 'Untitled Aura',
        author: 'You',
        authorAvatar: 'https://i.pravatar.cc/150?u=you',
        url: cloudinaryUrl,
        views: '0',
        downloads: '0',
        likes: '0',
        // Persist AI analysis for reuse (avoid repeat API calls)
        aiInsight: aiAnalysis?.description || '',
        aiDescription: aiAnalysis?.description || '',
        aiColors: aiAnalysis?.colors || [],
        aiMood: aiAnalysis?.mood || '',
        aiCategory: aiAnalysis?.category || '',
        aiObjects: aiAnalysis?.objects || [],
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
              <p className="text-black/30 dark:text-white/30 font-bold text-sm label-meta tracking-widest text-center">Visual Synthesis Engine v5.0 — Gemini Vision</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
              {[
                {
                  id: 'upload',
                  icon: CloudUploadIcon,
                  title: 'Direct Upload',
                  desc: 'AI analyzes your image instantly',
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
                },
                {
                  id: 'lens',
                  icon: LensIcon,
                  title: 'AI Lens',
                  desc: 'Scan anything, find wallpapers',
                  color: 'tertiary',
                  action: () => navigate('/lens')
                }
              ].map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  onClick={() => { soundService.playTap(); item.action(); }}
                  className="group relative flex flex-col items-start p-10 rounded-[48px] border border-outline/10 bg-surface transition-all duration-500 hover:border-primary/40 hover:scale-[1.02] text-left shadow-1 hover:shadow-3"
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`size-20 rounded-[32px] bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                    <AnimateIcon animation="path">
                      <item.icon size={48} className="text-primary" />
                    </AnimateIcon>
                  </div>
                  <h3 className="text-3xl font-black mb-3 tracking-tight text-on-surface uppercase tracking-wider">{item.title}</h3>
                  <p className="text-on-surface-variant text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed mb-8">{item.desc}</p>
                  <div className="flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Initialize Engine</span>
                    <AnimateIcon animation="default">
                      <ArrowRightIcon size={16} />
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
              <button onClick={handleBack} className="group flex items-center gap-3 text-on-surface-variant hover:text-on-surface transition-colors">
                <div className="size-11 rounded-full border border-outline/10 flex items-center justify-center group-hover:bg-surface-variant transition-all">
                  <AnimateIcon animation="default">
                    <ArrowLeftIcon size={16} />
                  </AnimateIcon>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Studio</span>
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

            <h3 className="text-3xl font-black mb-4 tracking-tighter leading-none">Gemini Vision Analysis</h3>
            <p className="text-black/30 dark:text-white/30 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">AI is analyzing your image...</p>
          </motion.div>
        )}

        {mode === 'publishing' && (
          <motion.div
            key="publishing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-surface/95 backdrop-blur-3xl"
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
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black tracking-tight">Final Details</h2>
              <button onClick={handleBack} className="text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">
                <AnimateIcon animation="default">
                  <XIcon size={24} />
                </AnimateIcon>
              </button>
            </div>

            <div className="space-y-10">

              {/* AI Analysis Card */}
              {aiAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <SparklesIcon size={16} className="text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Gemini Vision Analysis</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-on-surface/80 italic mb-5 leading-relaxed">"{aiAnalysis.description}"</p>

                  {/* Color Palette */}
                  <div className="mb-5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block">Detected Colors</span>
                    <div className="flex gap-2 flex-wrap">
                      {aiAnalysis.colors.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/50 border border-outline/10">
                          <div className="size-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex }} />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Objects & Mood */}
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                      <span className="text-[9px] font-black uppercase tracking-widest text-accent">Mood: {aiAnalysis.mood}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary">Category: {aiAnalysis.category}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Image Preview */}
              {previewUrl && (
                <div className="relative rounded-3xl overflow-hidden aspect-video border border-outline/10">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Target Format */}
              <div className="space-y-4">
                <label className="label-meta text-black/30 dark:text-white/30">Target Format</label>
                <div className="grid grid-cols-4 gap-3">
                  {(['Mobile', 'Desktop', 'Tablet', 'Square'] as const).map((label) => {
                    const ratioMap: Record<string, AspectRatio> = { Mobile: '9:16', Desktop: '16:9', Tablet: '4:3', Square: '1:1' };
                    const ratio = ratioMap[label];
                    return (
                      <button
                        key={label}
                        onClick={() => setSelectedRatio(ratio)}
                        className={`py-4 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${selectedRatio === ratio
                          ? 'bg-primary text-white border-primary'
                          : 'bg-transparent border-black/5 dark:border-white/5 text-black/40 dark:text-white/40'
                          }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-4">
                <label className="label-meta text-black/30 dark:text-white/30">Aura Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-b border-black/10 dark:border-white/10 py-4 font-black text-xl tracking-tight outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* AI Tags */}
              <div className="space-y-4">
                <label className="label-meta text-black/30 dark:text-white/30">AI-Generated Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span key={i} className="px-4 py-2 rounded-full bg-secondary-container/30 text-[10px] font-black uppercase tracking-widest text-on-secondary-container border border-outline/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visibility Toggle */}
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
                className="w-full h-20 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2 hover:shadow-3 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
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
