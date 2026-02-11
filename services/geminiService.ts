/**
 * Gemini AI Service — Powered by Google AI Studio
 * Uses Gemini 2.0 Flash with Vision for image analysis, lens, and smart tagging
 */
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const API_KEY = import.meta.env?.VITE_GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ImageAnalysis {
  title: string;
  description: string;
  tags: string[];
  colors: { name: string; hex: string }[];
  mood: string;
  category: string;
  objects: string[];
}

export interface LensResult {
  description: string;
  colors: { name: string; hex: string }[];
  objects: string[];
  style: string;
  searchTerms: string[];
}

// ─── Fallback templates ──────────────────────────────────────────────────────

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

// ─── Local Aesthetic Fingerprints ────────────────────────────────────────────

const AESTHETIC_PRESETS: Record<string, {
  tags: string[],
  prefixes: string[],
  suffixes: string[],
  category: string
}> = {
  CYBERPUNK: {
    tags: ['Cyberpunk', 'Neon', 'Futuristic', 'Night', 'Vibrant'],
    prefixes: ['Neon', 'Synth', 'Cyber', 'Pulse', 'Techno', 'Chrome'],
    suffixes: ['City', 'Drift', 'Core', 'Link', 'Phase', 'Shard'],
    category: 'Cinema'
  },
  OCEANIC: {
    tags: ['Ocean', 'Marine', 'Blue', 'Deep', 'Liquid', 'Calm'],
    prefixes: ['Azure', 'Deep', 'Sapphire', 'Aquatic', 'Coastal', 'Tidal'],
    suffixes: ['Abyss', 'Current', 'Tide', 'Drift', 'Flow', 'Mist'],
    category: 'Nature'
  },
  VERDANT: {
    tags: ['Nature', 'Forest', 'Organic', 'Green', 'Fresh', 'Spring'],
    prefixes: ['Emerald', 'Leafy', 'Floral', 'Wild', 'Verdant', 'Ivy'],
    suffixes: ['Grove', 'Moss', 'Bloom', 'Peak', 'Glade', 'Root'],
    category: 'Nature'
  },
  ARCTIC: {
    tags: ['Snow', 'Winter', 'Cold', 'White', 'Ice', 'Frost'],
    prefixes: ['Glacial', 'Frozen', 'Arctic', 'Polar', 'Silver', 'Crystal'],
    suffixes: ['Drift', 'Glow', 'Ice', 'Peak', 'Mist', 'Void'],
    category: 'Nature'
  },
  SOLAR: {
    tags: ['Warm', 'Sunset', 'Golden', 'Dusk', 'Energy', 'Fire'],
    prefixes: ['Golden', 'Amber', 'Solar', 'Radiant', 'Crimson', 'Eternal'],
    suffixes: ['Dusk', 'Glow', 'Flare', 'Rise', 'Horizon', 'Ray'],
    category: 'Nature'
  },
  MONOCHROME: {
    tags: ['B&W', 'Minimal', 'Classic', 'Photography', 'Graphic'],
    prefixes: ['Silent', 'Dark', 'Classic', 'Steel', 'Iron', 'Shadow'],
    suffixes: ['Void', 'Lines', 'Form', 'Edge', 'Contrast', 'Still'],
    category: 'Minimal'
  },
  COSMIC: {
    tags: ['Space', 'Galaxy', 'Stars', 'Nebula', 'Celestial'],
    prefixes: ['Star', 'Cosmic', 'Nebula', 'Galactic', 'Astral', 'Void'],
    suffixes: ['Dust', 'Nova', 'Cluster', 'Belt', 'Orbit', 'System'],
    category: 'Space'
  }
};

// ─── Helper: Convert base64 to Gemini inline data ───────────────────────────

function toInlineData(base64Image: string) {
  let data = base64Image;
  let mimeType = 'image/jpeg';

  if (base64Image.startsWith('data:')) {
    const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      data = match[2];
    } else {
      data = base64Image.split(',')[1] || base64Image;
    }
  } else {
    const isPng = base64Image.trim().startsWith('iV');
    mimeType = isPng ? 'image/png' : 'image/jpeg';
  }

  return { inlineData: { data, mimeType } };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const geminiService = {

  // ── Full Image Analysis (for Upload) ──────────────────────────────────────
  async analyzeImage(base64Image: string): Promise<ImageAnalysis> {
    if (model) {
      try {
        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              {
                text: `Analyze this image for a wallpaper app. Return a JSON object with:
- "title": a creative, short title (3-5 words)
- "description": a one-sentence artistic description
- "tags": array of 5-8 relevant tags (capitalized)
- "colors": array of 3-5 dominant colors, each as {"name": "Color Name", "hex": "#RRGGBB"}
- "mood": one word describing the mood (e.g. "Serene", "Energetic", "Dark")
- "category": one of: Nature, Abstract, Minimal, Dark, Space, Anime, Gaming, Urban, Gradient, Cinema
- "objects": array of 3-6 key subjects/objects identified

Return ONLY valid JSON, no markdown.`
              },
              toInlineData(base64Image)
            ]
          }]
        });

        const text = result.response.text().trim();
        // Parse JSON — handle possible markdown code fences
        const jsonStr = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(jsonStr) as ImageAnalysis;
        return parsed;
      } catch (error) {
        console.warn("Gemini Vision analysis failed, using local fallback:", error);
      }
    }

    // Fallback: local pixel analysis
    return this.analyzeImageLocally(base64Image);
  },

  // ── Lens Description (for Detail page) ────────────────────────────────────
  async describeForLens(imageUrl: string): Promise<LensResult> {
    if (model) {
      try {
        // Fetch image and convert to base64
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              {
                text: `You are an expert art critic and visual analyst. Analyze this wallpaper image in depth. Return a JSON object with:
- "description": a rich, 2-3 sentence artistic description of what you see
- "colors": array of 4-6 dominant colors, each as {"name": "Color Name", "hex": "#RRGGBB"}
- "objects": array of all identifiable subjects, objects, and elements (4-8 items)
- "style": the artistic style in 2-3 words (e.g. "Cyberpunk Neon", "Minimalist Gradient")
- "searchTerms": array of 5-8 keywords someone could use to find similar wallpapers

Return ONLY valid JSON, no markdown.`
              },
              toInlineData(base64)
            ]
          }]
        });

        const text = result.response.text().trim();
        const jsonStr = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr) as LensResult;
      } catch (error) {
        console.warn("Gemini Lens analysis failed:", error);
      }
    }

    // Fallback using local analysis
    const local = await this.analyzeImageLocally(imageUrl.startsWith('data:') ? imageUrl : ''); // Assuming we might not have base64 here if it failed to fetch
    return {
      description: local.description,
      colors: local.colors,
      objects: local.objects,
      style: local.category + ' Art',
      searchTerms: local.tags
    };
  },

  // ── Generate Search Terms from Camera/Image (for Lens page) ───────────────
  async generateSearchTerms(base64Image: string): Promise<string[]> {
    if (model) {
      try {
        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              {
                text: `Look at this image. Generate 6-10 search keywords a user might use to find wallpapers similar to what's shown in this image. Include both specific subjects and general aesthetic terms. Return ONLY a JSON array of strings, no markdown.`
              },
              toInlineData(base64Image)
            ]
          }]
        });

        const text = result.response.text().trim();
        const jsonStr = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr) as string[];
      } catch (error) {
        console.warn("Gemini search term generation failed:", error);
      }
    }

    return ['aesthetic', 'wallpaper', 'digital art', 'abstract', 'modern'];
  },

  // ── Wallpaper Insight (existing, upgraded) ────────────────────────────────
  async getWallpaperInsight(title: string, tags: string[]): Promise<string> {
    if (model) {
      try {
        const prompt = `Generate a short, creative, and engaging insight (one sentence) for a wallpaper with the title "${title}" and tags: ${tags.join(', ')}. Return only the insight text.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text) return text.trim();
      } catch (error) {
        console.warn("Gemini API failed, falling back to local insights", error);
      }
    }

    // Local fallback
    const lowerTags = tags.map(t => t.toLowerCase());
    for (const tag of lowerTags) {
      for (const [key, insights] of Object.entries(tagInsights)) {
        if (tag.includes(key) || key.includes(tag)) {
          return insights[Math.floor(Math.random() * insights.length)];
        }
      }
    }
    return insightTemplates[Math.floor(Math.random() * insightTemplates.length)];
  },

  // ── Mood Prompt ───────────────────────────────────────────────────────────
  async getMoodPrompt(x: number, y: number): Promise<string> {
    const calmEnergetic = x < 0 ? 'calm, peaceful, minimalist' : 'vibrant, energetic, dynamic';
    const darkBright = y < 0 ? 'dark, moody, night tones' : 'bright, airy, light tones';
    return `A high-end 4K wallpaper with ${calmEnergetic} and ${darkBright} aesthetics.`;
  },

  // ── Smart Tag Suggestion (upgraded with Vision) ───────────────────────────
  async suggestTags(base64Image: string): Promise<string[]> {
    // Try Gemini Vision first
    if (model) {
      try {
        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              {
                text: `Analyze this image and suggest 5-8 relevant tags for a wallpaper app. Return ONLY a JSON array of capitalized tag strings, like ["Nature", "Sunset", "Warm"]. No markdown.`
              },
              toInlineData(base64Image)
            ]
          }]
        });

        const text = result.response.text().trim();
        const jsonStr = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        const tags = JSON.parse(jsonStr) as string[];
        if (Array.isArray(tags) && tags.length >= 3) return tags;
      } catch (error) {
        console.warn("Gemini tag suggestion failed, using local fallback:", error);
      }
    }

    // Fallback: local pixel analysis
    try {
      const analysis = await this.analyzeImageLocally(base64Image);
      return analysis.tags;
    } catch (error) {
      console.error('Local image analysis failed:', error);
      return ['Abstract', 'Digital Art', 'Wallpaper', 'Aesthetic', 'Modern'];
    }
  },

  // ── Local Pixel Analysis (canvas fallback) ────────────────────────────────
  async analyzeImageLocally(base64Image: string): Promise<ImageAnalysis> {
    const defaultResult: ImageAnalysis = {
      title: 'Aura Composition',
      description: insightTemplates[Math.floor(Math.random() * insightTemplates.length)],
      tags: ['Abstract', 'Digital Art', 'Wallpaper'],
      colors: [{ name: 'Deep Purple', hex: '#6750A4' }],
      mood: 'Aesthetic',
      category: 'Abstract',
      objects: ['Digital Art']
    };

    if (typeof window === 'undefined' || !base64Image) return defaultResult;

    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) { resolve(defaultResult); return; }

          const size = 64; // Slightly larger for better heuristics
          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);

          const imageData = ctx.getImageData(0, 0, size, size);
          const data = imageData.data;

          let totalBrightness = 0;
          let totalSaturation = 0;
          const colorBuckets: Record<string, { count: number, hex: string }> = {};

          // Heuristic counters
          let highContrastCount = 0;
          let amoledBlackCount = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
            const brightness = luminance / 255;
            totalBrightness += brightness;

            if (luminance < 10) amoledBlackCount++;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            const saturation = max === 0 ? 0 : delta / max;
            totalSaturation += saturation;

            if (delta > 120) highContrastCount++;

            const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

            if (saturation > 0.1 || brightness > 0.05) {
              let hue = 0;
              if (delta === 0) hue = 0;
              else if (max === r) hue = ((g - b) / delta) % 6;
              else if (max === g) hue = (b - r) / delta + 2;
              else hue = (r - g) / delta + 4;
              hue = Math.round(hue * 60);
              if (hue < 0) hue += 360;

              let colorName = '';
              if (hue >= 345 || hue < 20) colorName = 'Red';
              else if (hue >= 20 && hue < 45) colorName = 'Orange';
              else if (hue >= 45 && hue < 70) colorName = 'Yellow';
              else if (hue >= 70 && hue < 160) colorName = 'Green';
              else if (hue >= 160 && hue < 200) colorName = 'Cyan';
              else if (hue >= 200 && hue < 265) colorName = 'Blue';
              else if (hue >= 265 && hue < 295) colorName = 'Purple';
              else if (hue >= 295 && hue < 345) colorName = 'Pink';

              if (colorName) {
                if (!colorBuckets[colorName]) colorBuckets[colorName] = { count: 0, hex };
                colorBuckets[colorName].count++;
              }
            }
          }

          const pixelCount = size * size;
          const avgBrightness = totalBrightness / pixelCount;
          const avgSaturation = totalSaturation / pixelCount;
          const tags = new Set<string>();

          // --- Style Selection Fingerprinting ---
          let styleKey = 'MONOCHROME';
          const rAmount = colorBuckets['Red']?.count || 0;
          const bAmount = colorBuckets['Blue']?.count || 0;
          const cAmount = colorBuckets['Cyan']?.count || 0;
          const pAmount = colorBuckets['Purple']?.count || 0;
          const gAmount = colorBuckets['Green']?.count || 0;
          const yAmount = colorBuckets['Yellow']?.count || 0;
          const oAmount = colorBuckets['Orange']?.count || 0;

          if (amoledBlackCount > pixelCount * 0.4 && (pAmount + rAmount + cAmount) > pixelCount * 0.1) {
            styleKey = 'CYBERPUNK';
          } else if (gAmount > pixelCount * 0.25) {
            styleKey = 'VERDANT';
          } else if (cAmount + bAmount > pixelCount * 0.3) {
            styleKey = 'OCEANIC';
          } else if (amoledBlackCount > pixelCount * 0.3 && avgSaturation < 0.2) {
            styleKey = 'COSMIC';
          } else if (yAmount + oAmount + rAmount > pixelCount * 0.3) {
            styleKey = 'SOLAR';
          } else if (avgBrightness > 0.8 && avgSaturation < 0.1) {
            styleKey = 'ARCTIC';
          } else if (avgSaturation < 0.1) {
            styleKey = 'MONOCHROME';
          } else {
            // Default to a mixed abstract style
            styleKey = avgBrightness < 0.4 ? 'COSMIC' : 'SOLAR';
          }

          const aesthetic = AESTHETIC_PRESETS[styleKey];
          aesthetic.tags.forEach(t => tags.add(t));

          if (avgBrightness < 0.2) tags.add('Dark Mode');
          if (highContrastCount > pixelCount * 0.2) tags.add('High-Contrast');
          if (avgSaturation > 0.6) tags.add('Vibrant');

          const sortedColors = Object.entries(colorBuckets)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 4);

          sortedColors.forEach(([name]) => tags.add(name));

          const finalColors = sortedColors.map(([name, data]) => ({ name, hex: data.hex }));
          if (finalColors.length === 0) finalColors.push({ name: 'Primary', hex: '#6750A4' });

          // Smart Naming
          const pre = aesthetic.prefixes[Math.floor(Math.random() * aesthetic.prefixes.length)];
          const suf = aesthetic.suffixes[Math.floor(Math.random() * aesthetic.suffixes.length)];
          const title = `${pre} ${suf} Aura`;

          resolve({
            title,
            description: insightTemplates[Math.floor(Math.random() * insightTemplates.length)],
            tags: Array.from(tags).slice(0, 10),
            colors: finalColors,
            mood: avgBrightness > 0.6 ? 'Ethereal' : avgBrightness < 0.3 ? 'Nocturnal' : 'Dynamic',
            category: aesthetic.category,
            objects: [aesthetic.category, styleKey.toLowerCase().replace(/^\w/, c => c.toUpperCase())]
          });
        } catch (e) {
          console.error("Local Heuristic error", e);
          resolve(defaultResult);
        }
      };

      img.onerror = () => { resolve(defaultResult); };
      img.src = base64Image;
    });
  },

  // ── Title-based Tag Suggestion ────────────────────────────────────────────
  suggestTagsFromTitle(title: string): string[] {
    const lowerTitle = title.toLowerCase();
    const suggested = new Set<string>();
    for (const [keyword, tags] of Object.entries(tagSuggestions)) {
      if (lowerTitle.includes(keyword)) {
        tags.forEach(tag => suggested.add(tag));
      }
    }
    if (suggested.size === 0) return ['Wallpaper', 'Digital Art', 'Aesthetic'];
    return Array.from(suggested).slice(0, 5);
  }
};
