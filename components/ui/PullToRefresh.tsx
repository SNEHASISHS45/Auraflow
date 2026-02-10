import React, { useState, useEffect, useRef } from 'react';
import { motion, animate, useMotionValue } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { soundService } from '../../services/soundService';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullProgress, setPullProgress] = useState(0);
    const [canDrag, setCanDrag] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);

    // iPhone-like constants
    const PULL_THRESHOLD = 80;
    const REFRESH_Y = 60;

    useEffect(() => {
        const findScrollParent = (el: HTMLElement | null): HTMLElement | null => {
            if (!el) return null;
            if (el.scrollHeight > el.clientHeight && (window.getComputedStyle(el).overflowY === 'auto' || window.getComputedStyle(el).overflowY === 'scroll')) {
                return el;
            }
            return findScrollParent(el.parentElement);
        };

        const scrollParent = findScrollParent(containerRef.current);
        if (!scrollParent) return;

        const handleScroll = () => {
            setCanDrag(scrollParent.scrollTop <= 0);
        };

        scrollParent.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollParent.removeEventListener('scroll', handleScroll);
    }, []);

    const handleDrag = (_: any, info: any) => {
        if (isRefreshing || !canDrag) return;

        // Apple-style resistance (rubber band effect)
        const newY = Math.max(0, info.offset.y);
        const resistance = 0.4;
        const cappedY = newY * resistance;

        y.set(cappedY);
        setPullProgress(Math.min(1, cappedY / PULL_THRESHOLD));
    };

    const handleDragEnd = async () => {
        if (isRefreshing || !canDrag) return;

        const currentY = y.get();

        if (currentY >= PULL_THRESHOLD) {
            setIsRefreshing(true);
            soundService.playRefresh();
            animate(y, REFRESH_Y, {
                type: 'spring',
                stiffness: 300,
                damping: 30,
            });

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                animate(y, 0, {
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                });
                setPullProgress(0);
            }
        } else {
            animate(y, 0, {
                type: 'spring',
                stiffness: 300,
                damping: 30,
            });
            setPullProgress(0);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Pull Indicator */}
            <motion.div
                style={{ y, opacity: pullProgress }}
                className="absolute top-0 left-0 right-0 flex items-center justify-center pt-4 pointer-events-none z-50"
            >
                <div className="bg-surface-variant/30 backdrop-blur-md rounded-full p-2 border border-outline/10 shadow-2 transition-colors">
                    <motion.div
                        animate={isRefreshing ? { rotate: 360 } : { rotate: pullProgress * 180 }}
                        transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: 'spring' }}
                    >
                        <RefreshCw size={20} className={isRefreshing ? 'text-primary' : 'text-on-surface-variant/50'} />
                    </motion.div>
                </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
                drag={canDrag ? "y" : false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.6}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                style={{ y }}
                className="w-full origin-top"
            >
                {children}
            </motion.div>
        </div>
    );
};
