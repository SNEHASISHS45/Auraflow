
import { GoogleGenAI, Type } from "@google/genai";

// Use Vite's environment variable system
const apiKey = (import.meta.env?.VITE_GEMINI_API_KEY as string) || '';
const ai = apiKey && apiKey !== 'YOUR_API_KEY_HERE' ? new GoogleGenAI({ apiKey }) : null;

export const geminiService = {
  /**
   * Generates creative insights or descriptions for a wallpaper
   */
  async getWallpaperInsight(title: string, tags: string[]) {
    if (!ai) return "An artistic view of digital harmony and aesthetic flow.";

    try {
      // @ts-ignore - The @google/genai package has a different structure than @google/generative-ai
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Provide a short, artistic "creator's insight" (max 2 sentences) for a wallpaper titled "${title}" with tags: ${tags.join(', ')}. Use a professional designer's tone.`,
      });
      return response.text;
    } catch (e) {
      console.error("Gemini Insight Error:", e);
      return "Captured in a moment of pure inspiration, blending light and form.";
    }
  },

  /**
   * Generates a mood-based prompt for image generation
   */
  async getMoodPrompt(x: number, y: number) {
    if (!ai) return "A beautiful minimalist digital wallpaper";

    const calmEnergetic = x < 0 ? 'calm, peaceful, minimalist' : 'vibrant, energetic, chaotic';
    const darkBright = y < 0 ? 'dark, moody, night, deep shadows' : 'bright, airy, morning, high-key';

    try {
      // @ts-ignore
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `Generate a high-end 4K wallpaper prompt for an image that is both ${calmEnergetic} and ${darkBright}. Only return the prompt.`,
      });
      return response.text;
    } catch (e) {
      return `A high-end 4K wallpaper with ${calmEnergetic} and ${darkBright} vibes.`;
    }
  },

  /**
   * Analyzing an uploaded image to suggest tags
   */
  async suggestTags(base64Image: string) {
    if (!ai) return ['Abstract', 'Digital Art', 'Minimalist'];

    try {
      // @ts-ignore
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: {
          parts: [
            { text: "Analyze this image and suggest 5 relevant wallpaper category tags. Format as a JSON array of strings." },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.split(',')[1] || base64Image
              }
            }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
            },
          },
        }
      });

      const text = response.text?.trim() || '[]';
      return JSON.parse(text);
    } catch (e) {
      console.error("Gemini Tag Error:", e);
      return ['Abstract', 'Digital Art', 'Nature', 'Modern', 'Aesthetic'];
    }
  }
};
