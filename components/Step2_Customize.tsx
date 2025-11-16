
import React, { useState } from 'react';
import type { Scene, Character, AspectRatio } from '../types';
import SceneCard from './SceneCard';
import { ArrowLeftIcon, MinusCircleIcon, FilmIcon, ZipIcon } from './icons';

interface Step2_CustomizeProps {
  scenes: Scene[];
  onBack: () => void;
  allCharacters: Character[];
  stylePrompt: string;
  queue: string[];
  addToQueue: (sceneId: string) => void;
  retryShot: (sceneId: string, shotType: string) => void;
  updateScene: (sceneId: string, updatedFields: Partial<Scene>) => void;
  isQueuePaused?: boolean;
  pauseMessage?: string | null;
  currentlyGeneratingShot: { sceneId: string; shotType: string; } | null;
  isProcessing: boolean;
  reorderScenes: (draggedId: string, targetId: string) => void;
  clearQueue: () => void;
  setHoverPreview: (preview: { imageUrl: string; x: number; y: number; } | null) => void;
  onGenerateVideo: () => void;
  onDownloadAllScenes: () => void;
  actionStatus: string;
  aspectRatio: AspectRatio;
}

const Step2_Customize: React.FC<Step2_CustomizeProps> = ({ 
  scenes, onBack, allCharacters, stylePrompt, queue, addToQueue, retryShot, 
  updateScene, isQueuePaused, pauseMessage, currentlyGeneratingShot, 
  isProcessing, reorderScenes, clearQueue, setHoverPreview, onGenerateVideo,
  onDownloadAllScenes, actionStatus, aspectRatio
}) => {
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [dragOverSceneId, setDragOverSceneId] = useState<string | null>(null);

  const getSceneNumber = (sceneId: string) => {
    return scenes.findIndex(s => s.id === sceneId) + 1;
  };

  const hasDownloadableShots = scenes.some(s => s.generationStatus === 'completed' || s.generatedShots.some(shot => shot && !shot.error));

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <button 
            onClick={onBack} 
            className="flex-shrink-0 flex items-center gap-2 bg-white text-black text-xl border-4 border-black py-2 px-4 hover:bg-gray-200 transition-all transform hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-y-[2px] active:shadow-none"
        >
          <ArrowLeftIcon className="h-6 w-6" />
          Back
        </button>
        <h2 className="text-3xl md:text-5xl font-bold text-center order-first md:order-none">Customize Your Scenes</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadAllScenes}
            disabled={!hasDownloadableShots || isProcessing}
            className="flex-shrink-0 flex items-center gap-2 bg-purple-500 text-white text-xl border-4 border-black py-2 px-4 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none transition-all transform hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-y-[2px] active:shadow-none"
            title="Download all generated shots as a ZIP file"
          >
              <ZipIcon className="h-6 w-6" />
              Download All
          </button>
          <button
            onClick={onGenerateVideo}
            disabled={!hasDownloadableShots || isProcessing}
            className="flex-shrink-0 flex items-center gap-2 bg-blue-500 text-white text-xl border-4 border-black py-2 px-4 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none transition-all transform hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-y-[2px] active:shadow-none"
          >
              <FilmIcon className="h-6 w-6" />
              Generate Video
          </button>
        </div>
      </div>
      
      {actionStatus && (
        <div className="bg-purple-200 text-black p-4 mb-8 border-4 border-black shadow-[8px_8px_0px_#000]">
          <p className="text-xl text-center animate-pulse font-bold">{actionStatus}</p>
        </div>
      )}

      {isQueuePaused && pauseMessage && (
        <div className="bg-orange-500 text-white p-4 mb-8 border-4 border-black shadow-[8px_8px_0px_#000]">
          <p className="text-xl text-center animate-pulse font-bold">{pauseMessage}</p>
        </div>
      )}

      {queue.length > 0 && (
        <div className="mb-8 bg-blue-100 border-4 border-black p-4 shadow-[8px_8px_0px_#000]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Generation Queue ({queue.length})</h3>
            <button 
              onClick={clearQueue} 
              disabled={isProcessing}
              className="flex items-center gap-2 bg-white text-black text-lg border-2 border-black py-1 px-3 hover:bg-red-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <MinusCircleIcon className="h-5 w-5" />
              Clear Queue
            </button>
          </div>
          <ol className="space-y-2 font-inter">
            {queue.map((sceneId, index) => {
              const scene = scenes.find(s => s.id === sceneId);
              if (!scene) return null;
              const sceneNumber = getSceneNumber(sceneId);

              return (
                <li
                  key={sceneId}
                  className={`flex items-center gap-3 p-2 border-2 border-black bg-white`}
                >
                  <span className="font-bold text-lg">{(index + 1)}.</span>
                  <p className="truncate flex-grow">
                    <strong>Scene {sceneNumber}:</strong> 
                    <span className="text-gray-700 ml-2">"{scene.lyrics}"</span>
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="bg-black text-white p-4 mb-8 border-4 border-black shadow-[8px_8px_0px_#000]">
        <p className="text-xl"><strong>Analyzed Style Prompt:</strong> "{stylePrompt}"</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            draggable={!isProcessing}
            onDragStart={(e) => {
              if (isProcessing) return;
              e.dataTransfer.setData("sceneId", scene.id);
              setDraggedSceneId(scene.id);
            }}
            onDragEnd={() => {
              setDraggedSceneId(null);
              setDragOverSceneId(null);
            }}
            onDragEnter={() => !isProcessing && draggedSceneId && setDragOverSceneId(scene.id)}
            onDragLeave={() => setDragOverSceneId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              if (isProcessing) return;
              e.preventDefault();
              const draggedId = e.dataTransfer.getData("sceneId");
              reorderScenes(draggedId, scene.id);
              setDraggedSceneId(null);
              setDragOverSceneId(null);
            }}
            style={{ cursor: isProcessing ? 'not-allowed' : 'grab' }}
            className={`
              transition-all duration-200
              ${draggedSceneId === scene.id ? 'opacity-30' : 'opacity-100'}
              ${dragOverSceneId === scene.id ? 'border-4 border-dashed border-blue-500 rounded-lg p-1 -m-1' : 'border-0 border-transparent'}
            `}
          >
            <SceneCard 
              scene={scene} 
              sceneNumber={index + 1} 
              allCharacters={allCharacters}
              stylePrompt={stylePrompt}
              addToQueue={addToQueue}
              retryShot={retryShot}
              updateScene={updateScene}
              currentlyGeneratingShot={currentlyGeneratingShot}
              setHoverPreview={setHoverPreview}
              aspectRatio={aspectRatio}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step2_Customize;
