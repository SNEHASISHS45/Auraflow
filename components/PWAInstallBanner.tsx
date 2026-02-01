
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundService } from '../services/soundService';
import { AnimateIcon } from './ui/AnimateIcon';
import { SparklesIcon, PlusIcon } from './ui/Icons';

interface PWAInstallBannerProps {
  deferredPrompt: any;
  onClose: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ deferredPrompt, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDetect = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDetect);

    if (timeLeft <= 0) {
      onClose();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 0.1);
    }, 100);

    return () => clearInterval(timer);
  }, [timeLeft, onClose]);

  const handleInstall = async () => {
    soundService.playTap();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install: ${outcome}`);
      onClose();
    } else if (isIOS) {
      // For iOS, we can't trigger the prompt directly, just show instructions
      alert("To install AuraFlow on your iPhone:\n1. Tap the 'Share' icon at the bottom\n2. Scroll down and tap 'Add to Home Screen'");
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-24 lg:bottom-10 left-4 right-4 lg:left-auto lg:right-10 lg:w-[420px] z-[1000]"
    >
      <div className="bg-white/90 dark:bg-black/90 backdrop-blur-3xl border border-black/10 dark:border-white/10 rounded-[40px] p-8 shadow-huge relative overflow-hidden">
        {/* Progress Bar Background */}
        <div className="absolute bottom-0 left-0 h-1.5 bg-slate-100 dark:bg-white/5 w-full" />
        {/* Animated Progress Bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-1.5 bg-primary"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 15, ease: "linear" }}
        />

        <div className="flex items-start gap-5 mb-8">
          <div className="size-16 bg-gradient-to-br from-primary to-accent rounded-[22px] flex items-center justify-center shadow-xl shrink-0">
            <AnimateIcon animation="default">
              <SparklesIcon size={36} className="text-white" />
            </AnimateIcon>
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tighter mb-1.5">Install AuraFlow</h3>
            <p className="text-sm text-slate-500 dark:text-white/40 leading-relaxed font-medium">Add to your home screen for the full cinematic experience & offline access.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleInstall}
            className="flex-[1.5] h-14 bg-primary text-white rounded-[22px] font-black text-[11px] uppercase tracking-widest shadow-huge shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <AnimateIcon animation="default">
              <PlusIcon size={18} />
            </AnimateIcon>
            {isIOS ? 'Show Steps' : 'Install Now'}
          </button>
          <button
            onClick={() => { soundService.playTick(); onClose(); }}
            className="flex-1 h-14 bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-[22px] font-black text-[11px] uppercase tracking-widest text-slate-400 dark:text-white/40 active:scale-95 transition-all"
          >
            Later
          </button>
        </div>

        {isIOS && (
          <p className="mt-4 text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest text-center">
            Optimized for iOS Home Screen
          </p>
        )}
      </div>
    </motion.div>
  );
};
