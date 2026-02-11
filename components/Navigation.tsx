
import React from 'react';
import { motion, AnimatePresence, useTransform, MotionValue } from 'framer-motion';
import { AppTab, User } from '../types';
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
    <nav className="fixed bottom-0 left-0 right-0 z-[100] pb-[env(safe-area-inset-bottom)] bg-black border-t border-white/10 lg:hidden shadow-3 dark">
      <div className="flex items-center justify-around h-20 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => { soundService.playTap(); setActiveTab(tab.id); }}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all group`}
            >
              <div className="relative flex flex-col items-center">
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-x-[-12px] h-8 bg-primary-container rounded-full -z-10 top-[-4px]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </AnimatePresence>

                {tab.id === AppTab.PROFILE && currentUser ? (
                  <div
                    className={`size-6 rounded-full bg-cover bg-center border border-outline/20 transition-all ${isActive ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface' : 'group-hover:scale-110'}`}
                    style={{ backgroundImage: `url(${currentUser.avatar})` }}
                  />
                ) : (
                  <AnimateIcon animation={isActive ? 'default' : 'initial'}>
                    <tab.icon
                      size={24}
                      className={`transition-colors ${isActive ? 'text-on-primary-container fill-current' : 'text-on-surface-variant group-hover:text-on-surface'}`}
                    />
                  </AnimateIcon>
                )}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-tight mt-2 transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const Sidebar: React.FC<NavProps> = ({ activeTab, setActiveTab, onNotificationOpen }) => {
  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen border-r border-outline/10 bg-surface p-8 z-[110]">
      <div className="mb-16 px-4">
        <h1 className="text-3xl font-white tracking-tighter uppercase text-primary">AuraFlow</h1>
      </div>

      <nav className="flex-1 space-y-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { soundService.playTap(); setActiveTab(tab.id); }}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-full transition-all group relative ${isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'}`}
            >
              <AnimateIcon animation={isActive ? 'default' : 'initial'}>
                <tab.icon size={22} className={`transition-transform group-hover:scale-110 ${isActive ? 'fill-current' : ''}`} />
              </AnimateIcon>
              <span className="text-sm font-bold tracking-wide uppercase">
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-pill"
                  className="absolute inset-0 bg-secondary-container rounded-full -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="pt-8 border-t border-outline/10 space-y-4">
        <button
          onClick={() => { soundService.playTick(); onNotificationOpen?.(); }}
          className="w-full flex items-center gap-4 px-5 py-3.5 rounded-full text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface transition-all group"
        >
          <div className="relative">
            <AnimateIcon animation="path">
              <BellIcon size={22} className="group-hover:scale-110 transition-transform" />
            </AnimateIcon>
            <div className="absolute -top-1 -right-1 size-2 bg-primary rounded-full border-2 border-surface" />
          </div>
          <span className="text-sm font-bold tracking-wide uppercase">
            Notifications
          </span>
        </button>
      </div>
    </aside>
  );
};

export const TopBar: React.FC<NavProps & { title: string; hideOnDesktop?: boolean; onSearchClick?: () => void; pullY?: MotionValue<number> }> = ({
  title,
  hideOnDesktop,
  canGoBack,
  onBack,
  onNotificationOpen,
  onSearchClick,
  pullY
}) => {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  // Use a transform that becomes 'none' when at rest to preserve position: sticky
  const transform = useTransform(pullY || new MotionValue(0), (v) => v === 0 ? "none" : `translateY(${v}px)`);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      { threshold: [1.0], rootMargin: '-1px 0px 0px 0px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (hideOnDesktop) return null;

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full absolute top-0 pointer-events-none" />
      <motion.header
        className={`sticky top-0 z-[90] px-4 h-16 flex items-center justify-between transition-all duration-300 ${isScrolled
          ? 'bg-surface/90 backdrop-blur-md border-b border-outline/10'
          : 'bg-transparent'
          }`}
      >
        <div className="flex-1 flex items-center">
          {canGoBack ? (
            <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-variant/50 transition-colors">
              <AnimateIcon animation="default">
                <ArrowLeftIcon size={24} className="text-on-surface" />
              </AnimateIcon>
            </button>
          ) : (
            <div className="p-2">
              <AnimateIcon animation="default">
                <SparklesIcon size={24} className="text-primary" />
              </AnimateIcon>
            </div>
          )}
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 text-center overflow-hidden max-w-[50%]">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-on-surface truncate">{title}</h2>
        </div>

        <div className="flex-1 flex items-center justify-end gap-1">
          {onSearchClick && (
            <button
              onClick={() => { soundService.playTick(); onSearchClick(); }}
              className="size-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/80 transition-colors"
            >
              <AnimateIcon animation="path">
                <SearchIcon size={20} />
              </AnimateIcon>
            </button>
          )}

          <button
            onClick={() => { soundService.playTick(); onNotificationOpen?.(); }}
            className="size-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant/80 relative transition-colors"
          >
            <AnimateIcon animation="default">
              <BellIcon size={22} />
            </AnimateIcon>
            <div className="absolute top-2.5 right-2.5 size-2 bg-primary rounded-full border-2 border-surface" />
          </button>
        </div>
      </motion.header>
    </>
  );
};
