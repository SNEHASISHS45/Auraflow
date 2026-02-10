/**
 * AI Cache Service — 2-Layer Caching for Gemini API
 * Layer 1: localStorage (instant, 7-day TTL)
 * Layer 2: Firestore wallpaper doc (persistent, shared across users)
 * Layer 3: Gemini API (last resort)
 */

import { geminiService, ImageAnalysis, LensResult } from './geminiService';
import { dbService } from './dbService';
import { Wallpaper } from '../types';

const CACHE_PREFIX = 'aura_ai_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── localStorage helpers ────────────────────────────────────────────────────

function getFromLocal<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const { data, expiry } = JSON.parse(raw);
        if (Date.now() > expiry) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }
        return data as T;
    } catch {
        return null;
    }
}

function saveToLocal(key: string, data: unknown): void {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
            data,
            expiry: Date.now() + CACHE_TTL_MS
        }));
    } catch (e) {
        // localStorage full — evict oldest entries
        try {
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k?.startsWith(CACHE_PREFIX)) keys.push(k);
            }
            // Remove oldest 5 entries
            keys.sort().slice(0, 5).forEach(k => localStorage.removeItem(k));
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
                data,
                expiry: Date.now() + CACHE_TTL_MS
            }));
        } catch { /* give up */ }
    }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const aiCacheService = {

    /**
     * Get AI Insight for a wallpaper.
     * Check: wallpaper.aiInsight → localStorage → Gemini API
     * Saves result back to both caches.
     */
    async getInsight(wallpaper: Wallpaper): Promise<string> {
        const cacheKey = `insight_${wallpaper.id}`;

        // 1. Check Firestore field (already loaded on the wallpaper object)
        if (wallpaper.aiInsight) {
            saveToLocal(cacheKey, wallpaper.aiInsight); // warm local cache
            return wallpaper.aiInsight;
        }

        // 2. Check localStorage
        const local = getFromLocal<string>(cacheKey);
        if (local) return local;

        // 3. Call Gemini API
        const insight = await geminiService.getWallpaperInsight(wallpaper.title, wallpaper.tags);

        // Save to both caches
        saveToLocal(cacheKey, insight);
        this.saveToFirestore(wallpaper.id, { aiInsight: insight });

        return insight;
    },

    /**
     * Get Lens Analysis for a wallpaper.
     * Check: wallpaper AI fields → localStorage → Gemini Vision API
     */
    async getLensAnalysis(wallpaper: Wallpaper): Promise<LensResult> {
        const cacheKey = `lens_${wallpaper.id}`;

        // 1. Check Firestore fields (already on the object)
        if (wallpaper.aiDescription && wallpaper.aiColors && wallpaper.aiColors.length > 0) {
            const cached: LensResult = {
                description: wallpaper.aiDescription,
                colors: wallpaper.aiColors,
                objects: wallpaper.aiObjects || [],
                style: wallpaper.aiStyle || 'Digital Art',
                searchTerms: wallpaper.aiSearchTerms || []
            };
            saveToLocal(cacheKey, cached);
            return cached;
        }

        // 2. Check localStorage
        const local = getFromLocal<LensResult>(cacheKey);
        if (local) return local;

        // 3. Call Gemini Vision API
        const result = await geminiService.describeForLens(wallpaper.url);

        // Save to both caches
        saveToLocal(cacheKey, result);
        this.saveToFirestore(wallpaper.id, {
            aiDescription: result.description,
            aiColors: result.colors,
            aiObjects: result.objects,
            aiStyle: result.style,
            aiSearchTerms: result.searchTerms
        });

        return result;
    },

    /**
     * Get full image analysis (for upload flow).
     * No wallpaper ID yet — just use API and return (will be saved on publish).
     * But we can cache by image hash to avoid re-analyzing the same image.
     */
    async getImageAnalysis(base64Image: string): Promise<ImageAnalysis> {
        // Simple hash of first 200 chars of base64 for cache key
        const hashPart = base64Image.replace(/^data:.*?;base64,/, '').substring(0, 200);
        const cacheKey = `analysis_${simpleHash(hashPart)}`;

        // Check localStorage
        const local = getFromLocal<ImageAnalysis>(cacheKey);
        if (local) return local;

        // Call Gemini Vision API
        const analysis = await geminiService.analyzeImage(base64Image);

        // Save to localStorage
        saveToLocal(cacheKey, analysis);

        return analysis;
    },

    /**
     * Persist AI data on a wallpaper Firestore doc.
     * Fire-and-forget — errors are logged but don't break the UI.
     */
    saveToFirestore(wallpaperId: string, data: Partial<Wallpaper>): void {
        // Only save for user-uploaded wallpapers (they have Firestore docs)
        // External wallpapers (pexels/wallhaven) are cached only in localStorage
        if (wallpaperId.startsWith('pexels-') || wallpaperId.startsWith('wallhaven-')) return;

        dbService.updateWallpaper(wallpaperId, data).catch(err => {
            console.warn('Failed to save AI cache to Firestore:', err);
        });
    }
};

// Simple string hash for cache keys
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}
