
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { soundService } from '../services/soundService';

interface ProfileProps {
  currentUser: User | null;
  onUserUpdate: (user: User) => void;
  onSignOut: () => void;
  onSignInClick: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ currentUser, onUserUpdate, onSignOut, onSignInClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User | null>(currentUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(currentUser);
  }, [currentUser]);

  const handleSave = () => {
    if (formData) {
      soundService.playSuccess();
      onUserUpdate(formData);
      setIsEditing(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-10 text-center">
        <div className="size-20 rounded-3xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-8">
          <span className="material-symbols-outlined text-4xl text-black/20 dark:text-white/20">person</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight mb-4">Guest Aura</h2>
        <p className="text-sm font-medium text-black/40 dark:text-white/40 mb-10 max-w-[240px] uppercase tracking-widest leading-relaxed">
          Initialize your identity to sync your collection across the multiverse.
        </p>
        <button 
          onClick={() => { soundService.playTap(); onSignInClick(); }}
          className="w-full max-w-xs h-16 bg-primary dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl"
        >
          Initialize
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 pb-32 max-w-2xl mx-auto">
      <section className="flex flex-col items-center mb-16">
        <div className="size-24 rounded-3xl bg-cover bg-center border border-black/5 dark:border-white/10 mb-6" style={{ backgroundImage: `url(${currentUser.avatar})` }} />
        <h2 className="text-3xl font-black tracking-tighter uppercase">{currentUser.name}</h2>
        <p className="label-meta text-accent mt-2">@{currentUser.username}</p>
        
        <div className="flex gap-12 mt-10">
          <div className="text-center">
            <p className="text-xl font-black">{currentUser.followers}</p>
            <p className="label-meta text-black/30 dark:text-white/30 text-[8px]">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black">{currentUser.uploads}</p>
            <p className="label-meta text-black/30 dark:text-white/30 text-[8px]">Uploads</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="label-meta text-black/30 dark:text-white/30 px-2 mb-4">Account Settings</h3>
        
        <button onClick={() => setIsEditing(true)} className="w-full flex items-center justify-between p-6 rounded-2xl bg-surface-light dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-black/20 transition-all group">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-black/30 dark:text-white/30 group-hover:text-primary transition-colors">edit_square</span>
            <span className="text-[11px] font-black uppercase tracking-widest">Update Identity</span>
          </div>
          <span className="material-symbols-outlined text-black/10">chevron_right</span>
        </button>

        <button onClick={onSignOut} className="w-full flex items-center justify-between p-6 rounded-2xl bg-surface-light dark:bg-white/5 border border-black/5 dark:border-white/5 group">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-red-500/50">logout</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-red-500/80">Deactivate</span>
          </div>
        </button>
      </section>

      {/* Modal is simplified for phone feel */}
      <AnimatePresence>
        {isEditing && formData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-end justify-center p-4">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full max-w-lg bg-white dark:bg-black rounded-3xl p-10 border border-black/10">
               <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black tracking-tighter uppercase">Identity</h3>
                  <button onClick={() => setIsEditing(false)} className="size-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined">close</span>
                  </button>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="label-meta text-black/30 dark:text-white/30 ml-1">Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-14 bg-black/5 dark:bg-white/5 rounded-xl px-6 font-bold outline-none focus:ring-1 focus:ring-accent" />
                  </div>
                  <button onClick={handleSave} className="w-full h-16 bg-primary dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest">Save Changes</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
