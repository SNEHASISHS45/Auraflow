/**
 * Pexels API Service
 * Fetches high-quality images and videos for the wallpaper feed
 */

const API_KEY = 'm0gdcwXU4WuVYe7anm0mm3dMAHnZI8yRX7Nr92jcFq2nEsHfMFggd9Nu';
const BASE_URL = 'https://api.pexels.com/v1';
const VIDEO_URL = 'https://api.pexels.com/videos';

interface PexelsPhoto {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographer_url: string;
    photographer_id: number;
    avg_color: string;
    src: {
        original: string;
        large2x: string;
        large: string;
        medium: string;
        small: string;
        portrait: string;
        landscape: string;
        tiny: string;
    };
    alt: string;
}

interface PexelsVideo {
    id: number;
    width: number;
    height: number;
    duration: number;
    url: string;
    image: string;
    user: {
        id: number;
        name: string;
        url: string;
    };
    video_files: Array<{
        id: number;
        quality: string;
        file_type: string;
        width: number;
        height: number;
        link: string;
    }>;
}

interface PexelsSearchResponse {
    page: number;
    per_page: number;
    photos: PexelsPhoto[];
    total_results: number;
    next_page?: string;
}

interface PexelsVideoResponse {
    page: number;
    per_page: number;
    videos: PexelsVideo[];
    total_results: number;
    next_page?: string;
}

export interface WallpaperItem {
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
    videoUrl?: string;
}

const headers = {
    'Authorization': API_KEY
};

// Generate tags from alt text or query
function generateTags(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = ['the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'and', 'or', 'is', 'are', 'was', 'were'];
    return words
        .filter(word => word.length > 2 && !commonWords.includes(word))
        .slice(0, 5)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1));
}

// Convert Pexels photo to our WallpaperItem format
function photoToWallpaper(photo: PexelsPhoto): WallpaperItem {
    return {
        id: `pexels-${photo.id}`,
        title: photo.alt || 'Untitled',
        url: photo.src.large2x || photo.src.original,
        thumbnailUrl: photo.src.medium || photo.src.small,
        author: photo.photographer,
        authorAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(photo.photographer)}`,
        type: 'image',
        tags: generateTags(photo.alt || 'wallpaper abstract'),
        views: Math.floor(Math.random() * 10000) + 1000,
        downloads: Math.floor(Math.random() * 5000) + 500,
        likes: Math.floor(Math.random() * 2000) + 100,
        width: photo.width,
        height: photo.height,
        avgColor: photo.avg_color
    };
}

// Convert Pexels video to our WallpaperItem format
function videoToWallpaper(video: PexelsVideo): WallpaperItem {
    const hdFile = video.video_files.find(f => f.quality === 'hd') || video.video_files[0];
    return {
        id: `pexels-video-${video.id}`,
        title: `Video by ${video.user.name}`,
        url: video.image,
        thumbnailUrl: video.image,
        author: video.user.name,
        authorAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(video.user.name)}`,
        type: 'video',
        tags: ['Video', 'Motion', 'Live Wallpaper'],
        views: Math.floor(Math.random() * 10000) + 1000,
        downloads: Math.floor(Math.random() * 5000) + 500,
        likes: Math.floor(Math.random() * 2000) + 100,
        width: video.width,
        height: video.height,
        videoUrl: hdFile?.link
    };
}

// Cache for curated photos
const curatedCache = new Map<string, { timestamp: number, data: WallpaperItem[] }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const pexelsService = {
    /**
     * Get curated photos for the home feed
     */
    async getCurated(page: number = 1, perPage: number = 20): Promise<WallpaperItem[]> {
        const cacheKey = `curated-${page}-${perPage}`;
        const cached = curatedCache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            return cached.data;
        }

        try {
            const response = await fetch(`${BASE_URL}/curated?page=${page}&per_page=${perPage}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch curated photos');
            const data: PexelsSearchResponse = await response.json();
            const result = data.photos.map(photoToWallpaper);

            curatedCache.set(cacheKey, { timestamp: Date.now(), data: result });
            return result;
        } catch (error) {
            console.error('Pexels curated error:', error);
            return [];
        }
    },

    /**
     * Search for photos - uses exact query
     * Note: Pexels only has stock photos, not copyrighted content like Marvel, Anime, etc.
     */
    async searchPhotos(query: string, page: number = 1, perPage: number = 20): Promise<WallpaperItem[]> {
        try {
            const response = await fetch(
                `${BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=portrait`,
                { headers }
            );
            if (!response.ok) throw new Error('Failed to search photos');
            const data: PexelsSearchResponse = await response.json();
            return data.photos.map(photoToWallpaper);
        } catch (error) {
            console.error('Pexels search error:', error);
            return [];
        }
    },

    /**
     * Get popular videos for live wallpapers
     */
    async getPopularVideos(page: number = 1, perPage: number = 10): Promise<WallpaperItem[]> {
        try {
            const response = await fetch(`${VIDEO_URL}/popular?page=${page}&per_page=${perPage}`, { headers });
            if (!response.ok) throw new Error('Failed to fetch videos');
            const data: PexelsVideoResponse = await response.json();
            return data.videos.map(videoToWallpaper);
        } catch (error) {
            console.error('Pexels videos error:', error);
            return [];
        }
    },

    /**
     * Search for videos
     */
    async searchVideos(query: string, page: number = 1, perPage: number = 10): Promise<WallpaperItem[]> {
        try {
            const response = await fetch(
                `${VIDEO_URL}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=portrait`,
                { headers }
            );
            if (!response.ok) throw new Error('Failed to search videos');
            const data: PexelsVideoResponse = await response.json();
            return data.videos.map(videoToWallpaper);
        } catch (error) {
            console.error('Pexels video search error:', error);
            return [];
        }
    },

    /**
     * Get wallpapers by category
     */
    async getByCategory(category: string, page: number = 1): Promise<WallpaperItem[]> {
        const categoryQueries: Record<string, string> = {
            'nature': 'nature wallpaper landscape scenic beautiful',
            'abstract': 'abstract wallpaper art colorful pattern',
            'minimal': 'minimal wallpaper simple clean white',
            'dark': 'dark wallpaper moody night black amoled',
            'space': 'space wallpaper galaxy stars cosmos universe',
            'city': 'city wallpaper urban skyline night lights',
            'animals': 'animal wallpaper wildlife nature portrait',
            'ocean': 'ocean wallpaper sea waves blue water',
            'mountains': 'mountain wallpaper peak landscape scenic snow',
            'sunset': 'sunset wallpaper sunrise sky orange clouds',
            'flowers': 'flower wallpaper floral botanical colorful',
            'technology': 'technology wallpaper digital futuristic cyber',
            'art': 'art wallpaper painting creative artistic',
            'gradient': 'gradient wallpaper colorful smooth backdrop'
        };

        const query = categoryQueries[category.toLowerCase()] || `${category} wallpaper`;
        return this.searchPhotos(query, page, 20);
    },

    /**
     * Get a mix of photos and videos for the feed
     */
    async getMixedFeed(page: number = 1): Promise<WallpaperItem[]> {
        try {
            const [photos, videos] = await Promise.all([
                this.getCurated(page, 15),
                this.getPopularVideos(page, 5)
            ]);

            // Interleave photos and videos
            const mixed: WallpaperItem[] = [];
            let photoIndex = 0;
            let videoIndex = 0;

            while (photoIndex < photos.length || videoIndex < videos.length) {
                // Add 3 photos
                for (let i = 0; i < 3 && photoIndex < photos.length; i++) {
                    mixed.push(photos[photoIndex++]);
                }
                // Add 1 video
                if (videoIndex < videos.length) {
                    mixed.push(videos[videoIndex++]);
                }
            }

            return mixed;
        } catch (error) {
            console.error('Pexels mixed feed error:', error);
            return [];
        }
    }
};
