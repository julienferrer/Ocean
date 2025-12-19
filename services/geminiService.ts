
import { GoogleGenAI, Type } from "@google/genai";
import { OceanState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getSeaWisdom(state: OceanState = 'CALM'): Promise<{ text: string; author: string }> {
  const statePrompts = {
    CALM: "calme, paisible, sereine",
    STORMY: "tempétueuse, sauvage, puissante",
    CLEAR: "limpide, lumineuse, pleine de vie"
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Donne-moi une citation courte, poétique et mystérieuse sur une mer ${statePrompts[state]} en français. Format JSON avec 'text' et 'author'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            author: { type: Type.STRING }
          },
          required: ["text", "author"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error fetching sea wisdom:", error);
    return {
      text: "La mer est un espace de rigueur et de liberté.",
      author: "Victor Hugo"
    };
  }
}
