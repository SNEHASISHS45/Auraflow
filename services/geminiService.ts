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
   * Suggests tags based on title keywords
   * Works completely offline
   */
  async suggestTags(base64Image: string): Promise<string[]> {
    // Since we can't analyze images locally, return curated defaults
    const defaultTags = ['Abstract', 'Digital Art', 'Wallpaper', 'Aesthetic', 'Modern'];

    // Small delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 200));

    return defaultTags;
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
