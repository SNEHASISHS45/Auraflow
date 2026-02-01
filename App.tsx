
import React, { useState, useEffect, useCallback } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { dbService } from './services/dbService';
import { authService } from './services/authService';
import { soundService } from './services/soundService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [tabHistory, setTabHistory] = useState<AppTab[]>([]);
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('aura_theme');
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

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
    if (showAuth) {
      setShowAuth(false);
      soundService.playTick();
      return;
    }
    
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory(prev => prev.slice(0, -1));
      setActiveTab(prevTab);
      soundService.playTick();
    }
  }, [selectedWallpaper, isSearchOpen, showAuth, tabHistory]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleBack();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleBack]);

  const navigateToTab = (tab: AppTab) => {
    if (tab === activeTab) return;
    setTabHistory(prev => [...prev, activeTab]);
    setActiveTab(tab);
  };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('aura_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    
    const unsubscribeAuth = authService.onAuthChange((user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    const saved = localStorage.getItem('aura_saved_ids');
    const liked = localStorage.getItem('aura_liked_ids');
    if (saved) setSavedIds(JSON.parse(saved));
    if (liked) setLikedIds(JSON.parse(liked));

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const items = await dbService.getAllWallpapers();
        setWallpapers(items);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    if (!isLoading) loadData();
  }, [isLoading]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-background-light dark:bg-background-dark">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="size-8 border-2 border-black/5 dark:border-white/5 border-t-accent rounded-full mb-6" />
      <p className="label-meta text-black/30 dark:text-white/20">Syncing Aura</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-primary dark:text-white flex flex-row lg:overflow-hidden font-display">
      {isDesktop && (
        <Sidebar activeTab={activeTab} setActiveTab={navigateToTab} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar 
          title={activeTab} 
          hideOnDesktop={isDesktop} 
          activeTab={activeTab} 
          setActiveTab={navigateToTab}
          canGoBack={tabHistory.length > 0}
          onBack={handleBack}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
        
        <main className="flex-1 overflow-y-auto no-scrollbar relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div 
              key={activeTab} 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              {activeTab === AppTab.HOME && <Home onSelect={setSelectedWallpaper} likedIds={likedIds} onLike={(id) => {
                setLikedIds(prev => {
                  const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
                  localStorage.setItem('aura_liked_ids', JSON.stringify(next));
                  return next;
                });
              }} customWallpapers={wallpapers} />}
              {activeTab === AppTab.EXPLORE && <Explore onSelect={setSelectedWallpaper} />}
              {activeTab === AppTab.UPLOAD && <Upload onUploadSuccess={(wp) => { dbService.saveWallpaper(wp); navigateToTab(AppTab.HOME); }} />}
              {activeTab === AppTab.SAVED && <Saved onSelect={setSelectedWallpaper} savedIds={savedIds} wallpapers={wallpapers} />}
              {activeTab === AppTab.PROFILE && <Profile currentUser={currentUser} onUserUpdate={setCurrentUser} onSignOut={() => setCurrentUser(null)} onSignInClick={() => setShowAuth(true)} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {!isDesktop && <BottomNav activeTab={activeTab} setActiveTab={navigateToTab} />}
      </div>

      <AnimatePresence>
        {selectedWallpaper && (
          <Detail 
            wallpaper={selectedWallpaper} 
            isLiked={likedIds.includes(selectedWallpaper.id)} 
            isSaved={savedIds.includes(selectedWallpaper.id)} 
            onToggleLike={() => {
              const id = selectedWallpaper.id;
              setLikedIds(prev => {
                const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
                localStorage.setItem('aura_liked_ids', JSON.stringify(next));
                return next;
              });
            }} 
            onToggleSave={() => {
              const id = selectedWallpaper.id;
              setSavedIds(prev => {
                const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
                localStorage.setItem('aura_saved_ids', JSON.stringify(next));
                return next;
              });
            }} 
            onBack={() => setSelectedWallpaper(null)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSearchOpen && (
          <SearchOverlay 
            wallpapers={wallpapers} 
            onSelect={(wp) => { setSelectedWallpaper(wp); setIsSearchOpen(false); }} 
            onClose={() => setIsSearchOpen(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuth && <Auth onAuthSuccess={(user) => { setCurrentUser(user); setShowAuth(false); }} onClose={() => setShowAuth(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showInstallBanner && <PWAInstallBanner deferredPrompt={deferredPrompt} onClose={() => setShowInstallBanner(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default App;
