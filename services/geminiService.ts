
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  getFoodRecommendations: async (mood: string, dietaryPrefs: string): Promise<any[]> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `I'm feeling ${mood}. My dietary preferences are ${dietaryPrefs}. Suggest 3 types of food I should order from a delivery app.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                foodType: { type: Type.STRING },
                reason: { type: Type.STRING },
                vibe: { type: Type.STRING }
              }
            }
          }
        }
      });
      const text = response.text;
      if (!text) return [];
      const jsonStr = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Gemini recommendation error:", error);
      return [];
    }
  },

  getSmartBundles: async (restaurantName: string, menuItems: any[]): Promise<any[]> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given the menu for ${restaurantName}: ${JSON.stringify(menuItems)}, suggest 2 "Smart Bundles" or meal deals that would appeal to customers. Give them catchy names.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                bundleName: { type: Type.STRING },
                itemsIncluded: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedPrice: { type: Type.NUMBER },
                description: { type: Type.STRING }
              }
            }
          }
        }
      });
      const text = response.text;
      if (!text) return [];
      const jsonStr = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Gemini bundle error:", error);
      return [];
    }
  },

  analyzeMenuPerformance: async (menuItems: any[]): Promise<any[]> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these menu items and suggest pricing optimizations or better names: ${JSON.stringify(menuItems)}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                itemId: { type: Type.STRING },
                suggestedName: { type: Type.STRING },
                suggestion: { type: Type.STRING }
              }
            }
          }
        }
      });
      const text = response.text;
      if (!text) return [];
      const jsonStr = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Gemini analysis error:", error);
      return [];
    }
  },

  predictETA: async (
    driverPos: { x: number, y: number }, 
    destPos: { x: number, y: number }, 
    traffic: string,
    historicalAvgMinutes: number
  ): Promise<{ estimatedMinutes: number, reasoning: string, confidenceScore: number }> => {
    try {
      const distance = Math.sqrt(Math.pow(destPos.x - driverPos.x, 2) + Math.pow(destPos.y - driverPos.y, 2));
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Predict estimated arrival time (ETA) for a luxury food delivery.
        
        TELEMETRY DATA:
        - Distance Vector: ${distance.toFixed(2)} units.
        - Real-time Traffic: ${traffic}.
        - Historical Average for this route: ${historicalAvgMinutes} minutes.
        
        Provide a realistic ETA in minutes, a brief reasoning of the environmental impact, and a confidence score (0-100) based on how closely current data matches historical norms.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedMinutes: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER }
            },
            required: ['estimatedMinutes', 'reasoning', 'confidenceScore']
          }
        }
      });
      const text = response.text;
      if (!text) return { estimatedMinutes: 15, reasoning: "Calculating...", confidenceScore: 50 };
      const jsonStr = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Gemini ETA prediction error:", error);
      return { estimatedMinutes: 15, reasoning: "Standard calculation applied.", confidenceScore: 40 };
    }
  }
};
