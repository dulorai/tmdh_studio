import React from 'react';
import type { Character, StyleReference } from '../types';
import { fileToBase64 } from '../utils/fileUtils';
import { UploadIcon, UserPlusIcon, TrashIcon } from './icons';
import Loader from './Loader';

interface Step1_InputProps {
  lyrics: string;
  setLyrics: React.Dispatch<React.SetStateAction<string>>;
  sceneCount: number;
  setSceneCount: React.Dispatch<React.SetStateAction<number>>;
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  styleReference: StyleReference | null;
  onStyleUpload: (file: File) => void;
  isAnalyzingStyle: boolean;
  statusMessage: string;
  isAboutToGenerate: boolean;
}

const CharacterUploader: React.FC<{
  character: Character;
  onRemove: (id: string) => void;
  onUpdateName: (id: string, newName: string) => void;
}> = ({ character, onRemove, onUpdateName }) => {
  return (
    <div className="border-4 border-black bg-white flex flex-col">
      <div className="relative w-full aspect-square">
          <img src={`data:${character.mimeType};base64,${character.base64Image}`} alt={character.name} className="w-full h-full object-cover" />
           <button
            onClick={() => onRemove(character.id)}
            className="absolute top-1 right-1 bg-white/80 hover:bg-white text-red-600 rounded-full p-1 transition-colors"
            aria-label={`Remove ${character.name}`}
          >
              <TrashIcon className="h-5 w-5" />
          </button>
      </div>
      <input
        type="text"
        value={character.name}
        onChange={(e) => onUpdateName(character.id, e.target.value)}
        className="w-full p-2 border-t-4 border-black font-bold text-center bg-lime-100 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all duration-200"
        aria-label={`Character name`}
        placeholder="Character Name"
      />
    </div>
  );
};

const StyleUploader: React.FC<{
  image: StyleReference | null;
  onUpload: (file: File) => void;
  isAnalyzing: boolean;
}> = ({ image, onUpload, isAnalyzing }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onUpload(e.target.files[0]);
    }
  };

  if (image) {
    return (
      <div className="w-full relative">
        <img src={`data:${image.mimeType};base64,${image.base64Image}`} alt="Style Reference" className="w-full aspect-video object-cover border-4 border-black" />
        <p className="text-center bg-white border-x-4 border-b-4 border-black p-2 truncate">{image.name}</p>
        {isAnalyzing && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center border-4 border-black">
                <Loader />
                <p className="text-white mt-2 text-xl">Analyzing Style...</p>
            </div>
        )}
      </div>
    );
  }

  return (
    <label className={`w-full aspect-video border-4 border-black border-dashed flex flex-col items-center justify-center text-center p-2 cursor-pointer bg-gray-200 hover:bg-gray-300 transition-colors`}>
      <UploadIcon className="h-12 w-12 text-black mb-2" />
      <span className="text-2xl">Upload Style Reference</span>
      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </label>
  );
};


const Step1_Input: React.FC<Step1_InputProps> = ({ lyrics, setLyrics, sceneCount, setSceneCount, characters, setCharacters, styleReference, onStyleUpload, isAnalyzingStyle, statusMessage, isAboutToGenerate }) => {

  const handleAddCharacter = async (file: File) => {
    const id = `char-${Date.now()}`;
    const base64Image = await fileToBase64(file);
    
    const newCharacter: Character = {
      id,
      name: `Character ${characters.length + 1}`,
      base64Image,
      mimeType: file.type,
    };
    setCharacters(prev => [...prev, newCharacter]);
  };
  
  const handleRemoveCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };
  
  const handleUpdateCharacterName = (id: string, newName: string) => {
    setCharacters(prevChars => prevChars.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission is now handled automatically by useEffect in App.tsx
  };
  
  return (
    <div className="max-w-5xl mx-auto animate-fade-in mt-12">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_#000] p-6 md:p-10">
        <h2 className="text-4xl md:text-5xl text-center mb-6">Create Your Storyboard</h2>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="lyrics-input" className="block text-2xl mb-2">
              1. Lyrics or Script
            </label>
            <textarea
              id="lyrics-input"
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Paste your song lyrics or script here... The storyboard will generate automatically when all inputs are ready."
              rows={10}
              className="w-full bg-white border-4 border-black p-4 text-lg focus:ring-4 focus:ring-green-400 focus:outline-none transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="scene-count" className="block text-2xl mb-2">
              2. Number of Scenes ({sceneCount})
            </label>
            <input
              id="scene-count"
              type="range"
              min="2"
              max="50"
              value={sceneCount}
              onChange={(e) => setSceneCount(parseInt(e.target.value))}
              className="w-full h-4 bg-gray-300 border-4 border-black appearance-none cursor-pointer accent-green-500"
            />
          </div>
          <div>
             <p className="text-2xl mb-4">3. Characters</p>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {characters.map(char => (
                    <CharacterUploader 
                        key={char.id} 
                        character={char} 
                        onRemove={handleRemoveCharacter}
                        onUpdateName={handleUpdateCharacterName}
                    />
                ))}
                <label className={`w-full aspect-square border-4 border-black border-dashed flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors bg-blue-200 hover:bg-blue-300`}>
                    <UserPlusIcon className="h-12 w-12 text-black mb-2" />
                    <span className="text-2xl">Add Character</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAddCharacter(e.target.files[0])} />
                </label>
             </div>
           </div>
           <div>
             <p className="text-2xl mb-4">4. Style Reference</p>
             <StyleUploader image={styleReference} onUpload={onStyleUpload} isAnalyzing={isAnalyzingStyle} />
           </div>
           <div className="text-center bg-gray-200 border-4 border-black p-4 flex items-center justify-center gap-4">
              {isAboutToGenerate && <Loader small />}
              <p className="text-2xl h-8">{statusMessage}</p>
           </div>
        </form>
      </div>
    </div>
  );
};

export default Step1_Input;