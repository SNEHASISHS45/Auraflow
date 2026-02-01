
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { soundService } from '../services/soundService';
import { dbService } from '../services/dbService';
import { WallpaperSkeleton, Skeleton } from '../components/Skeleton';
import { AnimateIcon } from '../components/ui/AnimateIcon';
import { UserIcon, EyeIcon, EyeOffIcon, EditIcon, TrashIcon, ChevronRightIcon, LogoutIcon, XIcon, LockIcon } from '../components/ui/Icons';

interface ProfileProps {
  currentUser: User | null;
  onUserUpdate: (user: User) => void;
  onSignOut: () => void;
  onSignInClick: () => void;
  onRefresh: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ currentUser, onUserUpdate, onSignOut, onSignInClick, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User | null>(currentUser);
  const [userWallpapers, setUserWallpapers] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'uploads' | 'stats'>('uploads');
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchWallpapers = async () => {
    if (currentUser) {
      setLoading(true);
      const items = await dbService.getUserWallpapers(currentUser.id);
      setUserWallpapers(items);
      setLoading(false);
    }
  };

  useEffect(() => {
    setFormData(currentUser);
    fetchWallpapers();
  }, [currentUser]);

  const handleSave = () => {
    if (formData) {
      soundService.playSuccess();
      onUserUpdate(formData);
      setIsEditing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Erase this Aura from the universe? This cannot be undone.')) {
      soundService.playTick();
      try {
        await dbService.deleteWallpaper(id);
        setUserWallpapers(prev => prev.filter(w => w.id !== id));
        onRefresh();
        soundService.playSuccess();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleVisibility = async (wp: any) => {
    soundService.playTick();
    const newVisibility = wp.visibility === 'private' ? 'public' : 'private';
    try {
      await dbService.updateWallpaper(wp.id, { visibility: newVisibility });
      setUserWallpapers(prev => prev.map(w => w.id === wp.id ? { ...w, visibility: newVisibility } : w));
      onRefresh();
      soundService.playSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateWallpaper = async () => {
    if (editingItem) {
      try {
        await dbService.updateWallpaper(editingItem.id, { title: editingItem.title });
        setUserWallpapers(prev => prev.map(w => w.id === editingItem.id ? editingItem : w));
        setEditingItem(null);
        onRefresh();
        soundService.playSuccess();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-10 text-center">
        <div className="size-20 rounded-3xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-8">
          <AnimateIcon animation="path">
            <UserIcon size={40} className="text-black/20 dark:text-white/20" />
          </AnimateIcon>
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
    <div className="p-8 pb-32 max-w-4xl mx-auto">
      <section className="flex flex-col items-center mb-16">
        <div className="size-24 rounded-3xl bg-cover bg-center border border-black/5 dark:border-white/10 mb-6" style={{ backgroundImage: `url(${currentUser.avatar})` }} />
        <h2 className="text-3xl font-black tracking-tighter uppercase">{currentUser.name}</h2>
        <p className="label-meta text-accent mt-2">@{currentUser.username}</p>

        <div className="flex gap-12 mt-10">
          <div className="text-center group cursor-pointer" onClick={() => setActiveSubTab('uploads')}>
            <p className={`text-xl font-black transition-colors ${activeSubTab === 'uploads' ? 'text-white' : 'text-white/30'}`}>{userWallpapers.length}</p>
            <p className="label-meta text-black/30 dark:text-white/30 text-[8px] uppercase tracking-widest">My Aura</p>
          </div>
          <div className="text-center group cursor-pointer" onClick={() => setActiveSubTab('stats')}>
            <p className={`text-xl font-black transition-colors ${activeSubTab === 'stats' ? 'text-white' : 'text-white/30'}`}>{currentUser.followers}</p>
            <p className="label-meta text-black/30 dark:text-white/30 text-[8px] uppercase tracking-widest">Followers</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => { soundService.playTap(); setIsEditing(true); }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <AnimateIcon animation="default">
              <EditIcon size={16} />
            </AnimateIcon>
            <span className="text-xs font-bold uppercase tracking-wider">Edit Profile</span>
          </button>
          <button
            onClick={() => { soundService.playTap(); onSignOut(); }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
          >
            <AnimateIcon animation="default">
              <LogoutIcon size={16} />
            </AnimateIcon>
            <span className="text-xs font-bold uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </section>

      {activeSubTab === 'uploads' ? (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <WallpaperSkeleton key={i} />
              ))
            ) : userWallpapers.length > 0 ? (
              userWallpapers.map((wp: any) => (
                <motion.div
                  key={wp.id}
                  layoutId={wp.id}
                  className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-white/5 group relative"
                >
                  <img src={wp.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={wp.title} />

                  {/* Visibility Badge */}
                  {wp.visibility === 'private' && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center gap-1.5 border border-white/10">
                      <AnimateIcon animation="default">
                        <LockIcon size={10} className="text-white/60" />
                      </AnimateIcon>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Private</span>
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-4">{wp.title}</p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleVisibility(wp)}
                        className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        title={wp.visibility === 'private' ? 'Make Public' : 'Make Private'}
                      >
                        <AnimateIcon animation="default">
                          {wp.visibility === 'private' ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
                        </AnimateIcon>
                      </button>
                      <button
                        onClick={() => setEditingItem(wp)}
                        className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      >
                        <AnimateIcon animation="default">
                          <EditIcon size={14} />
                        </AnimateIcon>
                      </button>
                      <button
                        onClick={() => handleDelete(wp.id)}
                        className="flex-1 h-10 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center transition-colors"
                      >
                        <AnimateIcon animation="default">
                          <TrashIcon size={14} />
                        </AnimateIcon>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">No originals published yet</p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h3 className="label-meta text-black/30 dark:text-white/30 px-2 mb-4">Account Settings</h3>

          <button onClick={() => setIsEditing(true)} className="w-full flex items-center justify-between p-6 rounded-2xl bg-surface-light dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-black/20 transition-all group">
            <div className="flex items-center gap-4">
              <AnimateIcon animation="default">
                <EditIcon size={20} className="text-black/30 dark:text-white/30 group-hover:text-primary transition-colors" />
              </AnimateIcon>
              <span className="text-[11px] font-black uppercase tracking-widest">Update Identity</span>
            </div>
            <AnimateIcon animation="default">
              <ChevronRightIcon size={20} className="text-black/10" />
            </AnimateIcon>
          </button>

          <button onClick={onSignOut} className="w-full flex items-center justify-between p-6 rounded-2xl bg-surface-light dark:bg-white/5 border border-black/5 dark:border-white/5 group">
            <div className="flex items-center gap-4">
              <AnimateIcon animation="default">
                <LogoutIcon size={20} className="text-red-500/50" />
              </AnimateIcon>
              <span className="text-[11px] font-black uppercase tracking-widest text-red-500/80">Deactivate</span>
            </div>
          </button>
        </section>
      )}

      {/* Modal is simplified for phone feel */}
      <AnimatePresence>
        {isEditing && formData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-end justify-center p-4">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full max-w-lg bg-white dark:bg-black rounded-3xl p-10 border border-black/10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black tracking-tighter uppercase">Identity</h3>
                <button onClick={() => setIsEditing(false)} className="size-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <AnimateIcon animation="default">
                    <XIcon size={20} />
                  </AnimateIcon>
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="label-meta text-black/30 dark:text-white/30 ml-1">Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full h-14 bg-black/5 dark:bg-white/5 rounded-xl px-6 font-bold outline-none focus:ring-1 focus:ring-accent" />
                </div>
                <button onClick={handleSave} className="w-full h-16 bg-primary dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest">Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-end justify-center p-4">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full max-w-lg bg-white dark:bg-black rounded-3xl p-10 border border-black/10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black tracking-tighter uppercase">Edit Aura</h3>
                <button onClick={() => setEditingItem(null)} className="size-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <AnimateIcon animation="default">
                    <XIcon size={20} />
                  </AnimateIcon>
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="label-meta text-black/30 dark:text-white/30 ml-1">Aura Title</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full h-14 bg-black/5 dark:bg-white/5 rounded-xl px-6 font-bold outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <button onClick={handleUpdateWallpaper} className="w-full h-16 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest">Update Details</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
