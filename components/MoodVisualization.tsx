import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SparklesIcon } from './ui/Icons';
import { AnimateIcon } from './ui/AnimateIcon';

interface MoodVisualizationProps {
  energy: number; // -1 to 1 (Calm -> Energetic)
  brightness: number; // -1 to 1 (Dark -> Bright)
}

export const MoodVisualization: React.FC<MoodVisualizationProps> = ({ energy, brightness }) => {
  // Memoize values to avoid recalculation during renders
  const { primaryColor, secondaryColor, accentColor, speed, scale, rotationDuration } = useMemo(() => {
    // Hue mapping
    // Energy -1 -> 210 (Blue)
    // Energy 0 -> 300 (Purple)
    // Energy 1 -> 390/30 (Orange)
    const baseHue = 210 + ((energy + 1) * 90);

    // Saturation: High energy -> High saturation
    const saturation = 70 + (energy * 20); // 50% to 90%

    // Lightness: Brightness maps directly
    const lightness = 50 + (brightness * 20); // 30% to 70%

    const primary = `hsl(${baseHue % 360}, ${saturation}%, ${lightness}%)`;
    const secondary = `hsl(${(baseHue + 40) % 360}, ${saturation}%, ${lightness}%)`;
    const accent = `hsl(${(baseHue - 40) % 360}, ${saturation + 10}%, ${lightness + 10}%)`;

    // Animation params
    // Higher energy = faster speed (lower duration)
    // range: -1 -> 15s, 1 -> 3s
    const animSpeed = 9 - (energy * 6);

    // Scale variance
    // Higher energy = more pulsing
    const scaleVar = 1 + (energy + 1) * 0.2; // 1 to 1.4

    return {
      primaryColor: primary,
      secondaryColor: secondary,
      accentColor: accent,
      speed: animSpeed,
      scale: scaleVar,
      rotationDuration: animSpeed * 2
    };
  }, [energy, brightness]);

  return (
    <div className="relative size-64 mb-10 flex items-center justify-center">
      {/* Background Glow / Aura */}
      <motion.div
        animate={{
          scale: [1, scale, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 blur-3xl rounded-full"
        style={{
            background: `radial-gradient(circle, ${primaryColor}, transparent 70%)`
        }}
      />

      {/* Rotating Fluid Shape 1 */}
       <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: rotationDuration,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute inset-2 rounded-[40%] blur-xl opacity-60 mix-blend-screen"
          style={{
             background: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`
          }}
       />

       {/* Rotating Fluid Shape 2 (Counter) */}
       <motion.div
          animate={{
            rotate: -360,
            scale: [0.9, 1.1, 0.9],
            borderRadius: ["40%", "50%", "40%"]
          }}
          transition={{
            rotate: { duration: rotationDuration * 1.5, repeat: Infinity, ease: "linear" },
            scale: { duration: speed, repeat: Infinity, ease: "easeInOut" },
            borderRadius: { duration: speed * 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute inset-6 rounded-[45%] blur-lg opacity-80 mix-blend-screen"
          style={{
             background: `linear-gradient(to bottom, ${secondaryColor}, ${accentColor})`
          }}
       />

       {/* Core Orb Container - matches original style */}
       <div className="relative z-10 size-full rounded-[3rem] overflow-hidden border border-white/20 backdrop-blur-md flex items-center justify-center bg-black/10">
          <motion.div
            animate={{
                scale: [1, 1.05, 1],
                filter: [`drop-shadow(0 0 10px ${accentColor})`, `drop-shadow(0 0 20px ${accentColor})`, `drop-shadow(0 0 10px ${accentColor})`]
            }}
            transition={{ duration: speed, repeat: Infinity }}
          >
            <AnimateIcon animation="path-loop">
                <SparklesIcon size={72} className="text-white/80" />
            </AnimateIcon>
          </motion.div>
       </div>
    </div>
  );
};
