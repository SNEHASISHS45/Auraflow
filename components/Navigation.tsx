
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppTab } from '../types';
import { soundService } from '../services/soundService';

const tabs = [
  { id: AppTab.HOME, icon: 'grid_view', label: 'Gallery' },
  { id: AppTab.EXPLORE, icon: 'search', label: 'Discover' },
  { id: AppTab.UPLOAD, icon: 'add_circle', label: 'Create' },
  { id: AppTab.SAVED, icon: 'bookmark', label: 'Saved' },
  { id: AppTab.PROFILE, icon: 'person', label: 'Profile' }
];

interface NavProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  canGoBack?: boolean;
  onBack?: () => void;
}

export const BottomNav: React.FC<NavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] pb-[env(safe-area-inset-bottom)] glass-nav border-t border-black/5 dark:border-white/5 lg:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
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
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-icon' : ''}`}>
                {tab.icon}
              </span>
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

export const Sidebar: React.FC<NavProps> = ({ activeTab, setActiveTab, isDarkMode, onToggleTheme }) => {
  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen border-r border-black/5 dark:border-white/5 bg-background-light dark:bg-background-dark p-12 z-[110]">
      <div className="mb-24">
        <h1 className="text-2xl font-black tracking-tighter uppercase">AuraFlow</h1>
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
              <span className={`material-symbols-outlined text-[22px] transition-transform group-hover:scale-110 ${isActive ? 'fill-icon' : ''}`}>
                {tab.icon}
              </span>
              <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${isActive ? '' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="pt-12 border-t border-black/5 dark:border-white/5 space-y-8">
        <button 
          onClick={() => { soundService.playTick(); onToggleTheme?.(); }}
          className="flex items-center gap-5 text-black/30 dark:text-white/30 hover:text-primary dark:hover:text-white transition-all group"
        >
          <span className="material-symbols-outlined text-[22px] group-hover:rotate-12 transition-transform">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
          <span className="text-[12px] font-black uppercase tracking-[0.2em]">
            {isDarkMode ? 'Light' : 'Dark'} Mode
          </span>
        </button>
      </div>
    </aside>
  );
};

export const TopBar: React.FC<NavProps & { title: string; hideOnDesktop?: boolean }> = ({ title, hideOnDesktop, canGoBack, onBack, isDarkMode, onToggleTheme }) => {
  if (hideOnDesktop) return null;
  return (
    <header className="sticky top-0 z-[90] glass-nav px-6 h-16 flex items-center justify-between lg:hidden border-b border-black/5 dark:border-white/5">
      <div className="flex items-center gap-4">
        {canGoBack ? (
          <button onClick={onBack} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
        ) : (
          <span className="material-symbols-outlined text-[24px] text-accent">blur_on</span>
        )}
        <h2 className="text-[12px] font-black uppercase tracking-[0.2em]">{title}</h2>
      </div>
      
      <button 
        onClick={() => { soundService.playTick(); onToggleTheme?.(); }}
        className="size-10 rounded-full flex items-center justify-center text-black/40 dark:text-white/40"
      >
        <span className="material-symbols-outlined text-[22px]">
          {isDarkMode ? 'light_mode' : 'dark_mode'}
        </span>
      </button>
    </header>
  );
};
