
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundService } from '../services/soundService';
import { ImageAnalysis } from '../services/geminiService';
import { aiCacheService } from '../services/aiCacheService';
import { cloudinaryService } from '../services/cloudinaryService';
import { Wallpaper, AspectRatio, User } from '../types';
import { MoodDiscovery } from './MoodDiscovery';
import { AnimateIcon } from '../components/ui/AnimateIcon';
import {
  ArrowLeftIcon,
  SparklesIcon,
  ArrowRightIcon,
  CloudUploadIcon,
  BrainIcon,
  LensIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon
} from '../components/ui/Icons';
import { Masonry } from '../components/ui/Masonry';
import { useNavigate } from 'react-router-dom';

interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'analyzing' | 'ready' | 'publishing' | 'success' | 'error';
  title: string;
  tags: string[];
  aiAnalysis: ImageAnalysis | null;
  cloudinaryUrl?: string;
  progress: number;
  width?: number;
  height?: number;
}

interface UploadProps {
  onUploadSuccess: (wp: Wallpaper) => void;
  currentUser: User | null;
  onAuthRequired: () => void;
}

type StudioMode = 'choice' | 'upload' | 'ai-lab' | 'analyzing' | 'metadata' | 'publishing';

export const Upload: React.FC<UploadProps> = ({ onUploadSuccess, currentUser, onAuthRequired }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<StudioMode>('choice');
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('9:16');
  const [deviceTarget, setDeviceTarget] = useState<'phone' | 'pc' | 'tab'>('phone');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBack = () => {
    soundService.playTick();
    setMode('choice');
    setUploadItems([]);
  };

  const processFile = async (file: File) => {
    const id = Math.random().toString(36).substring(7);

    // Create preview and detect dimensions with timeout and robust error handling
    let previewData: { previewUrl: string, width: number, height: number } | null = null;
    try {
      previewData = await new Promise<{ previewUrl: string, width: number, height: number }>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('File processing timeout')), 10000);
        const reader = new FileReader();

        reader.onloadend = () => {
          const url = reader.result as string;
          const img = new Image();
          img.onload = () => {
            clearTimeout(timeout);
            resolve({ previewUrl: url, width: img.naturalWidth, height: img.naturalHeight });
          };
          img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Image load failed'));
          };
          img.src = url;
        };

        reader.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('File read failed'));
        };

        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.warn(`Initial processing for ${file.name} failed:`, err);
      // Fallback preview with zeroed dims if it completely fails
      previewData = { previewUrl: '', width: 0, height: 0 };
    }

    const newItem: UploadItem = {
      id,
      file,
      previewUrl: previewData.previewUrl,
      status: 'analyzing',
      title: file.name.split('.')[0].replace(/[-_]/g, ' '),
      tags: ['Original', 'Upload'],
      aiAnalysis: null,
      progress: 0,
      width: previewData.width,
      height: previewData.height
    };

    setUploadItems(prev => [...prev, newItem]);

    if (!previewData.previewUrl) {
      setUploadItems(prev => prev.map(item => item.id === id ? { ...item, status: 'ready' } : item));
      return;
    }

    try {
      // AI analysis with timeout (15s)
      const analysisPromise = aiCacheService.getImageAnalysis(previewData.previewUrl);
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('AI Analysis Timeout')), 15000)
      );

      const analysis = await Promise.race([analysisPromise, timeoutPromise]) as ImageAnalysis;

      setUploadItems(prev => prev.map(item =>
        item.id === id ? {
          ...item,
          status: 'ready',
          aiAnalysis: analysis,
          tags: analysis.tags,
          title: analysis.title || item.title,
          progress: 100
        } : item
      ));
    } catch (err) {
      console.warn(`AI Analysis for ${file.name} failed or timed out:`, err);
      setUploadItems(prev => prev.map(item =>
        item.id === id ? { ...item, status: 'ready' } : item
      ));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    soundService.playTick();
    setMode('analyzing');

    // Process files sequentially to avoid 429 errors and resource overload
    for (const file of files) {
      await processFile(file);
    }

    soundService.playSuccess();
    setMode('metadata');
  };

  const handleFinalize = async () => {
    if (uploadItems.length === 0 || isPublishing) return;
    setIsPublishing(true);
    setMode('publishing');
    soundService.playSuccess();

    const publishPromises = uploadItems.map(async (item) => {
      try {
        setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'publishing' } : i));

        const cloudinaryUrl = await cloudinaryService.uploadImage(item.previewUrl);

        const newWallpaper: Wallpaper = {
          id: `aura-${Date.now()}-${item.id}`,
          title: item.title || 'Untitled Aura',
          author: currentUser?.name || 'You',
          authorAvatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=you',
          url: cloudinaryUrl,
          views: 0,
          downloads: 0,
          likes: 0,
          aiInsight: item.aiAnalysis?.description || '',
          aiDescription: item.aiAnalysis?.description || '',
          aiColors: item.aiAnalysis?.colors || [],
          aiMood: item.aiAnalysis?.mood || '',
          aiCategory: item.aiAnalysis?.category || '',
          aiObjects: item.aiAnalysis?.objects || [],
          type: isLive ? 'live' : 'static',
          tags: item.tags.length > 0 ? item.tags : ['Original'],
          aspectRatio: selectedRatio,
          deviceTarget: deviceTarget,
          visibility: visibility,
          width: item.width,
          height: item.height
        };

        await onUploadSuccess(newWallpaper);
        setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'success', progress: 100 } : i));
      } catch (error) {
        console.error(`Finalize error for ${item.id}:`, error);
        setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
      }
    });

    await Promise.all(publishPromises);
    setIsPublishing(false);

    // Check if all were successful
    const allSuccess = uploadItems.every(item => item.status === 'success');
    if (allSuccess) {
      setTimeout(() => navigate('/profile'), 2000);
    }
  };

  const removeItem = (id: string) => {
    setUploadItems(prev => prev.filter(item => item.id !== id));
    if (uploadItems.length <= 1) setMode('choice');
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
              <p className="text-black/30 dark:text-white/30 font-bold text-sm label-meta tracking-widest text-center">Visual Synthesis Engine v6.0 — Multi-Phase Logic</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
              {[
                {
                  id: 'upload',
                  icon: CloudUploadIcon,
                  title: 'Batch Upload',
                  desc: 'Parallel AI analysis for multiple images',
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
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
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
            className="flex flex-col items-center justify-center min-h-[70vh] text-center"
          >
            <div className="w-full max-w-4xl px-6 mb-16">
              <Masonry<UploadItem>
                items={uploadItems}
                gap={24}
                renderItem={(item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative rounded-2xl overflow-hidden border border-outline/10 bg-black/5"
                    style={{ aspectRatio: item.width && item.height ? `${item.width}/${item.height}` : '9/16' }}
                  >
                    <img src={item.previewUrl} className="w-full h-full object-cover opacity-40 grayscale" alt="Analyzing" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="size-10 border-t-2 border-accent rounded-full mb-4"
                      />
                      <span className="text-[8px] font-black uppercase tracking-widest text-on-surface/60">Analyzing...</span>
                    </div>
                    {/* Scan Line effect */}
                    <motion.div
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-accent/40 shadow-[0_0_15px_rgba(139,92,246,0.5)] z-10"
                    />
                  </motion.div>
                )}
              />
            </div>

            <div className="max-w-md">
              <h3 className="text-3xl font-black mb-4 tracking-tighter leading-none italic">Gemini Parallel Synthesis</h3>
              <p className="text-black/30 dark:text-white/30 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Processing {uploadItems.length} auras simultaneously...</p>
            </div>
          </motion.div>
        )}

        {mode === 'publishing' && (
          <motion.div
            key="publishing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-surface/95 backdrop-blur-3xl"
          >
            <div className="max-w-4xl w-full px-10 text-center">
              <div className="w-full mb-16">
                <Masonry<UploadItem>
                  items={uploadItems}
                  gap={16}
                  columns={{ 640: 3, 1024: 5 }}
                  renderItem={(item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative rounded-2xl overflow-hidden border border-outline/10"
                      style={{ aspectRatio: item.width && item.height ? `${item.width}/${item.height}` : '4/3' }}
                    >
                      <img src={item.previewUrl} className="w-full h-full object-cover" />
                      {item.status === 'publishing' && (
                        <div className="absolute inset-0 bg-accent/20 flex items-center justify-center px-2">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="size-1 bg-white rounded-full shadow-[0_0_10px_white]"
                          />
                        </div>
                      )}
                      {item.status === 'success' && (
                        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
                          <div className="size-12 rounded-full bg-white flex items-center justify-center">
                            <SparklesIcon className="text-green-500" size={24} />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <h3 className="text-3xl font-black tracking-tight leading-none italic">Aura Propagation</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 dark:text-white/40 leading-relaxed">
                  Synchronizing {uploadItems.filter(i => i.status === 'success').length} / {uploadItems.length} entities<br />to the global neural grid
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
          <motion.div key="metadata" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl mx-auto pb-32 w-full">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-black tracking-tight italic">Studio Refinement</h2>
              <button onClick={handleBack} className="text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">
                <AnimateIcon animation="default">
                  <XIcon size={24} />
                </AnimateIcon>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Side: Items List */}
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                <label className="label-meta text-black/30 dark:text-white/30 sticky top-0 bg-surface/80 backdrop-blur-md z-10 py-2">Batch Elements ({uploadItems.length})</label>
                {uploadItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    className="p-4 rounded-3xl bg-surface border border-outline/10 flex gap-4 group hover:border-accent/40 transition-colors"
                  >
                    <div className="size-24 rounded-2xl overflow-hidden flex-shrink-0 border border-outline/10">
                      <img src={item.previewUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, title: e.target.value } : i));
                          }}
                          className="w-full bg-transparent font-black text-sm tracking-tight outline-none mb-2"
                          placeholder="Untitled Aura"
                        />
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[8px] font-black uppercase tracking-widest opacity-60">
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && <span className="text-[8px] font-black opacity-30 mt-1">+{item.tags.length - 3}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[8px] font-black uppercase tracking-widest text-error opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove Entity
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Right Side: Global Metadata & Actions */}
              <div className="space-y-10">
                {/* Visual Settings */}
                <div className="p-8 rounded-[48px] bg-black/5 dark:bg-white/5 border border-outline/5 space-y-8">
                  <div className="space-y-4">
                    <label className="label-meta text-black/30 dark:text-white/30">Universal Projection</label>
                    <div className="grid grid-cols-4 gap-3">
                      {(['Mobile', 'PC', 'Tab', '1:1'] as const).map((label) => {
                        const ratioMap: Record<string, AspectRatio> = { 'Mobile': '9:16', 'PC': '16:9', 'Tab': '4:3', '1:1': '1:1' };
                        const ratio = ratioMap[label];
                        return (
                          <button
                            key={label}
                            onClick={() => setSelectedRatio(ratio)}
                            className={`py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${selectedRatio === ratio
                              ? 'bg-primary text-white border-primary shadow-lg scale-105'
                              : 'bg-transparent border-black/5 dark:border-white/5 text-black/40 dark:text-white/40 hover:border-primary/20'
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="flex items-center justify-between pt-4 border-t border-outline/10">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest mb-1">Public Universe</p>
                      <p className="text-[9px] text-black/40 dark:text-white/40 uppercase tracking-widest italic">Broadcast to community</p>
                    </div>
                    <button
                      onClick={() => setVisibility(v => v === 'public' ? 'private' : 'public')}
                      className={`size-12 rounded-2xl flex items-center justify-center transition-all ${visibility === 'public' ? 'bg-accent text-white shadow-lg' : 'bg-black/10 text-black/40'}`}
                    >
                      <AnimateIcon animation="default">
                        {visibility === 'public' ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
                      </AnimateIcon>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleFinalize}
                    disabled={isPublishing || uploadItems.length === 0}
                    className="w-full h-24 bg-primary text-on-primary rounded-[32px] font-black text-sm uppercase tracking-[0.4em] shadow-2 hover:shadow-4 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    {isPublishing ? 'Synchronizing Universe...' : `Publish ${uploadItems.length} Auras`}
                  </button>
                  <div className="text-center space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30 italic">Each aura will be published as an individual post</p>
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-30">All items will inherit universal projection settings</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
