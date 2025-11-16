
// Fix: Defined all necessary types and removed component implementations.
export interface Character {
  id: string;
  name: string;
  base64Image: string;
  mimeType: string;
}

export interface StyleReference {
  name: string;
  base64Image: string;
  mimeType: string;
}

export interface GeneratedShot {
  shotType: string;
  imageUrl: string;
  error?: string;
}

export type GenerationStatus = 'idle' | 'queued' | 'generating' | 'completed' | 'failed';

export interface Scene {
  id: string;
  lyrics: string;
  description: string;
  setting: string;
  characterIds: string[];
  generatedShots: (GeneratedShot | null)[];
  generationStatus: GenerationStatus;
}

export type AspectRatio = '1:1' | '16:9' | '9:16';

export const SHOT_TYPES = [
  'Full Shot',
  'Medium Shot',
  'Ultra Close-up Shot',
  'Over the Shoulder Shot',
  'Low Angle Shot',
  'Object Close-up',
  'Aerial View',
  'Insert Shot',
  'Establishing Shot',
];

export const PRESET_STYLES = [
  'Cinematic',
  'Anime',
  '3D Render',
  'Noir',
  'Vaporwave',
  'Comic Book',
  'Fantasy Art',
  'Cyberpunk',
  'Minimalist',
  'Vintage Film',
  'Watercolor',
  'Gothic',
];
