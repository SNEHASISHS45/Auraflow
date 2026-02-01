import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AmbientContextType {
    setAmbientColor: (color: string) => void;
    ambientColor: string;
}

const AmbientContext = createContext<AmbientContextType>({
    setAmbientColor: () => { },
    ambientColor: '#6366f1'
});

export const useAmbient = () => useContext(AmbientContext);

interface AmbientProviderProps {
    children: React.ReactNode;
}

export const AmbientProvider: React.FC<AmbientProviderProps> = ({ children }) => {
    const [ambientColor, setAmbientColorState] = useState('#6366f1');

    const setAmbientColor = useCallback((color: string) => {
        setAmbientColorState(color);
    }, []);

    return (
        <AmbientContext.Provider value={{ setAmbientColor, ambientColor }}>
            {children}
        </AmbientContext.Provider>
    );
};

// Ambient Header Effect - gradient at top of page, hides on scroll
export const AmbientHeader: React.FC = () => {
    const { ambientColor } = useAmbient();
    const [scrollY, setScrollY] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrollY(currentScrollY);
            // Hide when scrolled more than 100px
            setIsVisible(currentScrollY < 100);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Calculate opacity based on scroll (fade out between 0-100px)
    const opacity = Math.max(0, 1 - scrollY / 100);

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-72 pointer-events-none overflow-hidden z-0"
            style={{ opacity }}
            animate={{ opacity: isVisible ? opacity : 0 }}
            transition={{ duration: 0.3 }}
        >
            <AnimatePresence>
                <motion.div
                    key={ambientColor}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    {/* Main gradient blob */}
                    <motion.div
                        animate={{
                            x: [0, 30, 0],
                            y: [0, 15, 0],
                        }}
                        transition={{
                            duration: 12,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute -top-32 left-1/4 w-[500px] h-[350px] rounded-full blur-[80px] opacity-50 dark:opacity-30"
                        style={{ backgroundColor: ambientColor }}
                    />

                    {/* Secondary blob */}
                    <motion.div
                        animate={{
                            x: [0, -20, 0],
                            y: [0, 20, 0],
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute -top-20 right-1/4 w-[400px] h-[280px] rounded-full blur-[70px] opacity-40 dark:opacity-25"
                        style={{ backgroundColor: ambientColor }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Fade out gradient at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background dark:from-background-dark to-transparent" />
        </motion.div>
    );
};
