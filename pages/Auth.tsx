import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { authService } from '../services/authService';
import { soundService } from '../services/soundService';
import { User } from '../types';
import { AnimateIcon } from '../components/ui/AnimateIcon';
import { XIcon, SparklesIcon, GridIcon } from '../components/ui/Icons';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  onClose?: () => void;
}

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1605142859862-978be7eba909?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1200'
];

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    soundService.playTick();

    try {
      let user;
      if (isLogin) {
        user = await authService.signIn(email, password);
      } else {
        if (!name) throw new Error('Name is required');
        user = await authService.signUp(name, email, password);
      }
      soundService.playSuccess();
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    soundService.playTap();
    try {
      const user = await authService.signInWithGoogle();
      soundService.playSuccess();
      onAuthSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 100 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.08,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      y: 50,
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 350, damping: 35 }
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-row lg:overflow-hidden font-display selection:bg-primary/30">
      {/* Immersive Background Slideshow */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={bgIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.6, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${BACKGROUND_IMAGES[bgIndex]})` }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Close Button for Guest Browsing */}
      {onClose && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onClose}
          className="absolute top-12 right-8 z-[510] size-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-white"
        >
          <AnimateIcon animation="default">
            <XIcon size={24} />
          </AnimateIcon>
        </motion.button>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-lg bg-surface-variant/20 backdrop-blur-2xl rounded-[40px] border border-outline/10 p-8 lg:p-12 shadow-3 relative overflow-hidden"
      >
        <motion.div variants={itemVariants} className="mb-10 text-center">
          <div className="size-16 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-1">
            <SparklesIcon size={32} className="text-primary" />
          </div>
          <h2 className="text-4xl font-black tracking-tight text-on-surface mb-3 uppercase tracking-wider">
            {isLogin ? 'Welcome Back' : 'Join Auraflow'}
          </h2>
          <p className="text-on-surface-variant font-medium tracking-wide italic">
            {isLogin ? 'Continue your aesthetic journey' : 'Start your journey into high-end aesthetics'}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} layout className="space-y-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white/10 border border-white/20 p-8 rounded-[3rem] backdrop-blur-3xl shadow-2xl space-y-6"
          >
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aura@flow.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 px-6 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-red-400 text-[10px] font-bold text-center uppercase tracking-wider"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-primary-container text-on-primary-container rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-1 hover:shadow-2 active:scale-95 transition-all mb-8"
            >
              {loading ? (
                <AnimateIcon animation="path">
                  <GridIcon size={24} className="animate-spin" />
                </AnimateIcon>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-on-surface-variant text-sm font-medium">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); soundService.playTick(); }}
              className="text-primary font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          <motion.div variants={itemVariants} className="flex items-center gap-4 px-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Social Auth</span>
            <div className="h-px flex-1 bg-white/10" />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex justify-center"
          >
            {!loading && (
              <button
                onClick={handleGoogleSignIn}
                className="w-full h-16 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2 active:scale-95 transition-all mb-4"
              >
                <img src="https://www.google.com/favicon.ico" className="size-5 brightness-0 invert" alt="" />
                Continue with Google
              </button>
            )}
            {loading && (
              <div className="w-full bg-white text-black h-12 rounded-full flex items-center justify-center font-bold text-xs uppercase tracking-widest opacity-50">
                Connecting...
              </div>
            )}
          </motion.div>
        </motion.div>

        <motion.button
          variants={itemVariants}
          onClick={() => { setIsLogin(!isLogin); setError(''); soundService.playTick(); }}
          className="w-full mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
        >
          {isLogin ? "New Creator? Establish Identity" : "Member? Sign In to Aura"}
        </motion.button>
      </motion.div>
    </div>
  );
};
