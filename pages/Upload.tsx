
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundService } from '../services/soundService';
import { geminiService } from '../services/geminiService';
import { Wallpaper, AspectRatio } from '../types';
import { MoodDiscovery } from './MoodDiscovery';

interface UploadProps {
  onUploadSuccess: (wp: Wallpaper) => void;
}

type StudioMode = 'choice' | 'upload' | 'ai-lab' | 'analyzing' | 'metadata';

export const Upload: React.FC<UploadProps> = ({ onUploadSuccess }) => {
  const [mode, setMode] = useState<StudioMode>('choice');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('9:16');
  const [deviceTarget, setDeviceTarget] = useState<'phone' | 'pc' | 'tab'>('phone');
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
    soundService.playSuccess();

    const newWallpaper: Wallpaper = {
      id: `aura-${Date.now()}`,
      title: title || 'Untitled Aura',
      author: 'You',
      authorAvatar: 'https://i.pravatar.cc/150?u=you',
      url: previewUrl,
      views: '0',
      downloads: '0',
      likes: '0',
      type: isLive ? 'live' : 'static',
      tags: tags.length > 0 ? tags : ['Original'],
      aspectRatio: selectedRatio,
      deviceTarget: deviceTarget
    };
    
    await onUploadSuccess(newWallpaper);
    setIsPublishing(false);
  };

  return (
    <div className="min-h-screen px-6 py-12 lg:px-12">
      <AnimatePresence mode="wait">
        {mode === 'choice' && (
          <motion.div 
            key="choice"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center pt-20"
          >
            <div className="text-center mb-20">
              <h2 className="text-5xl lg:text-6xl font-black mb-4 tracking-tighter">Aura Studio</h2>
              <p className="text-black/30 dark:text-white/30 font-bold text-sm label-meta">Visual Synthesis Engine</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <button 
                onClick={() => { soundService.playTap(); fileInputRef.current?.click(); }}
                className="group flex flex-col items-start p-10 rounded-2xl border border-black/5 dark:border-white/5 bg-surface-light dark:bg-surface-dark hover:border-black/20 dark:hover:border-white/20 transition-all text-left"
              >
                <span className="material-symbols-outlined text-black dark:text-white text-4xl mb-6">cloud_upload</span>
                <h3 className="text-xl font-black mb-2 tracking-tight">Direct Upload</h3>
                <p className="text-black/40 dark:text-white/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">Publish your high-res originals</p>
              </button>

              <button 
                onClick={() => { soundService.playTap(); setMode('ai-lab'); }}
                className="group flex flex-col items-start p-10 rounded-2xl border border-black/5 dark:border-white/5 bg-surface-light dark:bg-surface-dark hover:border-black/20 dark:hover:border-white/20 transition-all text-left"
              >
                <span className="material-symbols-outlined text-accent text-4xl mb-6">psychology</span>
                <h3 className="text-xl font-black mb-2 tracking-tight">AI Mood Lab</h3>
                <p className="text-black/40 dark:text-white/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">Synthesize new auras with AI</p>
              </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </motion.div>
        )}

        {mode === 'ai-lab' && (
          <motion.div key="lab" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-12">
              <button onClick={handleBack} className="flex items-center gap-3 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span className="label-meta">Back to Studio</span>
              </button>
            </div>
            <MoodDiscovery />
          </motion.div>
        )}

        {mode === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-[60vh]">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="size-8 border-2 border-black/10 dark:border-white/10 border-t-accent rounded-full mb-8"
            />
            <h3 className="text-xl font-black mb-2 tracking-tighter">AI Analysis</h3>
            <p className="text-black/30 dark:text-white/30 text-[9px] font-black uppercase tracking-[0.2em] animate-pulse">Scanning visual profile...</p>
          </motion.div>
        )}

        {mode === 'metadata' && (
          <motion.div key="metadata" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-xl mx-auto pb-32">
            <div className="flex items-center justify-between mb-16">
              <h2 className="text-3xl font-black tracking-tight">Final Details</h2>
              <button onClick={handleBack} className="text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-12">
               <div className="space-y-4">
                  <label className="label-meta text-black/30 dark:text-white/30">Target Format</label>
                  <div className="grid grid-cols-4 gap-3">
                    {['Mobile', 'Desktop', 'Tablet', 'Square'].map((label) => (
                      <button
                        key={label}
                        className={`py-4 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${
                          selectedRatio === (label === 'Mobile' ? '9:16' : '1:1') 
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
