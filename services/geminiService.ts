import { GoogleGenAI, Type, Modality } from '@google/genai';
import type { Character, StyleReference, Scene } from '../types';

const getGoogleGenAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateSceneDescriptions = async (text: string, sceneCount: number): Promise<{ lyrics: string; description:string; setting: string }[]> => {
  const ai = getGoogleGenAI();
  const prompt = `You are an expert music video director. Split the following text into ${sceneCount} cohesive scenes. For each scene, provide:
1. "lyrics": The original chunk of the text for that scene.
2. "description": A vivid, one-sentence visual description of the main action.
3. "setting": A detailed, multi-sentence description of the background, environment, and any key objects. This will be used to ensure consistency across multiple shots.

Respond ONLY with a JSON array of objects with "lyrics", "description", and "setting" keys.

Text:
---
${text}
---
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              lyrics: { type: Type.STRING },
              description: { type: Type.STRING },
              setting: { type: Type.STRING },
            },
            required: ["lyrics", "description", "setting"],
          }
        },
      },
    });

    let jsonString = response.text.trim();
    
    const jsonMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
    }

    const result = JSON.parse(jsonString);
    
    if (Array.isArray(result) && result.every(item => item && typeof item.lyrics === 'string' && typeof item.description === 'string' && typeof item.setting === 'string')) {
        if (result.length === 0 && text.trim().length > 0) {
            throw new Error("The AI returned an empty list of scenes. Try adjusting your input.");
        }
        return result;
    }
    throw new Error("Invalid format received from API. Expected a JSON array of objects with 'lyrics', 'description', and 'setting' keys.");
  } catch (error) {
    console.error("Error generating scene descriptions:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to process lyrics with Gemini API: ${error.message}`);
    }
    throw new Error("Failed to process lyrics with Gemini API due to an unknown error.");
  }
};

export const analyzeStyle = async (styleReference: StyleReference): Promise<string> => {
    const ai = getGoogleGenAI();
    const prompt = "Analyze this image and describe its artistic style in a concise phrase suitable for an AI image generator. Focus on color, lighting, mood, and medium (e.g., 'Vibrant Ghibli-style anime, soft natural lighting, peaceful mood' or 'Dark, gritty neo-noir comic book art, high contrast, dramatic shadows'). Do not describe the people or objects in the image.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            data: styleReference.base64Image,
                            mimeType: styleReference.mimeType,
                        },
                    },
                ]
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error analyzing style:", error);
        throw new Error("Failed to analyze style with Gemini API.");
    }
};

export const generateSingleImage = async (
  sceneDescription: string,
  sceneSetting: string,
  shotType: string,
  characters: Character[],
  stylePrompt: string
): Promise<string> => {
  const ai = getGoogleGenAI();
  const characterNames = characters.map(c => `"${c.name}"`).join(' and ');
  
  const characterInstruction = characters.length > 0
    ? `The image must feature ${characterNames}. Their face, hair, outfit, and appearance MUST EXACTLY MATCH the provided reference images. This is a non-negotiable rule.`
    : ``;

  const prompt = `Your critical mission is to generate a cinematic image.
${characterInstruction}
The artistic style is: "${stylePrompt}".
The scene is set here: "${sceneSetting}".
The shot is a "${shotType}" showing this action: "${sceneDescription}".
Replicate the character's appearance from the reference images with 100% fidelity.`;


  const imageParts = characters.map(char => ({
    inlineData: {
      data: char.base64Image,
      mimeType: char.mimeType,
    },
  }));

  const MAX_RETRIES = 2;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: prompt },
            ...imageParts
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64ImageBytes: string = part.inlineData.data;
          return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
      }
      throw new Error(`No image data was returned for shot: ${shotType}`);
    } catch (error) {
      console.error(`Attempt ${attempt} failed for shot "${shotType}":`, error);
      
      // Immediately fail and propagate quota errors without retrying.
      if (error instanceof Error && error.message.toLowerCase().includes('quota')) {
          throw error;
      }

      if (attempt === MAX_RETRIES) {
          // After all retries, throw the last known error to give context.
          throw error;
      }
      // Wait before retrying for other transient errors
      await new Promise(res => setTimeout(res, 1000 * attempt));
    }
  }
  throw new Error(`No image was generated for shot: ${shotType}`);
};
