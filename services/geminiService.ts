
import { GoogleGenAI, Type } from "@google/genai";
import { OceanState } from "../types.ts";

/**
 * Service de génération de sagesse marine.
 * Sécurisé pour l'exécution dans le navigateur sans 'process' global.
 */
export async function getSeaWisdom(state: OceanState = 'CALM'): Promise<{ text: string; author: string }> {
  const statePrompts = {
    CALM: "calme, paisible, sereine",
    STORMY: "tempétueuse, sauvage, puissante",
    CLEAR: "limpide, lumineuse, pleine de vie"
  };

  try {
    // Tentative d'accès sécurisé à la clé API
    let apiKey = "";
    try {
      // @ts-ignore
      const env = (typeof process !== 'undefined' && process.env) || (globalThis as any).process?.env || {};
      apiKey = env.API_KEY || "";
    } catch (e) {
      console.warn("Environnement process inaccessible.");
    }
    
    if (!apiKey) {
      return {
        text: "L'horizon est une promesse que l'eau fait au ciel.",
        author: "Légende Marine"
      };
    }

    const ai = new GoogleGenAI({ apiKey });
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

    const output = response.text;
    return output ? JSON.parse(output.trim()) : { text: "Le chant des profondeurs...", author: "Océan" };
  } catch (error) {
    console.error("Gemini Wisdom error:", error);
    return {
      text: "Le silence de l'océan est une langue que peu comprennent.",
      author: "Anonyme"
    };
  }
}
