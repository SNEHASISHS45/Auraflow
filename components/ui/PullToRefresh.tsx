import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, animate, useMotionValue, MotionValue, useTransform } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { soundService } from '../../services/soundService';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    pullY?: MotionValue<number>;
}

// iPhone-like constants
const PULL_THRESHOLD = 80;
const REFRESH_Y = 60;

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, pullY }) => {
    const internalY = useMotionValue(0);
    const y = pullY || internalY;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullProgress, setPullProgress] = useState(0);
    const [canDrag, setCanDrag] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const isActuallyDragging = useRef(false);

    useEffect(() => {
        const scrollParent = containerRef.current?.closest('.overflow-y-auto');
        if (!scrollParent) return;

        const handleScroll = () => {
            setCanDrag(scrollParent.scrollTop <= 0);
        };

        scrollParent.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollParent.removeEventListener('scroll', handleScroll);
    }, []);

    const handleRelease = useCallback(async () => {
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
    }, [y, onRefresh]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleTouchStart = (e: TouchEvent) => {
            if (!canDrag || isRefreshing) return;
            startY.current = e.touches[0].clientY;
            isActuallyDragging.current = false;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!canDrag || isRefreshing) return;

            const currentY = e.touches[0].clientY;
            const diff = currentY - startY.current;

            // If we are pulling DOWN and at the top
            if (diff > 0) {
                isActuallyDragging.current = true;

                // This is crucial: stop native overscroll to allow custom PTR
                if (e.cancelable) e.preventDefault();

                const resistance = 0.4;
                const newY = diff * resistance;
                y.set(newY);
                setPullProgress(Math.min(1, newY / PULL_THRESHOLD));
            } else {
                isActuallyDragging.current = false;
            }
        };

        const handleTouchEnd = () => {
            if (isActuallyDragging.current) {
                handleRelease();
            }
            isActuallyDragging.current = false;
        };

        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
        };
    }, [canDrag, isRefreshing, y, handleRelease]);

    return (
        <div ref={containerRef} className="relative w-full min-h-full">
            {/* Pull Indicator */}
            <motion.div
                style={{
                    y: useTransform(y, [0, PULL_THRESHOLD], [-20, 30]),
                    opacity: pullProgress,
                    scale: pullProgress
                }}
                className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-[100]"
            >
                <div className="bg-surface/80 backdrop-blur-xl rounded-full p-3 border border-outline/20 shadow-lg transition-colors">
                    <motion.div
                        animate={isRefreshing ? { rotate: 360 } : { rotate: pullProgress * 540 }}
                        transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: 'spring', damping: 15 }}
                    >
                        <RefreshCw size={24} className={isRefreshing ? 'text-primary' : 'text-primary/60'} />
                    </motion.div>
                </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
                style={{ y }}
                className="w-full origin-top"
            >
                {children}
            </motion.div>
        </div>
    );
};
