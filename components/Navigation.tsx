
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppTab } from '../types';
import { soundService } from '../services/soundService';
import { AnimateIcon } from './ui/AnimateIcon';
import { HomeIcon, SearchIcon, PlusIcon, BookmarkIcon, UserIcon, BellIcon, ArrowLeftIcon, SparklesIcon } from './ui/Icons';

const tabs = [
  { id: AppTab.HOME, icon: HomeIcon, label: 'Gallery' },
  { id: AppTab.EXPLORE, icon: SearchIcon, label: 'Discover' },
  { id: AppTab.UPLOAD, icon: PlusIcon, label: 'Create' },
  { id: AppTab.SAVED, icon: BookmarkIcon, label: 'Saved' },
  { id: AppTab.PROFILE, icon: UserIcon, label: 'Profile' }
];

import { User } from '../types';

interface NavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  canGoBack?: boolean;
  onBack?: () => void;
  onNotificationOpen?: () => void;
  currentUser?: User | null;
}

export const BottomNav: React.FC<NavProps> = ({ activeTab, setActiveTab, currentUser }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] pb-[env(safe-area-inset-bottom)] bg-black border-t border-white/5 lg:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          if (tab.id === AppTab.PROFILE && currentUser) {
            return (
              <button
                key={tab.id}
                onClick={() => { soundService.playTap(); setActiveTab(tab.id); }}
                className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all ${isActive ? 'text-primary dark:text-white' : 'text-black/20 dark:text-white/20'}`}
              >
                <div className={`size-6 rounded-full bg-cover bg-center border border-white/10 ${isActive ? 'ring-2 ring-white' : ''}`} style={{ backgroundImage: `url(${currentUser.avatar})` }} />
                <span className="text-[8px] font-black uppercase tracking-tight mt-1">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => { soundService.playTap(); setActiveTab(tab.id); }}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all ${isActive ? 'text-primary dark:text-white' : 'text-black/20 dark:text-white/20'}`}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-x-2 inset-y-2 bg-black/5 dark:bg-white/5 rounded-2xl -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </AnimatePresence>
              <AnimateIcon animation={isActive ? 'default' : 'initial'}>
                <tab.icon size={24} className={isActive ? 'fill-current' : ''} />
              </AnimateIcon>
              <span className="text-[8px] font-black uppercase tracking-tight mt-1">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const Sidebar: React.FC<NavProps> = ({ activeTab, setActiveTab, isDarkMode, onToggleTheme, onNotificationOpen }) => {
  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen border-r border-white/5 bg-black p-12 z-[110]">
      <div className="mb-24">
        <h1 className="text-2xl font-black tracking-tighter uppercase text-white">AuraFlow</h1>
      </div>

      <nav className="flex-1 space-y-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { soundService.playTap(); setActiveTab(tab.id); }}
              className={`w-full flex items-center gap-5 transition-all group ${isActive ? 'text-primary dark:text-white' : 'text-black/30 dark:text-white/30 hover:text-primary dark:hover:text-white'}`}
            >
              <AnimateIcon animation={isActive ? 'default' : 'initial'}>
                <tab.icon size={22} className={`transition-transform group-hover:scale-110 ${isActive ? 'fill-current' : ''}`} />
              </AnimateIcon>
              <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${isActive ? '' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="pt-12 border-t border-black/5 dark:border-white/5 space-y-8">
        <button
          onClick={() => { soundService.playTick(); onNotificationOpen?.(); }}
          className="flex items-center gap-5 text-black/30 dark:text-white/30 hover:text-primary dark:hover:text-white transition-all group"
        >
          <div className="relative">
            <AnimateIcon animation="path">
              <BellIcon size={22} className="group-hover:scale-110 transition-transform" />
            </AnimateIcon>
            <div className="absolute -top-1 -right-1 size-2 bg-accent rounded-full border-2 border-white dark:border-background-dark" />
          </div>
          <span className="text-[12px] font-black uppercase tracking-[0.2em]">
            Notifications
          </span>
        </button>
      </div>
    </aside>
  );
};

export const TopBar: React.FC<NavProps & { title: string; hideOnDesktop?: boolean; onSearchClick?: () => void }> = ({
  title,
  hideOnDesktop,
  canGoBack,
  onBack,
  onNotificationOpen,
  onSearchClick
}) => {
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (hideOnDesktop) return null;

  return (
    <header
      className={`sticky top-0 z-[90] px-6 h-16 flex items-center justify-between lg:hidden transition-all duration-300 ${isScrolled
        ? 'bg-black border-b border-white/5'
        : 'bg-transparent'
        }`}
    >
      <div className="flex items-center gap-4">
        {canGoBack ? (
          <button onClick={onBack} className="flex items-center gap-2">
            <AnimateIcon animation="default">
              <ArrowLeftIcon size={24} />
            </AnimateIcon>
          </button>
        ) : (
          <AnimateIcon animation="default">
            <SparklesIcon size={24} className="text-accent" />
          </AnimateIcon>
        )}
        <h2 className="text-[12px] font-black uppercase tracking-[0.2em]">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Search Button */}
        {onSearchClick && (
          <button
            onClick={() => { soundService.playTick(); onSearchClick(); }}
            className="size-10 rounded-full flex items-center justify-center text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition-colors"
          >
            <AnimateIcon animation="path">
              <SearchIcon size={20} />
            </AnimateIcon>
          </button>
        )}

        {/* Notification Button */}
        <button
          onClick={() => { soundService.playTick(); onNotificationOpen?.(); }}
          className="size-10 rounded-full flex items-center justify-center text-black/40 dark:text-white/40 relative"
        >
          <AnimateIcon animation="default">
            <BellIcon size={22} />
          </AnimateIcon>
          <div className="absolute top-2 right-2 size-2 bg-accent rounded-full border-2 border-white dark:border-background-dark" />
        </button>
      </div>
    </header>
  );
};
