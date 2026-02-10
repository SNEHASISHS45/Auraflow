import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AppTab, Wallpaper, User } from './types';
import { BottomNav, TopBar, Sidebar } from './components/Navigation';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Upload } from './pages/Upload';
import { Detail } from './pages/Detail';
import { Profile } from './pages/Profile';
import { Saved } from './pages/Saved';
import { Auth } from './pages/Auth';
import { SearchOverlay } from './components/SearchOverlay';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { NotificationPanel } from './components/NotificationPanel';
import { ProfileSkeleton } from './components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { dbService } from './services/dbService';
import { authService } from './services/authService';
import { soundService } from './services/soundService';

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname.substring(1);
    if (!path) return AppTab.HOME;
    return path as AppTab;
  };

  const activeTab = getActiveTab();
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const handleLike = useCallback((id: string) => {
    setLikedIds(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem('aura_liked_ids', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleBack = useCallback(() => {
    if (selectedWallpaper) {
      setSelectedWallpaper(null);
      soundService.playTick();
      return;
    }
    if (isSearchOpen) {
      setIsSearchOpen(false);
      soundService.playTick();
      return;
    }
    if (isNotificationOpen) {
      setIsNotificationOpen(false);
      soundService.playTick();
      return;
    }
    if (showAuth) {
      setShowAuth(false);
      soundService.playTick();
      return;
    }
    navigate(-1);
    soundService.playTick();
  }, [selectedWallpaper, isSearchOpen, showAuth, isNotificationOpen, navigate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleBack();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleBack]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('aura_saved_ids');
    const liked = localStorage.getItem('aura_liked_ids');
    if (saved) setSavedIds(JSON.parse(saved));
    if (liked) setLikedIds(JSON.parse(liked));

    const unsubAuth = authService.onAuthChange(async (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    refreshWallpapers();
    return () => unsubAuth();
  }, []);

  const navigateToTab = (tab: AppTab) => {
    soundService.playTap();
    navigate(`/${tab === AppTab.HOME ? '' : tab}`);
  };

  const refreshWallpapers = async () => {
    const items = await dbService.getAllWallpapers();
    setWallpapers(items);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background-dark">
      <ProfileSkeleton />
    </div>
  );

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark text-white flex flex-row lg:overflow-hidden font-display">
      {isDesktop && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={navigateToTab}
          onNotificationOpen={() => setIsNotificationOpen(true)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar
          title={activeTab}
          hideOnDesktop={isDesktop}
          activeTab={activeTab}
          setActiveTab={navigateToTab}
          canGoBack={location.pathname !== '/'}
          onBack={handleBack}
          onNotificationOpen={() => setIsNotificationOpen(true)}
          onSearchClick={() => navigateToTab(AppTab.EXPLORE)}
        />

        <main className="flex-1 overflow-y-auto no-scrollbar relative">
          <AnimatePresence>
            <Routes location={location}>
              <Route path="/" element={
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Home onSelect={setSelectedWallpaper} likedIds={likedIds} onLike={handleLike} customWallpapers={wallpapers} />
                </motion.div>
              } />
              <Route path="/explore" element={
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Explore onSelect={setSelectedWallpaper} />
                </motion.div>
              } />
              <Route path="/upload" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Upload onUploadSuccess={async (wp) => {
                    if (currentUser) {
                      const wallpaperData = {
                        ...wp,
                        author: currentUser.name,
                        authorAvatar: currentUser.avatar,
                        authorId: currentUser.id
                      };
                      await dbService.saveWallpaper(wallpaperData);
                      navigate('/');
                      refreshWallpapers();
                    }
                  }} currentUser={currentUser} onAuthRequired={() => setShowAuth(true)} />
                </motion.div>
              } />
              <Route path="/saved" element={
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Saved onSelect={setSelectedWallpaper} savedIds={savedIds} wallpapers={wallpapers} />
                </motion.div>
              } />
              <Route path="/profile" element={
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Profile
                    currentUser={currentUser}
                    onUserUpdate={(updatedUser) => {
                      setCurrentUser(updatedUser);
                    }}
                    onSignInClick={() => setShowAuth(true)}
                    onSignOut={async () => {
                      await authService.signOut();
                      setCurrentUser(null);
                      soundService.playSuccess();
                    }}
                    onRefresh={refreshWallpapers}
                  />
                </motion.div>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>

        {!isDesktop && <BottomNav activeTab={activeTab} setActiveTab={navigateToTab} currentUser={currentUser} />}
      </div>

      <AnimatePresence>
        {selectedWallpaper && (
          <Detail
            wallpaper={selectedWallpaper}
            isLiked={likedIds.includes(selectedWallpaper.id)}
            isSaved={savedIds.includes(selectedWallpaper.id)}
            currentUser={currentUser}
            onClose={() => setSelectedWallpaper(null)}
            onLike={() => handleLike(selectedWallpaper.id)}
            onSave={() => {
              setSavedIds(prev => {
                const next = prev.includes(selectedWallpaper.id)
                  ? prev.filter(i => i !== selectedWallpaper.id)
                  : [...prev, selectedWallpaper.id];
                localStorage.setItem('aura_saved_ids', JSON.stringify(next));
                return next;
              });
            }}
            onBack={() => setSelectedWallpaper(null)}
          />
        )}

        {isSearchOpen && (
          <SearchOverlay
            wallpapers={wallpapers}
            onSelect={(wp) => { setSelectedWallpaper(wp); setIsSearchOpen(false); }}
            onClose={() => setIsSearchOpen(false)}
          />
        )}

        {showAuth && <Auth onSuccess={setCurrentUser} onClose={() => setShowAuth(false)} onBack={() => setShowAuth(false)} />}
      </AnimatePresence>

      {showInstallBanner && <PWAInstallBanner deferredPrompt={deferredPrompt} onClose={() => setShowInstallBanner(false)} />}

      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

export default App;
