
import { GoogleGenAI, Type } from "@google/genai";
import { OceanState } from "../types";

// Sécurité pour éviter le ReferenceError: process is not defined dans le navigateur
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();

export async function getSeaWisdom(state: OceanState = 'CALM'): Promise<{ text: string; author: string }> {
  const statePrompts = {
    CALM: "calme, paisible, sereine",
    STORMY: "tempétueuse, sauvage, puissante",
    CLEAR: "limpide, lumineuse, pleine de vie"
  };

  // Si pas de clé API, on retourne directement le fallback sans tenter l'appel
  if (!apiKey) {
    return {
      text: "La mer est un miroir où l'âme cherche son reflet.",
      author: "Légende Marine"
    };
  }

  try {
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

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error fetching sea wisdom:", error);
    return {
      text: "Le silence de l'océan est une langue que peu comprennent.",
      author: "Anonyme"
    };
  }
}
