
/**
 * Cloudinary Service for handling image uploads
 */
export const cloudinaryService = {
    /**
     * Uploads an image to Cloudinary using an unsigned upload preset
     * @param file - File object or base64 string
     */
    async uploadImage(file: File | string): Promise<string> {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'auraflow';

        if (!cloudName) {
            throw new Error('Cloudinary cloud name missing in .env');
        }

        // For Unsigned uploads, we only need the file and the preset.
        // DO NOT add API Key or Secret to the body or headers.
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                    // Strictly NO headers for unsigned uploads to avoid 401 CORS/Preflight issues
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error('Cloudinary API Error Details:', data);
                if (response.status === 401) {
                    throw new Error('Cloudinary 401 Unauthorized: Check if your Cloud Name is correct and the Preset is UNSIGNED.');
                }
                throw new Error(data.error?.message || 'Upload failed');
            }

            return data.secure_url;
        } catch (error: any) {
            console.error('Cloudinary Service Failure:', error.message);
            throw error;
        }
    },

    /**
     * Transforms a Cloudinary URL to a specific size/format
     */
    getOptimizedUrl(url: string, width = 800): string {
        if (!url.includes('cloudinary.com')) return url;
        // Insert transformation parameters after /upload/
        return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`);
    }
};
