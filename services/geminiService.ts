/**
 * Local AI Service - No external API dependencies
 * Generates insights and tags using local logic
 */

// Curated insight templates for different wallpaper types
const insightTemplates = [
  "A captivating blend of colors and composition that draws the eye inward.",
  "This piece masterfully balances visual weight with negative space.",
  "Evokes a sense of calm through its thoughtful use of gradients.",
  "Bold contrasts create a striking visual statement.",
  "A harmonious fusion of form and function in digital art.",
  "Subtle textures add depth to this minimalist composition.",
  "The color palette speaks to both warmth and sophistication.",
  "Dynamic lines guide the viewer through the visual narrative.",
  "A serene escape captured in pixels and light.",
  "Modern aesthetics meet timeless design principles.",
  "Exquisite attention to detail elevates this piece.",
  "Nature-inspired tones bring organic warmth to the screen.",
  "A bold statement piece that commands attention.",
  "Soft gradients create a dreamlike atmosphere.",
  "Geometric precision meets artistic expression."
];

// Tag-based insight modifiers
const tagInsights: Record<string, string[]> = {
  nature: [
    "Nature's beauty translated into digital form.",
    "Organic elements create a refreshing visual experience.",
    "A celebration of the natural world's infinite patterns."
  ],
  abstract: [
    "Abstract forms challenge perception and invite contemplation.",
    "Bold abstraction pushes the boundaries of digital art.",
    "Non-representational beauty in its purest form."
  ],
  minimal: [
    "Less is more in this refined composition.",
    "Minimalism executed with exceptional precision.",
    "Clean lines and purposeful restraint define this piece."
  ],
  dark: [
    "Shadows and depth create an immersive atmosphere.",
    "Dark tones evoke mystery and sophistication.",
    "A moody aesthetic that transforms any screen."
  ],
  colorful: [
    "A vibrant explosion of hues that energizes the space.",
    "Colors dance together in perfect harmony.",
    "Bold color choices create visual excitement."
  ],
  gradient: [
    "Seamless color transitions create depth and movement.",
    "Gradients flow with natural elegance.",
    "Smooth color blending at its finest."
  ],
  space: [
    "Cosmic wonder captured in stunning detail.",
    "The vastness of space distilled into art.",
    "Celestial beauty that inspires wonder."
  ],
  geometric: [
    "Mathematical precision meets artistic vision.",
    "Geometry creates rhythm and visual interest.",
    "Structured forms build a compelling composition."
  ]
};

// Common tag suggestions based on keywords
const tagSuggestions: Record<string, string[]> = {
  sunset: ['Nature', 'Warm', 'Gradient', 'Sky'],
  mountain: ['Nature', 'Landscape', 'Scenic', 'Adventure'],
  ocean: ['Nature', 'Blue', 'Calm', 'Water'],
  forest: ['Nature', 'Green', 'Trees', 'Peaceful'],
  city: ['Urban', 'Architecture', 'Modern', 'Night'],
  abstract: ['Abstract', 'Digital Art', 'Modern', 'Creative'],
  minimal: ['Minimal', 'Clean', 'Simple', 'Modern'],
  dark: ['Dark', 'Moody', 'Night', 'AMOLED'],
  neon: ['Neon', 'Colorful', 'Vibrant', 'Night'],
  space: ['Space', 'Galaxy', 'Stars', 'Cosmic'],
  gradient: ['Gradient', 'Colorful', 'Smooth', 'Modern'],
  anime: ['Anime', 'Illustration', 'Art', 'Japanese'],
  car: ['Automotive', 'Luxury', 'Speed', 'Modern'],
  flower: ['Nature', 'Floral', 'Colorful', 'Spring']
};

export const geminiService = {
  /**
   * Generates creative insights for a wallpaper using local templates
   * No API calls - completely offline capable
   */
  async getWallpaperInsight(title: string, tags: string[]): Promise<string> {
    // Small delay to simulate async behavior
    await new Promise(resolve => setTimeout(resolve, 300));

    // Try to find a tag-specific insight
    const lowerTags = tags.map(t => t.toLowerCase());

    for (const tag of lowerTags) {
      for (const [key, insights] of Object.entries(tagInsights)) {
        if (tag.includes(key) || key.includes(tag)) {
          return insights[Math.floor(Math.random() * insights.length)];
        }
      }
    }

    // Fallback to general insights
    return insightTemplates[Math.floor(Math.random() * insightTemplates.length)];
  },

  /**
   * Generates a mood-based prompt for image generation
   */
  async getMoodPrompt(x: number, y: number): Promise<string> {
    const calmEnergetic = x < 0 ? 'calm, peaceful, minimalist' : 'vibrant, energetic, dynamic';
    const darkBright = y < 0 ? 'dark, moody, night tones' : 'bright, airy, light tones';

    return `A high-end 4K wallpaper with ${calmEnergetic} and ${darkBright} aesthetics.`;
  },

  /**
   * Suggests tags based on image analysis
   * Works completely offline
   */
  async suggestTags(base64Image: string): Promise<string[]> {
    try {
      // Analyze image locally using Canvas API
      const tags = await this.analyzeImageLocally(base64Image);

      // Ensure we have at least a few tags
      if (tags.length < 3) {
        return [...tags, 'Abstract', 'Digital Art', 'Wallpaper'];
      }

      return tags;
    } catch (error) {
      console.error('Local image analysis failed:', error);
      return ['Abstract', 'Digital Art', 'Wallpaper', 'Aesthetic', 'Modern'];
    }
  },

  /**
   * Internal helper to analyze image pixel data
   */
  async analyzeImageLocally(base64Image: string): Promise<string[]> {
    if (typeof window === 'undefined') return []; // Guard for SSR

    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (!ctx) {
            resolve([]);
            return;
          }

          // Resize to small dimension for performance (50x50 is enough for dominant colors)
          const size = 50;
          canvas.width = size;
          canvas.height = size;

          ctx.drawImage(img, 0, 0, size, size);

          const imageData = ctx.getImageData(0, 0, size, size);
          const data = imageData.data;

          let totalBrightness = 0;
          let totalSaturation = 0;
          const colorBuckets: Record<string, number> = {};

          // Analyze pixels
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Brightness (Luma)
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            totalBrightness += brightness;

            // Saturation (HSL)
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            const saturation = max === 0 ? 0 : delta / max;
            totalSaturation += saturation;

            // Hue Analysis for significant colors
            if (saturation > 0.15 && brightness > 0.1) { // Ignore gray/dark pixels for color detection
              let hue = 0;
              if (delta === 0) hue = 0;
              else if (max === r) hue = ((g - b) / delta) % 6;
              else if (max === g) hue = (b - r) / delta + 2;
              else hue = (r - g) / delta + 4;

              hue = Math.round(hue * 60);
              if (hue < 0) hue += 360;

              let colorName = '';
              if (hue >= 345 || hue < 15) colorName = 'Red';
              else if (hue >= 15 && hue < 45) colorName = 'Orange';
              else if (hue >= 45 && hue < 75) colorName = 'Yellow';
              else if (hue >= 75 && hue < 160) colorName = 'Green';
              else if (hue >= 160 && hue < 200) colorName = 'Cyan';
              else if (hue >= 200 && hue < 260) colorName = 'Blue';
              else if (hue >= 260 && hue < 290) colorName = 'Purple';
              else if (hue >= 290 && hue < 345) colorName = 'Pink';

              if (colorName) {
                colorBuckets[colorName] = (colorBuckets[colorName] || 0) + 1;
              }
            }
          }

          const pixelCount = size * size;
          const avgBrightness = totalBrightness / pixelCount;
          const avgSaturation = totalSaturation / pixelCount;

          const tags = new Set<string>();

          // Brightness tags
          if (avgBrightness < 0.25) tags.add('Dark');
          else if (avgBrightness < 0.4) tags.add('Moody');
          else if (avgBrightness > 0.75) tags.add('Bright');
          else if (avgBrightness > 0.6) tags.add('Light');

          // Saturation tags
          if (avgSaturation > 0.5) {
            tags.add('Vibrant');
            tags.add('Colorful');
          } else if (avgSaturation < 0.1) {
            tags.add('Monochrome');
            tags.add('Minimal');
          } else if (avgSaturation < 0.25) {
            tags.add('Muted');
          }

          // Add top 2 dominant colors
          const sortedColors = Object.entries(colorBuckets)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
            .map(([color]) => color);

          sortedColors.forEach(c => tags.add(c));

          resolve(Array.from(tags));

        } catch (e) {
          console.error("Analysis error", e);
          resolve([]);
        }
      };

      img.onerror = () => {
        console.warn("Image load failed");
        resolve([]);
      };

      // Handle base64 string
      let src = base64Image;
      if (!base64Image.startsWith('data:')) {
        // Simple heuristic to guess MIME type if missing
        // PNG usually starts with iVBORw0KGgo, JPEG with /9j/
        const isPng = base64Image.trim().startsWith('iV');
        const mime = isPng ? 'image/png' : 'image/jpeg';
        src = `data:${mime};base64,${base64Image}`;
      }
      img.src = src;
    });
  },

  /**
   * Suggests tags based on title text
   */
  suggestTagsFromTitle(title: string): string[] {
    const lowerTitle = title.toLowerCase();
    const suggested = new Set<string>();

    for (const [keyword, tags] of Object.entries(tagSuggestions)) {
      if (lowerTitle.includes(keyword)) {
        tags.forEach(tag => suggested.add(tag));
      }
    }

    // Always include some defaults if nothing matched
    if (suggested.size === 0) {
      return ['Wallpaper', 'Digital Art', 'Aesthetic'];
    }

    return Array.from(suggested).slice(0, 5);
  }
};
