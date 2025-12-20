
import { GoogleGenAI, Type } from "@google/genai";
import { OceanState } from "../types.ts";

/**
 * Service générant des citations poétiques.
 * Utilise une vérification de type pour process afin d'éviter les ReferenceError sur Vercel.
 */
export async function getSeaWisdom(state: OceanState = 'CALM'): Promise<{ text: string; author: string }> {
  const statePrompts = {
    CALM: "calme, paisible, sereine",
    STORMY: "tempétueuse, sauvage, puissante",
    CLEAR: "limpide, lumineuse, pleine de vie"
  };

  try {
    // Récupération sécurisée de la clé API
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
    
    if (!apiKey) {
      throw new Error("Clé API manquante");
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
            text: {
              type: Type.STRING,
              description: "Le texte de la citation.",
            },
            author: {
              type: Type.STRING,
              description: "L'auteur.",
            }
          },
          required: ["text", "author"]
        }
      }
    });

    const output = response.text;
    if (!output) throw new Error("Réponse IA vide");
    
    return JSON.parse(output.trim());
  } catch (error) {
    console.warn("Service de sagesse indisponible (Vérifiez la clé API dans Vercel) :", error);
    return {
      text: "Le silence de l'océan est une langue que peu comprennent.",
      author: "Anonyme"
    };
  }
}
