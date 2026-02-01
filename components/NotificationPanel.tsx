import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundService } from '../services/soundService';
import { dbService } from '../services/dbService';
import { NotificationSkeleton } from './Skeleton';
import { User } from '../types';
import { AnimateIcon } from './ui/AnimateIcon';
import { BellIcon, XIcon, LockIcon, BellOffIcon } from './ui/Icons';

interface Notification {
    id: string;
    title: string;
    message: string;
    time?: string;
    type: 'info' | 'success' | 'update';
    isRead: boolean;
    previewUrl?: string;
    createdAt?: any;
}

interface NotificationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, currentUser }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && currentUser) {
            setLoading(true);
            dbService.getNotifications(currentUser.id).then(items => {
                setNotifications(items);
                setLoading(false);
            });
        }
    }, [isOpen, currentUser]);

    const formatTime = (createdAt: any) => {
        if (!createdAt) return 'Recent';
        const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        const diff = Date.now() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] lg:bg-black/20"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] bg-white dark:bg-background-dark z-[160] shadow-2xl flex flex-col border-l border-black/5 dark:border-white/5"
                    >
                        {/* Header */}
                        <div className="p-6 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-background-dark/50 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <AnimateIcon animation="path">
                                        <BellIcon size={20} className="text-accent" />
                                    </AnimateIcon>
                                    <h2 className="text-[12px] font-black uppercase tracking-[0.2em]">Universe Updates</h2>
                                </div>
                                <p className="text-[10px] text-black/40 dark:text-white/40 font-bold uppercase tracking-widest">
                                    {notifications.filter(n => !n.isRead).length} Unread
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { soundService.playTick(); onClose(); }}
                                    className="size-9 rounded-xl flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    <AnimateIcon animation="default">
                                        <XIcon size={18} />
                                    </AnimateIcon>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                            {!currentUser ? (
                                <div className="h-full flex flex-col items-center justify-center text-center px-10">
                                    <AnimateIcon animation="path" className="mb-4">
                                        <LockIcon size={48} className="text-black/5 dark:text-white/5" />
                                    </AnimateIcon>
                                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-black/20 dark:text-white/20">
                                        Initialize identity to see updates
                                    </p>
                                </div>
                            ) : loading ? (
                                <div className="space-y-4">
                                    {[...Array(4)].map((_, i) => (
                                        <NotificationSkeleton key={i} />
                                    ))}
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`relative p-5 rounded-2xl border transition-all ${notif.isRead
                                            ? 'bg-black/[0.02] dark:bg-white/[0.02] border-transparent'
                                            : 'bg-white dark:bg-white/[0.05] border-black/5 dark:border-white/10 shadow-sm'
                                            }`}
                                    >
                                        {!notif.isRead && (
                                            <div className="absolute top-5 right-5 size-2 bg-accent rounded-full" />
                                        )}
                                        <div className="flex gap-4">
                                            {notif.previewUrl && (
                                                <div className="size-12 rounded-lg overflow-hidden flex-shrink-0 animate-in zoom-in-50 duration-500">
                                                    <img src={notif.previewUrl} className="w-full h-full object-cover" alt="preview" />
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${notif.type === 'success' ? 'text-green-500' :
                                                        notif.type === 'update' ? 'text-accent' : 'text-gray-400'
                                                        }`}>
                                                        {notif.type}
                                                    </span>
                                                    <span className="text-[10px] text-black/20 dark:text-white/20">•</span>
                                                    <span className="text-[10px] text-black/40 dark:text-white/40 font-bold uppercase tracking-widest">
                                                        {formatTime(notif.createdAt)}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-black/90 dark:text-white/90 truncate">
                                                    {notif.title}
                                                </h3>
                                                <p className="text-xs text-black/50 dark:text-white/50 leading-relaxed mt-1">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center px-10">
                                    <AnimateIcon animation="path" className="mb-4">
                                        <BellOffIcon size={48} className="text-black/5 dark:text-white/5" />
                                    </AnimateIcon>
                                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-black/20 dark:text-white/20">
                                        No recent activity
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-black/5 dark:border-white/5">
                            <button
                                className="w-full py-4 rounded-2xl bg-black/5 dark:bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                onClick={() => soundService.playTick()}
                            >
                                Mark all as read
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
