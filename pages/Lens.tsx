import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { soundService } from '../services/soundService';
import { geminiService } from '../services/geminiService';
import { pexelsService, WallpaperItem } from '../services/pexelsService';
import { wallhavenService } from '../services/wallhavenService';
import { Wallpaper } from '../types';
import { Skeleton } from '../components/Skeleton';
import { AnimateIcon } from '../components/ui/AnimateIcon';
import { LensIcon, ArrowLeftIcon, SparklesIcon } from '../components/ui/Icons';
import { Camera, Upload, X, Search, Play } from 'lucide-react';
import { Masonry } from '../components/ui/Masonry';

interface LensProps {
    onSelect: (wp: Wallpaper) => void;
}

type LensState = 'capture' | 'scanning' | 'results';

const toWallpaper = (item: WallpaperItem): Wallpaper => ({
    id: item.id,
    title: item.title,
    url: item.url,
    author: item.author,
    authorAvatar: item.authorAvatar,
    type: item.type === 'video' ? 'live' : 'static',
    tags: item.tags,
    views: item.views,
    downloads: item.downloads,
    likes: item.likes,
    videoUrl: item.videoUrl,
    width: item.width,
    height: item.height
});

export const Lens: React.FC<LensProps> = ({ onSelect }) => {
    const navigate = useNavigate();
    const [state, setState] = useState<LensState>('capture');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [searchTerms, setSearchTerms] = useState<string[]>([]);
    const [results, setResults] = useState<WallpaperItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraActive, setCameraActive] = useState(false);

    // Start camera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setCameraActive(true);
        } catch (err) {
            console.error('Camera access denied:', err);
            // Fallback to file picker
            fileInputRef.current?.click();
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    // Capture from camera
    const captureFromCamera = () => {
        if (!videoRef.current) return;
        soundService.playTap();
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            stopCamera();
            processImage(base64);
        }
    };

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        soundService.playTap();
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            processImage(base64);
        };
        reader.readAsDataURL(file);
    };

    // Process image with Gemini Vision
    const processImage = async (base64: string) => {
        setCapturedImage(base64);
        setState('scanning');

        try {
            const terms = await geminiService.generateSearchTerms(base64);
            setSearchTerms(terms);
            soundService.playSuccess();

            // Search for wallpapers using the AI-generated terms
            setIsSearching(true);
            const searchQuery = terms.slice(0, 3).join(' ');
            const [pexelsResults, wallhavenResults] = await Promise.all([
                pexelsService.searchPhotos(searchQuery, 1, 12),
                wallhavenService.searchCharacter(searchQuery, 1)
            ]);

            const wallhavenAsItems: WallpaperItem[] = wallhavenResults.map(w => ({
                ...w, videoUrl: undefined
            }));

            setResults([...wallhavenAsItems, ...pexelsResults]);
            setState('results');
        } catch (error) {
            console.error('Lens processing failed:', error);
            setState('capture');
        } finally {
            setIsSearching(false);
        }
    };

    // Reset
    const handleReset = () => {
        soundService.playTick();
        stopCamera();
        setCapturedImage(null);
        setSearchTerms([]);
        setResults([]);
        setState('capture');
    };

    return (
        <div className="min-h-screen pb-32 px-4 lg:px-12">
            {/* Header */}
            <div className="flex items-center justify-between py-6">
                <button
                    onClick={() => { stopCamera(); navigate('/upload'); }}
                    className="group flex items-center gap-3 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                    <div className="size-11 rounded-full border border-outline/10 flex items-center justify-center group-hover:bg-surface-variant transition-all">
                        <AnimateIcon animation="default">
                            <ArrowLeftIcon size={16} />
                        </AnimateIcon>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Studio</span>
                </button>
                <div className="flex items-center gap-2">
                    <div className="size-2 bg-accent rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Gemini Vision</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* ── Capture Mode ── */}
                {state === 'capture' && (
                    <motion.div
                        key="capture"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center justify-center pt-12"
                    >
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 rounded-full border border-accent/20 mb-6">
                                <LensIcon size={14} className="text-accent" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">AI Lens</span>
                            </div>
                            <h2 className="text-5xl lg:text-6xl font-black tracking-tighter leading-none mb-4">Scan & Discover</h2>
                            <p className="text-on-surface-variant text-sm font-medium max-w-md mx-auto">
                                Point your camera at anything or upload an image — Gemini Vision will find matching wallpapers instantly.
                            </p>
                        </div>

                        {/* Camera viewfinder */}
                        {cameraActive ? (
                            <div className="relative w-full max-w-lg aspect-[4/3] rounded-[32px] overflow-hidden border-2 border-primary/30 mb-8">
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />

                                {/* Viewfinder overlay */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {/* Corner brackets */}
                                    <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-accent rounded-tl-lg" />
                                    <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-accent rounded-tr-lg" />
                                    <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-accent rounded-bl-lg" />
                                    <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-accent rounded-br-lg" />

                                    {/* Scan line animation */}
                                    <motion.div
                                        animate={{ y: ['0%', '100%', '0%'] }}
                                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                        className="absolute left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent"
                                    />
                                </div>

                                {/* Capture button */}
                                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                                    <button
                                        onClick={captureFromCamera}
                                        className="size-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform ring-4 ring-white/30"
                                    >
                                        <div className="size-12 bg-accent rounded-full" />
                                    </button>
                                </div>

                                {/* Close camera */}
                                <button
                                    onClick={stopCamera}
                                    className="absolute top-4 right-4 size-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <div className="w-full max-w-lg">
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={startCamera}
                                        className="flex flex-col items-center justify-center gap-4 p-10 rounded-[32px] border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
                                    >
                                        <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                                            <Camera size={32} className="text-primary" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Open Camera</span>
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center gap-4 p-10 rounded-[32px] border-2 border-dashed border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors"
                                    >
                                        <div className="size-16 rounded-2xl bg-accent/20 flex items-center justify-center">
                                            <Upload size={32} className="text-accent" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Upload Image</span>
                                    </motion.button>
                                </div>
                            </div>
                        )}

                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </motion.div>
                )}

                {/* ── Scanning Mode ── */}
                {state === 'scanning' && (
                    <motion.div
                        key="scanning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center pt-20"
                    >
                        {/* Scanned image with overlay */}
                        <div className="relative w-64 h-64 rounded-3xl overflow-hidden mb-12">
                            {capturedImage && <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />}
                            <div className="absolute inset-0 bg-surface/40 backdrop-blur-sm flex items-center justify-center">
                                <div className="relative size-32">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                                        className="absolute inset-0 border-t-2 border-accent rounded-full"
                                    />
                                    <motion.div
                                        animate={{ rotate: -360 }}
                                        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                                        className="absolute inset-3 border-r-2 border-primary/40 rounded-full"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <LensIcon size={40} className="text-accent" />
                                    </div>
                                </div>
                            </div>

                            {/* Scan line */}
                            <motion.div
                                animate={{ y: ['0%', '100%', '0%'] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent"
                            />
                        </div>

                        <h3 className="text-2xl font-black tracking-tighter mb-2">Analyzing with Gemini Vision</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant animate-pulse">
                            Identifying objects and generating search terms...
                        </p>
                    </motion.div>
                )}

                {/* ── Results Mode ── */}
                {state === 'results' && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Captured image + AI terms */}
                        <div className="flex items-start gap-6 p-6 rounded-3xl bg-surface-variant/20 border border-outline/10">
                            {capturedImage && (
                                <img src={capturedImage} className="size-24 lg:size-32 rounded-2xl object-cover flex-shrink-0" alt="Scanned" />
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-3">
                                    <SparklesIcon size={14} className="text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">AI-Generated Search Terms</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {searchTerms.map((term, i) => (
                                        <motion.span
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="px-3 py-1.5 rounded-full bg-primary/10 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20"
                                        >
                                            {term}
                                        </motion.span>
                                    ))}
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:text-on-surface transition-colors"
                                >
                                    <Search size={12} />
                                    Scan Another
                                </button>
                            </div>
                        </div>

                        {/* Results grid */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">Matching Wallpapers</h3>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{results.length} found</span>
                            </div>

                            {results.length > 0 ? (
                                <Masonry<WallpaperItem>
                                    items={results}
                                    gap={16}
                                    renderItem={(item, i) => (
                                        <motion.div
                                            key={`${item.id}-${i}`}
                                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: (i % 10) * 0.03 }}
                                            onClick={() => { soundService.playTap(); onSelect(toWallpaper(item)); }}
                                            className="rounded-3xl overflow-hidden cursor-pointer group relative border border-outline/10 transition-all hover:border-primary/30 shadow-1 hover:shadow-3"
                                            style={{
                                                backgroundColor: item.avgColor || '#1a1a1a',
                                                aspectRatio: item.width && item.height ? `${item.width}/${item.height}` : '3/4'
                                            }}
                                        >
                                            <img
                                                src={item.thumbnailUrl}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                alt={item.title}
                                                loading="lazy"
                                            />
                                            {item.type === 'video' && item.videoUrl && (
                                                <div className="absolute top-4 right-4 size-8 bg-surface/60 backdrop-blur-md rounded-full flex items-center justify-center border border-outline/20">
                                                    <Play size={12} className="text-on-surface fill-on-surface ml-0.5" />
                                                </div>
                                            )}
                                            <div className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 ${item.id.startsWith('wallhaven') ? 'bg-primary/80 text-on-primary' : 'bg-secondary/80 text-on-secondary'}`}>
                                                {item.id.startsWith('wallhaven') ? 'Wallhaven' : 'Pexels'}
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                <p className="text-on-surface text-[10px] font-black uppercase tracking-widest truncate">{item.author}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                />
                            ) : (
                                <div className="py-20 text-center">
                                    <p className="text-on-surface-variant mb-2">No matching wallpapers found</p>
                                    <button onClick={handleReset} className="text-primary text-sm font-bold hover:underline">Try another image</button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
