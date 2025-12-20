
import { GoogleGenAI, Type } from "@google/genai";
import { OceanState } from "../types.ts";

/**
 * Service générant des citations poétiques via Gemini.
 * Accès sécurisé à la clé API pour le navigateur.
 */
export async function getSeaWisdom(state: OceanState = 'CALM'): Promise<{ text: string; author: string }> {
  const statePrompts = {
    CALM: "calme, paisible, sereine",
    STORMY: "tempétueuse, sauvage, puissante",
    CLEAR: "limpide, lumineuse, pleine de vie"
  };

  try {
    // Vérification sécurisée de l'existence de la clé API
    let apiKey = "";
    try {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        apiKey = process.env.API_KEY;
      }
    } catch (e) {
      console.warn("L'objet process n'est pas accessible.");
    }
    
    if (!apiKey) {
      return {
        text: "La mer est un miroir où l'âme cherche son reflet.",
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
    return output ? JSON.parse(output.trim()) : { text: "Silence de l'abysse...", author: "Océan" };
  } catch (error) {
    console.error("Gemini Wisdom error:", error);
    return {
      text: "Le silence de l'océan est une langue que peu comprennent.",
      author: "Anonyme"
    };
  }
}
