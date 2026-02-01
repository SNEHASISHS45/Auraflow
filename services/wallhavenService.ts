/**
 * Wallhaven API Service
 * Fetches anime, gaming, and character wallpapers
 * API Docs: https://wallhaven.cc/help/api
 */

// CORS proxy to bypass browser restrictions
const CORS_PROXY = 'https://corsproxy.io/?';
const BASE_URL = 'https://wallhaven.cc/api/v1';

// Optional: Add your Wallhaven API key for NSFW content (leave empty for SFW only)
const API_KEY = '';

interface WallhavenThumbs {
    large: string;
    original: string;
    small: string;
}

interface WallhavenWallpaper {
    id: string;
    url: string;
    short_url: string;
    views: number;
    favorites: number;
    source: string;
    purity: string;
    category: string;
    dimension_x: number;
    dimension_y: number;
    resolution: string;
    ratio: string;
    file_size: number;
    file_type: string;
    created_at: string;
    colors: string[];
    path: string;
    thumbs: WallhavenThumbs;
}

interface WallhavenSearchResponse {
    data: WallhavenWallpaper[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface WallhavenItem {
    id: string;
    title: string;
    url: string;
    thumbnailUrl: string;
    author: string;
    authorAvatar: string;
    type: 'image' | 'video';
    tags: string[];
    views: number;
    downloads: number;
    likes: number;
    width: number;
    height: number;
    avgColor?: string;
    category: string;
}

const headers: Record<string, string> = API_KEY
    ? { 'X-API-Key': API_KEY }
    : {};

// Convert Wallhaven wallpaper to our format
function wallpaperToItem(wp: WallhavenWallpaper): WallhavenItem {
    const isPortrait = wp.dimension_y > wp.dimension_x;
    return {
        id: `wallhaven-${wp.id}`,
        title: `Wallpaper ${wp.id}`,
        url: wp.path,
        thumbnailUrl: wp.thumbs.large || wp.thumbs.original,
        author: 'Wallhaven',
        authorAvatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${wp.id}`,
        type: 'image',
        tags: [wp.category, isPortrait ? 'Portrait' : 'Landscape'],
        views: wp.views,
        downloads: Math.floor(wp.views * 0.3),
        likes: wp.favorites,
        width: wp.dimension_x,
        height: wp.dimension_y,
        avgColor: wp.colors?.[0],
        category: wp.category
    };
}

export const wallhavenService = {
    /**
     * Search wallpapers
     * @param query - Search term (e.g., "iron man", "anime", "naruto")
     * @param page - Page number
     * @param categories - Categories: general, anime, people (comma-separated)
     */
    async search(
        query: string,
        page: number = 1,
        categories: string = '111', // 111 = all categories enabled
        purity: string = '100' // 100 = SFW only
    ): Promise<WallhavenItem[]> {
        try {
            const params = new URLSearchParams({
                q: query,
                page: page.toString(),
                categories,
                purity,
                sorting: 'relevance',
                order: 'desc',
                ratios: 'portrait' // Phone wallpapers
            });

            const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`${BASE_URL}/search?${params}`)}`);
            if (!response.ok) throw new Error('Failed to search wallhaven');

            const data: WallhavenSearchResponse = await response.json();
            return data.data.map(wallpaperToItem);
        } catch (error) {
            console.error('Wallhaven search error:', error);
            return [];
        }
    },

    /**
     * Get anime wallpapers
     */
    async getAnime(page: number = 1): Promise<WallhavenItem[]> {
        return this.search('anime', page, '010'); // 010 = anime category only
    },

    /**
     * Get gaming wallpapers
     */
    async getGaming(page: number = 1): Promise<WallhavenItem[]> {
        return this.search('gaming video game', page);
    },

    /**
     * Get popular/top wallpapers
     */
    async getPopular(page: number = 1): Promise<WallhavenItem[]> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                categories: '111',
                purity: '100',
                sorting: 'toplist',
                topRange: '1M', // Top of last month
                order: 'desc',
                ratios: 'portrait'
            });

            const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`${BASE_URL}/search?${params}`)}`);
            if (!response.ok) throw new Error('Failed to get popular');

            const data: WallhavenSearchResponse = await response.json();
            return data.data.map(wallpaperToItem);
        } catch (error) {
            console.error('Wallhaven popular error:', error);
            return [];
        }
    },

    /**
     * Get latest wallpapers
     */
    async getLatest(page: number = 1): Promise<WallhavenItem[]> {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                categories: '111',
                purity: '100',
                sorting: 'date_added',
                order: 'desc',
                ratios: 'portrait'
            });

            const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`${BASE_URL}/search?${params}`)}`);
            if (!response.ok) throw new Error('Failed to get latest');

            const data: WallhavenSearchResponse = await response.json();
            return data.data.map(wallpaperToItem);
        } catch (error) {
            console.error('Wallhaven latest error:', error);
            return [];
        }
    },

    /**
     * Search for character wallpapers
     * Better for specific characters like Iron Man, Batman, Naruto, etc.
     */
    async searchCharacter(character: string, page: number = 1): Promise<WallhavenItem[]> {
        return this.search(character, page, '111', '100');
    }
};
