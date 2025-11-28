import { GoogleGenAI, Type } from "@google/genai";
import { EarthFact, LocationInfo } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const fetchEarthFact = async (topic: string): Promise<EarthFact> => {
  if (!apiKey) return getMockFact();

  const prompt = `Generate a short, fascinating scientific fact about Earth related to: ${topic}. Keep it strictly under 40 words. Futuristic tone.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            category: { type: Type.STRING }
          }
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as EarthFact;
  } catch (error) {
    return getMockFact();
  }
};

export const analyzeLocation = async (lat: number, lon: number): Promise<LocationInfo | null> => {
  if (!apiKey) return null;

  // Use Google Search tool for real-time location data
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide detailed real-time info for the location at Latitude: ${lat}, Longitude: ${lon}. 
      Include current weather, estimated population of the nearest city/region, and 1 major landmark.
      Return valid JSON.`,
      config: {
        tools: [{ googleSearch: {} }], // Enable search for live info
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the nearest city or region" },
            country: { type: Type.STRING },
            weather: { type: Type.STRING, description: "Current weather conditions (temp, sky)" },
            population: { type: Type.STRING, description: "Population count text" },
            landmarks: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as LocationInfo;
  } catch (error) {
    console.error("Location analysis failed:", error);
    // Fallback if search fails or tool not allowed
    return {
      name: "Unknown Region",
      country: "Earth",
      weather: "Data Unavailable",
      population: "Unknown",
      landmarks: ["N/A"]
    };
  }
};

export const fetchHistoricalEra = async (year: number): Promise<EarthFact> => {
  if (!apiKey) return getMockFact();

  const era = year < 0 ? `${Math.abs(year)} Million Years Ago` : `Year ${year}`;
  const prompt = `Describe Earth's condition during: ${era}. Focus on continental arrangement, climate, or major life forms. Under 40 words.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['history'] }
          }
        }
      }
    });
    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as EarthFact;
  } catch (error) {
    return { title: "Time Warp Error", content: "Chronological data unavailable.", category: "history" };
  }
};

const getMockFact = (): EarthFact => ({
  title: "System Offline",
  content: "Unable to connect to Planetary Core AI. Check API Key.",
  category: "general"
});