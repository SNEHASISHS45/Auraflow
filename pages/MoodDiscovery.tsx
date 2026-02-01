
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useMotionTemplate, AnimatePresence } from 'framer-motion';
import { geminiService } from '../services/geminiService';
import { soundService } from '../services/soundService';

export const MoodDiscovery: React.FC = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const [mood, setMood] = useState('Neutral Aura');
  const [resultDescription, setResultDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const xPos = useTransform(x, (val) => 50 + (val as number) / 4);
  const yPos = useTransform(y, (val) => 50 + (val as number) / 4);
  const background = useMotionTemplate`radial-gradient(circle at ${xPos}% ${yPos}%, #2b6cee 0%, transparent 70%)`;

  const generateMood = async () => {
    soundService.playTick();
    setLoading(true);
    setShowResult(false);
    try {
      // Fetch actual description from Gemini for the selected mood coordinates
      const prompt = await geminiService.getMoodPrompt(x.get() / 120, y.get() / 120);
      const parts = prompt.split('.');
      setMood(parts[0] || 'Custom Energy');
      setResultDescription(parts.slice(1).join('.') || 'Synchronized visual harmonics generated from your spatial input.');
      
      setTimeout(() => {
        setLoading(false);
        setShowResult(true);
        soundService.playSuccess();
      }, 1000);
    } catch (error) {
      setLoading(false);
      setMood('Aura Error');
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-160px)] items-center justify-center px-6 relative overflow-hidden bg-background-dark">
      <motion.div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{ background }} />

      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div 
            key="input"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center"
          >
            <div className="z-10 text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                AI Mood Synthesis
              </div>
              <h2 className="text-4xl font-black mb-3 tracking-tight">Sync Your Aura</h2>
              <p className="text-white/40 font-bold text-sm">Drag the orb to define your aesthetic coordinates</p>
            </div>

            {/* DRAG PLANE */}
            <div className="relative w-80 h-80 rounded-[3rem] border border-white/5 flex items-center justify-center z-10 bg-white/[0.02] backdrop-blur-3xl shadow-2xl">
              <span className="absolute top-6 uppercase text-[9px] tracking-[0.3em] font-black text-white/20">Bright</span>
              <span className="absolute bottom-6 uppercase text-[9px] tracking-[0.3em] font-black text-white/20">Dark</span>
              <span className="absolute left-6 uppercase text-[9px] tracking-[0.3em] font-black text-white/20 -rotate-90">Calm</span>
              <span className="absolute right-6 uppercase text-[9px] tracking-[0.3em] font-black text-white/20 rotate-90">Energetic</span>

              <motion.div
                drag
                dragConstraints={{ left: -120, right: 120, top: -120, bottom: 120 }}
                style={{ x, y }}
                onDragStart={() => soundService.playTick()}
                className="size-28 rounded-full cursor-grab active:cursor-grabbing bg-gradient-to-br from-white via-primary to-accent shadow-[0_0_60px_rgba(43,108,238,0.6)] flex items-center justify-center ring-4 ring-black/50"
              >
                <div className="size-6 bg-white/40 rounded-full border border-white/60 backdrop-blur-md shadow-inner" />
              </motion.div>
            </div>

            <div className="w-full mt-16 z-10 max-w-xs">
              <button
                onClick={generateMood}
                disabled={loading}
                className="w-full bg-white text-black py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 hover:bg-primary hover:text-white"
              >
                {loading ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="material-symbols-outlined">sync</motion.span> : <span className="material-symbols-outlined">magic_button</span>}
                {loading ? 'Synthesizing...' : 'Generate Vision'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            {/* AI Generated Visualization Placeholder */}
            <div className="relative size-64 mb-10">
               <motion.div 
                 animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 180, 270, 360],
                    borderRadius: ["40%", "50%", "40%"]
                 }}
                 transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                 className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-pink-500 blur-3xl opacity-50"
               />
               <div className="relative z-10 size-full rounded-[3rem] overflow-hidden border border-white/20 backdrop-blur-md flex items-center justify-center bg-black/20">
                  <span className="material-symbols-outlined text-7xl text-white/20 animate-pulse">auto_awesome</span>
               </div>
            </div>

            <h2 className="text-3xl font-black mb-4 tracking-tighter">{mood}</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-10 px-4 italic">"{resultDescription}"</p>
            
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowResult(false)} className="flex-1 py-4 rounded-2xl border border-white/10 font-bold text-xs uppercase tracking-widest">Retry</button>
              <button onClick={() => soundService.playTap()} className="flex-1 py-4 rounded-2xl bg-primary font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20">Save Aura</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
