
import { GoogleGenAI, Type } from "@google/genai";
import { OceanState } from "../types.ts";

/**
 * Service generating poetic ocean-themed quotes using Gemini AI.
 * Adheres to @google/genai best practices for initialization and response handling.
 */
export async function getSeaWisdom(state: OceanState = 'CALM'): Promise<{ text: string; author: string }> {
  const statePrompts = {
    CALM: "calme, paisible, sereine",
    STORMY: "tempétueuse, sauvage, puissante",
    CLEAR: "limpide, lumineuse, pleine de vie"
  };

  try {
    // Initialize AI directly within the function using process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
              description: "The poetic quote text.",
            },
            author: {
              type: Type.STRING,
              description: "The author of the quote.",
            }
          },
          required: ["text", "author"]
        }
      }
    });

    // Directly access the .text property of GenerateContentResponse
    const output = response.text;
    if (!output) throw new Error("Empty AI response");
    
    return JSON.parse(output.trim());
  } catch (error) {
    console.warn("Wisdom AI currently unavailable:", error);
    return {
      text: "Le silence de l'océan est une langue que peu comprennent.",
      author: "Anonyme"
    };
  }
}
