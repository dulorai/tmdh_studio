import React from 'react';
import type { Scene, Character, GeneratedShot } from '../types';
import Loader from './Loader';
import { SparklesIcon, RetryIcon, CheckIcon, DownloadIcon } from './icons';
import { SHOT_TYPES } from '../types';

interface SceneCardProps {
  scene: Scene;
  sceneNumber: number;
  allCharacters: Character[];
  stylePrompt: string;
  addToQueue: (sceneId: string) => void;
  retryShot: (sceneId: string, shotType: string) => void;
  updateScene: (sceneId: string, updatedFields: Partial<Scene>) => void;
  currentlyGeneratingShot: { sceneId: string; shotType: string; } | null;
  setHoverPreview: (preview: { imageUrl: string; x: number; y: number } | null) => void;
}

const ShotDisplay: React.FC<{
    shot: {shotType: string; imageUrl: string; error?: string} | null;
    sceneId: string;
    shotType: string;
    onRetry: (sceneId: string, shotType: string) => void;
    isGenerating: boolean;
    setHoverPreview: (preview: { imageUrl: string; x: number; y: number } | null) => void;
    sceneNumber: number;
}> = ({ shot, sceneId, shotType, onRetry, isGenerating, setHoverPreview, sceneNumber }) => {
    if (isGenerating) {
        return (
            <div className="w-full aspect-square flex flex-col items-center justify-center p-2 bg-yellow-200 border-2 border-yellow-500 animate-pulse">
                <Loader small />
                <p className="text-center font-bold text-yellow-800 text-xs mt-1">Working...</p>
            </div>
        )
    }
    if (shot?.error) {
        const displayError = shot.error.length > 50 ? shot.error.substring(0, 47) + '...' : shot.error;
        return (
            <div className="w-full aspect-square flex flex-col items-center justify-center p-2 bg-red-200 border-2 border-red-500" title={shot.error}>
                <p className="text-center font-bold text-red-700 text-sm">Failed</p>
                <p className="text-center text-red-700 text-xs mt-1 px-1 break-words">{displayError}</p>
                <button onClick={() => onRetry(sceneId, shot.shotType)} className="mt-auto bg-red-500 hover:bg-red-600 text-white p-1 rounded-full border-2 border-black">
                    <RetryIcon className="h-5 w-5"/>
                </button>
            </div>
        )
    }
    if (shot?.imageUrl) {
        const downloadFilename = `scene-${sceneNumber}-${shot.shotType.replace(/\s+/g, '_')}.png`;
        return (
            <div
                className="relative group w-full aspect-square"
                onMouseEnter={(e) => setHoverPreview({ imageUrl: shot.imageUrl, x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setHoverPreview({ imageUrl: shot.imageUrl, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHoverPreview(null)}
            >
                <img src={shot.imageUrl} alt={shot.shotType} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <a
                        href={shot.imageUrl}
                        download={downloadFilename}
                        className="p-2 bg-white/80 hover:bg-white rounded-full text-black transition-colors"
                        title="Download Shot"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DownloadIcon className="h-6 w-6" />
                    </a>
                </div>
            </div>
        );
    }
    return (
        <div className="w-full aspect-square flex items-center justify-center p-2 bg-gray-200 border-2 border-black">
             <p className="text-center font-bold text-gray-500">{shotType}</p>
        </div>
    );
};

const EditableField: React.FC<{
    label: string;
    value: string;
    onChange: (newValue: string) => void;
    bgColor: string;
    rows?: number;
}> = ({ label, value, onChange, bgColor, rows = 2 }) => (
    <div>
        <label className="block text-xl font-bold mb-1">{label}:</label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className={`w-full ${bgColor} p-2 border-2 border-black text-lg focus:ring-2 focus:ring-black focus:outline-none transition-all duration-200`}
        />
    </div>
);

const CharacterSelector: React.FC<{
    allCharacters: Character[];
    selectedCharacterIds: string[];
    onToggle: (characterId: string) => void;
}> = ({ allCharacters, selectedCharacterIds, onToggle }) => (
    <div>
        <label className="block text-xl font-bold mb-2">Characters in this Scene:</label>
        {allCharacters.length > 0 ? (
            <div className="flex flex-wrap gap-4">
                {allCharacters.map(char => {
                    const isSelected = selectedCharacterIds.includes(char.id);
                    return (
                        <button 
                            key={char.id} 
                            onClick={() => onToggle(char.id)} 
                            className={`relative border-4 w-20 h-20 flex-shrink-0 transition-all transform hover:translate-y-[-2px] active:translate-y-0 active:shadow-none ${isSelected ? 'border-green-500 shadow-[4px_4px_0px_#22c55e]' : 'border-black hover:shadow-[4px_4px_0px_#000]'}`}
                            title={`Toggle ${char.name}`}
                        >
                            <img 
                                src={`data:${char.mimeType};base64,${char.base64Image}`} 
                                alt={char.name} 
                                className={`w-full h-full object-cover`}
                            />
                            <div className={`absolute inset-0 bg-black transition-opacity ${isSelected ? 'opacity-30' : 'opacity-0'}`}></div>
                            {isSelected && (
                                <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5 border-2 border-white shadow-md">
                                    <CheckIcon className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div className="absolute bottom-0 w-full text-center text-xs font-bold p-0.5 text-white bg-black/70 truncate">{char.name}</div>
                        </button>
                    )
                })}
            </div>
        ) : <p>No characters uploaded.</p>}
    </div>
);


const SceneCard: React.FC<SceneCardProps> = ({ scene, sceneNumber, allCharacters, addToQueue, retryShot, updateScene, currentlyGeneratingShot, setHoverPreview }) => {

  const handleGenerate = () => {
    addToQueue(scene.id);
  };
  
  const handleCharacterToggle = (characterId: string) => {
    const newCharacterIds = scene.characterIds.includes(characterId)
        ? scene.characterIds.filter(id => id !== characterId)
        : [...scene.characterIds, characterId];
    updateScene(scene.id, { characterIds: newCharacterIds });
  };

  const getButtonState = () => {
      switch(scene.generationStatus) {
        case 'idle':
            return { text: `Generate ${SHOT_TYPES.length} Shots`, icon: <SparklesIcon className="h-6 w-6" />, disabled: false, className: 'bg-green-500 hover:bg-green-600' };
        case 'queued':
            return { text: 'Queued...', icon: <Loader small />, disabled: true, className: 'bg-blue-500' };
        case 'generating':
            return { text: 'Generating...', icon: <Loader small />, disabled: true, className: 'bg-yellow-500' };
        case 'completed':
            return { text: '✓ All Shots Generated', icon: null, disabled: true, className: 'bg-gray-500' };
        case 'failed':
            return { text: 'Retry Generation', icon: <RetryIcon className="h-6 w-6" />, disabled: false, className: 'bg-red-500 hover:bg-red-600' };
        default:
            return { text: `Generate ${SHOT_TYPES.length} Shots`, icon: <SparklesIcon className="h-6 w-6" />, disabled: true, className: 'bg-gray-400' };
      }
  }

  const buttonState = getButtonState();
  
  const downloadableShots = scene.generatedShots.filter((s): s is GeneratedShot => !!(s && s.imageUrl && !s.error));
  const canDownloadAll = downloadableShots.length > 0;

  const handleDownloadAll = () => {
    if (!canDownloadAll) return;
    
    downloadableShots.forEach((shot, index) => {
      // Stagger downloads slightly to prevent browser from blocking popups
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = shot.imageUrl;
        const downloadFilename = `scene-${sceneNumber}-${shot.shotType.replace(/\s+/g, '_')}.png`;
        link.download = downloadFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 300); // 300ms delay between each download
    });
  };

  return (
    <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_#22c55e]">
       <div className="flex justify-between items-center mb-3">
        <h3 className="text-3xl">Scene {sceneNumber}</h3>
        {canDownloadAll && (
          <button
            onClick={handleDownloadAll}
            title="Download all shots for this scene"
            className="flex items-center gap-2 bg-white text-black text-base border-2 border-black py-1 px-3 hover:bg-lime-200 transition-all transform hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none"
          >
            <DownloadIcon className="h-5 w-5" />
            Download All
          </button>
        )}
      </div>

      <div className="space-y-4">
         <p className="bg-gray-200 p-2 border-2 border-black text-lg">
          <strong>Lyrics:</strong> "{scene.lyrics}"
         </p>
         <EditableField 
            label="Direction"
            value={scene.description}
            onChange={(val) => updateScene(scene.id, { description: val })}
            bgColor="bg-green-100"
            rows={2}
         />
         <EditableField 
            label="Setting"
            value={scene.setting}
            onChange={(val) => updateScene(scene.id, { setting: val })}
            bgColor="bg-lime-100"
            rows={4}
         />
         <CharacterSelector
            allCharacters={allCharacters}
            selectedCharacterIds={scene.characterIds}
            onToggle={handleCharacterToggle}
         />
      </div>
      
      <button
        onClick={handleGenerate}
        disabled={buttonState.disabled}
        className={`w-full flex items-center justify-center gap-2 mt-4 text-white text-2xl font-bold py-3 px-4 border-4 border-black disabled:text-gray-200 disabled:cursor-not-allowed transition-all transform hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-y-[2px] active:shadow-none ${buttonState.className}`}
      >
        {buttonState.icon} {buttonState.text}
      </button>

      <div className="mt-4 grid grid-cols-3 gap-4">
        {SHOT_TYPES.map((shotType, index) => {
            const shot = scene.generatedShots[index];
            const isCurrentlyGenerating = currentlyGeneratingShot?.sceneId === scene.id && currentlyGeneratingShot?.shotType === shotType;
            return <ShotDisplay 
                key={`${scene.id}-${shotType}`} 
                shot={shot} 
                shotType={shotType} 
                sceneId={scene.id} 
                onRetry={retryShot} 
                isGenerating={isCurrentlyGenerating}
                setHoverPreview={setHoverPreview}
                sceneNumber={sceneNumber}
             />;
        })}
      </div>
       <div className="grid grid-cols-3 gap-4 mt-1">
          {SHOT_TYPES.map(shotType => (
              <p key={shotType} className="text-center text-sm font-bold">{shotType}</p>
          ))}
      </div>
    </div>
  );
};

export default SceneCard;
