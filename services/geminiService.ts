
import { GoogleGenAI, Type } from "@google/genai";

// Always use the process.env.API_KEY directly and use a named parameter for initialization
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Generates creative insights or descriptions for a wallpaper
   */
  async getWallpaperInsight(title: string, tags: string[]) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a short, artistic "creator's insight" (max 2 sentences) for a wallpaper titled "${title}" with tags: ${tags.join(', ')}. Use a professional designer's tone.`,
    });
    // Use the .text property directly as per the latest SDK guidelines
    return response.text;
  },

  /**
   * Generates a mood-based prompt for image generation
   */
  async getMoodPrompt(x: number, y: number) {
    // x: -1 (Calm) to 1 (Energetic)
    // y: -1 (Dark) to 1 (Bright)
    const calmEnergetic = x < 0 ? 'calm, peaceful, minimalist' : 'vibrant, energetic, chaotic';
    const darkBright = y < 0 ? 'dark, moody, night, deep shadows' : 'bright, airy, morning, high-key';
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a high-end 4K wallpaper prompt for an image that is both ${calmEnergetic} and ${darkBright}. Only return the prompt.`,
    });
    // Use the .text property directly
    return response.text;
  },

  /**
   * Analyzing an uploaded image to suggest tags
   */
  async suggestTags(base64Image: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: "Analyze this image and suggest 5 relevant wallpaper category tags. Format as a JSON array of strings." },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        // Fix: Use responseSchema for consistent JSON output structure
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
        },
      }
    });
    try {
      // Use the .text property directly and ensure it's trimmed
      const text = response.text?.trim() || '[]';
      return JSON.parse(text);
    } catch (e) {
      return ['Abstract', 'Digital Art'];
    }
  }
};
