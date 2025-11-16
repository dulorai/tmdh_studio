
import { GoogleGenAI, Type, Modality } from '@google/genai';
import type { Character, StyleReference, Scene, AspectRatio } from '../types';

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

const shotTypeDescriptions: { [key: string]: string } = {
  'Full Shot': 'A cinematic full shot capturing the character from head to toe.',
  'Medium Shot': 'A cinematic medium shot capturing the character from the waist up.',
  'Ultra Close-up Shot': "Ultra Close-Up (Emotional Focus): This shot exposes the character's inner world. It focuses on the eyes, lips, or a subtle movement to capture an emotion that can't be spoken, heightening tension or tenderness.",
  'Over the Shoulder Shot': 'A cinematic over-the-shoulder shot, looking past one character towards another or the main point of interest.',
  'Low Angle Shot': 'A cinematic low-angle shot, looking up at the character to make them seem powerful or significant.',
  'Object Close-up': "A tight, detailed shot that focuses on a single symbolic or narrative detail, such as a key prop, a character's hands, or a specific object they are interacting with. Directs the audience's attention to something of significance.",
  'Aerial View': 'A cinematic aerial view shot from high above, looking down on the scene.',
  'Insert Shot': "A short, detailed shot isolating an object, gesture, or small action crucial to the scene’s meaning or rhythm. It anchors emotion or mood—like a hand gripping a photo or rain on a windowpane—serving as a breath between the main action.",
  'Establishing Shot': 'A very wide establishing shot that shows the entire setting and context.',
};

export const generateSingleImage = async (
  sceneDescription: string,
  sceneSetting: string,
  shotType: string,
  characters: Character[],
  stylePrompt: string,
  aspectRatio: AspectRatio
): Promise<string> => {
  const ai = getGoogleGenAI();
  const characterNames = characters.map(c => `"${c.name}"`).join(' and ');
  
  // 1. Build Character Instruction for Prompt
  let characterInstruction = characters.length > 0
    ? `The scene features ${characterNames}. **Crucial Rule:** You MUST use the reference images provided previously. Ensure ${characterNames} match their respective reference images exactly in face, hair, and clothing.`
    : `No specific characters are required in this shot.`;

  let finalSceneDescription = sceneDescription;
  
  // Handle specific shot types that might need specialized descriptions
  if (shotType === 'Object Close-up') {
    try {
        const detailedShotPrompt = `You are a cinematographer. Analyze the following scene description and describe the perfect 'Object Close-up' shot. This shot should focus on a single, symbolic, and narratively important detail. This could be a key object, a character's hand performing an action, or a specific feature of the environment. Your response should be a concise, descriptive phrase suitable for an AI image generator.

Example:
- Scene: "She nervously waits, twisting the ring on her finger." -> Response: "A macro shot of a hand, fingers anxiously twisting a silver ring."

Scene Description: "${sceneDescription}"

Respond with ONLY the descriptive phrase.`;

        const detailedResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: detailedShotPrompt,
        });
        
        const detailedShotDescription = detailedResponse.text.trim();

        if (detailedShotDescription) {
            console.log(`Generated detailed close-up description: ${detailedShotDescription}`);
            finalSceneDescription = detailedShotDescription;
            characterInstruction = `This is a close-up detail shot. If a character's feature (like a hand or eye) is part of the shot, its appearance MUST match the provided reference images. Otherwise, focus solely on the described detail.`;
        }
    } catch (e) {
        console.error("Could not generate detailed close-up description, using original description.", e);
    }
  } else if (shotType === 'Insert Shot') {
    try {
        const insertShotPrompt = `You are a film editor. Analyze the following scene description and suggest a powerful 'Insert Shot'. This shot should be a brief, detailed close-up of a small action, object, or gesture that anchors the emotion or mood without directly advancing the plot. Think of it as a breath between the main action.

Example:
- Scene: "He waits nervously for the news, tapping his fingers on the table." -> Response: "A single drop of rain tracing a path down a dark windowpane."

Scene Description: "${sceneDescription}"

Respond with ONLY the descriptive phrase for the insert shot.`;
        
        const detailedResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: insertShotPrompt,
        });

        const insertShotDescription = detailedResponse.text.trim();
        
        if (insertShotDescription) {
            console.log(`Generated insert shot description: ${insertShotDescription}`);
            finalSceneDescription = insertShotDescription;
            characterInstruction = `This is a detail-focused insert shot. If a character's feature (like a hand or eye) is part of the shot, its appearance MUST match the provided reference images. Otherwise, focus solely on the described detail.`;
        }
    } catch (e) {
        console.error("Could not generate detailed insert shot description, using original description.", e);
    }
  }

  const shotInstruction = shotTypeDescriptions[shotType] || `A standard ${shotType}.`;
  
  // Strengthened Aspect Ratio Logic
  let ratioSignal = 'SQUARE (1:1)';
  let ratioDesc = 'The image MUST be equal width and height.';
  if (aspectRatio === '16:9') {
      ratioSignal = 'WIDE CINEMATIC LANDSCAPE (16:9)';
      ratioDesc = 'CRITICAL: The image MUST be significantly WIDER than it is tall. DO NOT GENERATE A SQUARE IMAGE.';
  } else if (aspectRatio === '9:16') {
      ratioSignal = 'TALL VERTICAL PORTRAIT (9:16)';
      ratioDesc = 'CRITICAL: The image MUST be significantly TALLER than it is wide. DO NOT GENERATE A SQUARE IMAGE.';
  }

  const mainPrompt = `*** CRITICAL COMMAND: GENERATE IMAGE IN ${ratioSignal} ASPECT RATIO ***
${ratioDesc}
IGNORE the aspect ratio of any provided reference images; they are for character/style details ONLY.

**Objective:** Create a single, high-quality cinematic image.

**Artistic Style:**
- ${stylePrompt}

**Setting / Environment:**
- ${sceneSetting}

**Shot Composition & Action:**
- **Shot Type:** ${shotType} (${shotInstruction})
- **Action/Subject:** The shot must depict: "${finalSceneDescription}"

**Character(s):**
- ${characterInstruction}

[FINAL CHECK: OUTPUT MUST BE ${ratioSignal}]`;

  // 2. Build interleaved content parts (Reference Images first, then main prompt)
  const contentParts: any[] = [];

  if (characters.length > 0) {
      contentParts.push({ text: "REFERENCE MATERIAL (Use ONLY for character details, NOT for image aspect ratio):\n" });
      characters.forEach(char => {
          contentParts.push({ text: `ID Reference for character named: "${char.name}"` });
          contentParts.push({
              inlineData: {
                  data: char.base64Image,
                  mimeType: char.mimeType,
              },
          });
      });
      contentParts.push({ text: "END OF REFERENCE MATERIAL.\n\n" });
  }
  
  contentParts.push({ text: mainPrompt });

  const MAX_RETRIES = 2;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: contentParts,
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

export const generateCharacterImage = async (prompt: string): Promise<{ base64Image: string; mimeType: string; }> => {
  const ai = getGoogleGenAI();
  const fullPrompt = `A full-body character design reference image. Description: "${prompt}". The character must be completely visible from head to toe, standing in a neutral pose, centered against a pure solid white background. High detail. Square 1:1 aspect ratio.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return {
          base64Image: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        };
      }
    }
    throw new Error('No image data was returned from the API.');
  } catch (error) {
    console.error("Error generating character image:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate character with Gemini API: ${error.message}`);
    }
    throw new Error("Failed to generate character with Gemini API due to an unknown error.");
  }
};
