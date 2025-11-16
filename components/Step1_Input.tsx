
import React, { useState } from 'react';
import type { Character, StyleReference, AspectRatio } from '../types';
import { UploadIcon, UserPlusIcon, TrashIcon, CheckIcon, GripVerticalIcon } from './icons';
import Loader from './Loader';
import { PRESET_STYLES } from '../types';
import AddCharacterModal from './AddCharacterModal';

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
  selectedStyles: string[];
  onToggleStyle: (style: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: React.Dispatch<React.SetStateAction<AspectRatio>>;
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
      <div className="w-full max-w-md mx-auto relative">
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
    <label className={`w-full max-w-md mx-auto aspect-video border-4 border-black border-dashed flex flex-col items-center justify-center text-center p-2 cursor-pointer bg-gray-200 hover:bg-gray-300 transition-colors`}>
      <UploadIcon className="h-10 w-10 text-black mb-2" />
      <span className="text-xl">Upload Custom Style Reference</span>
      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </label>
  );
};


const Step1_Input: React.FC<Step1_InputProps> = ({ 
    lyrics, setLyrics, sceneCount, setSceneCount, characters, setCharacters, 
    styleReference, onStyleUpload, isAnalyzingStyle, statusMessage, isAboutToGenerate,
    selectedStyles, onToggleStyle, aspectRatio, setAspectRatio
}) => {
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);

  const handleAddCharacter = (imageData: { base64Image: string; mimeType: string; }) => {
    const id = `char-${Date.now()}`;
    const newCharacter: Character = {
      id,
      name: `Character ${characters.length + 1}`,
      base64Image: imageData.base64Image,
      mimeType: imageData.mimeType,
    };
    setCharacters(prev => [...prev, newCharacter]);
    setIsCharacterModalOpen(false);
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
    <>
      <AddCharacterModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        onAddCharacter={handleAddCharacter}
      />
      <div className="max-w-5xl mx-auto animate-fade-in mt-12">
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_#000] p-6 md:p-10">
          <h2 className="text-4xl md:text-5xl text-center mb-6">Create Your Storyboard</h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-[1fr_auto] gap-8">
              <div className="order-2 md:order-1">
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
              <div className="order-1 md:order-2">
                 <label className="block text-2xl mb-2">
                  Aspect Ratio
                </label>
                <div className="flex md:flex-col gap-3">
                    {(['1:1', '16:9', '9:16'] as AspectRatio[]).map(ratio => (
                        <button
                            key={ratio}
                            type="button"
                            onClick={() => setAspectRatio(ratio)}
                            className={`p-3 font-bold border-4 border-black transition-all flex items-center gap-2
                                ${aspectRatio === ratio ? 'bg-green-500 text-white shadow-[4px_4px_0px_#000] translate-x-[2px] translate-y-[2px]' : 'bg-white hover:bg-gray-100 text-black hover:shadow-[4px_4px_0px_#000] hover:-translate-y-[2px] hover:-translate-x-[2px]'}
                            `}
                        >
                             <div className={`border-2 border-current ${ratio === '1:1' ? 'w-6 h-6' : ratio === '16:9' ? 'w-8 h-4.5' : 'w-4.5 h-8'}`}></div>
                            {ratio === '1:1' ? 'Square' : ratio === '16:9' ? 'Landscape' : 'Portrait'}
                        </button>
                    ))}
                </div>
              </div>
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
                  <button
                      type="button"
                      onClick={() => setIsCharacterModalOpen(true)}
                      className={`w-full aspect-square border-4 border-black border-dashed flex flex-col items-center justify-center text-center p-2 cursor-pointer transition-colors bg-blue-200 hover:bg-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-400`}
                  >
                      <UserPlusIcon className="h-12 w-12 text-black mb-2" />
                      <span className="text-2xl">Add Character</span>
                  </button>
              </div>
            </div>
            <div>
              <p className="text-2xl mb-4">4. Style Reference</p>
                <div className="bg-gray-100 border-4 border-black p-4">
                  <p className="text-xl mb-4 font-bold">Choose from presets (multiple allowed):</p>
                  <div className="flex flex-wrap gap-3">
                      {PRESET_STYLES.map(style => {
                          const isSelected = selectedStyles.includes(style);
                          return (
                              <button
                                  key={style}
                                  type="button"
                                  onClick={() => onToggleStyle(style)}
                                  className={`px-4 py-2 font-bold border-4 border-black transition-all transform hover:translate-y-[-2px] active:translate-y-0 active:shadow-none ${isSelected ? 'bg-green-500 text-white shadow-[4px_4px_0px_#000]' : 'bg-white hover:bg-gray-100 text-black hover:shadow-[4px_4px_0px_#000]'}`}
                              >
                                  {isSelected && <CheckIcon className="h-5 w-5 inline-block mr-2 -ml-1" />}
                                  {style}
                              </button>
                          );
                      })}
                  </div>
                  <p className="text-xl my-6 font-bold text-center text-gray-600 tracking-widest">OR</p>
                  <StyleUploader image={styleReference} onUpload={onStyleUpload} isAnalyzing={isAnalyzingStyle} />
              </div>
            </div>
            <div className="text-center bg-gray-200 border-4 border-black p-4 flex items-center justify-center gap-4">
                {isAboutToGenerate && <Loader small />}
                <p className="text-2xl h-8">{statusMessage}</p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Step1_Input;
