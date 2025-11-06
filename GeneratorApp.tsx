import React, { useState, useEffect, useRef } from 'react';
import type { Scene, Character, StyleReference, GeneratedShot } from './types';
import Header from './components/Header';
import Step1_Input from './components/Step1_Input';
import Step2_Customize from './components/Step2_Customize';
import { generateSceneDescriptions, analyzeStyle, generateSingleImage } from './services/geminiService';
import Loader from './components/Loader';
import { SHOT_TYPES } from './types';
import { fileToBase64 } from './utils/fileUtils';
import HoverPreview from './components/FullscreenPreview';
import VideoGenerationModal from './components/VideoGenerationModal';


const SHOT_GENERATION_DELAY_MS = 1500; // 1.5s delay between each shot request

interface GeneratorAppProps {
  onGoHome: () => void;
}

export default function GeneratorApp({ onGoHome }: GeneratorAppProps) {
  const [step, setStep] = useState<'input' | 'storyboard'>('input');
  
  // Input state
  const [lyrics, setLyrics] = useState('');
  const [sceneCount, setSceneCount] = useState(8);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [styleReference, setStyleReference] = useState<StyleReference | null>(null);

  // Storyboard state
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [stylePrompt, setStylePrompt] = useState('');
  const [generationQueue, setGenerationQueue] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);
  const [isAboutToGenerate, setIsAboutToGenerate] = useState(false);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [pauseMessage, setPauseMessage] = useState<string | null>(null);
  const [currentlyGeneratingShot, setCurrentlyGeneratingShot] = useState<{ sceneId: string; shotType: string; } | null>(null);
  const [hoverPreview, setHoverPreview] = useState<{ imageUrl: string; x: number; y: number } | null>(null);

  // Video generation state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoStatusMessage, setVideoStatusMessage] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Generating...');
  const [error, setError] = useState<string | null>(null);
  
  const generationTriggeredRef = useRef(false);

  const handleStyleUpload = async (file: File) => {
    setIsAnalyzingStyle(true);
    setError(null);
    setStylePrompt('');
    try {
      const base64Image = await fileToBase64(file);
      const newStyleRef = { name: file.name, base64Image, mimeType: file.type };
      setStyleReference(newStyleRef);

      const analyzedStyle = await analyzeStyle(newStyleRef);
      setStylePrompt(analyzedStyle);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to analyze style.');
      setStyleReference(null);
    } finally {
      setIsAnalyzingStyle(false);
    }
  };

  const triggerStoryboardGeneration = async () => {
    if (generationTriggeredRef.current) return;
    generationTriggeredRef.current = true;
    setIsAboutToGenerate(false);

    if (!lyrics || characters.length === 0 || !styleReference || !stylePrompt) {
        generationTriggeredRef.current = false;
        return;
    };

    setIsLoading(true);
    setError(null);
    try {
      setLoadingText('Creating scenes...');
      const descriptions = await generateSceneDescriptions(lyrics, sceneCount);
      
      const newScenes: Scene[] = descriptions.map((desc, index) => ({
        id: `scene-${index}-${Date.now()}`,
        lyrics: desc.lyrics,
        description: desc.description,
        setting: desc.setting,
        characterIds: [], // Default to no characters
        generatedShots: Array(SHOT_TYPES.length).fill(null),
        generationStatus: 'idle',
      }));

      setScenes(newScenes);
      setStep('storyboard');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
      // If it fails, allow re-triggering
      generationTriggeredRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    const canGenerate = lyrics.trim() && characters.length > 0 && styleReference && stylePrompt && !isAnalyzingStyle;

    if (step === 'input' && canGenerate && !generationTriggeredRef.current) {
        setIsAboutToGenerate(true);
        const handler = setTimeout(() => {
            triggerStoryboardGeneration();
        }, 500); // 0.5s delay after all conditions are met

        return () => {
            setIsAboutToGenerate(false);
            clearTimeout(handler);
        }
    } else {
        setIsAboutToGenerate(false);
    }
  }, [lyrics, characters, styleReference, stylePrompt, isAnalyzingStyle, step]);
  
  const addToQueue = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || (scene.generationStatus !== 'idle' && scene.generationStatus !== 'failed')) return;

    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, generationStatus: 'queued' } : s));
    setGenerationQueue(prev => [...prev, sceneId]);
  };

  const reorderScenes = (draggedId: string, targetId: string) => {
    if (isProcessing || draggedId === targetId) return;

    const newScenes = [...scenes];
    const draggedIndex = newScenes.findIndex(s => s.id === draggedId);
    const targetIndex = newScenes.findIndex(s => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder the main scenes array
    const [draggedItem] = newScenes.splice(draggedIndex, 1);
    newScenes.splice(targetIndex, 0, draggedItem);
    setScenes(newScenes);

    // Ensure the queue reflects the new visual order
    if (generationQueue.length > 0) {
        const newSceneOrderMap = new Map(newScenes.map((scene, index) => [scene.id, index]));
        const newQueue = [...generationQueue].sort((a, b) => {
            const indexA = newSceneOrderMap.get(a) ?? -1;
            const indexB = newSceneOrderMap.get(b) ?? -1;
            return indexA - indexB;
        });
        setGenerationQueue(newQueue);
    }
  };
  
  const clearQueue = () => {
    if (isProcessing) return;
    const queuedSceneIds = new Set(generationQueue);
    setScenes(prevScenes =>
      prevScenes.map(scene =>
        queuedSceneIds.has(scene.id) ? { ...scene, generationStatus: 'idle' } : scene
      )
    );
    setGenerationQueue([]);
  };

  const updateScene = (sceneId: string, updatedFields: Partial<Scene>) => {
    setScenes(prevScenes =>
      prevScenes.map(scene =>
        scene.id === sceneId ? { ...scene, ...updatedFields } : scene
      )
    );
  };
  
  const retryShot = async (sceneId: string, shotType: string) => {
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;

    const shotIndex = SHOT_TYPES.indexOf(shotType);
    if (shotIndex === -1) return;

    setScenes(prev => {
      const newScenes = [...prev];
      const newShots = [...newScenes[sceneIndex].generatedShots];
      newShots[shotIndex] = null;
      newScenes[sceneIndex] = { ...newScenes[sceneIndex], generatedShots: newShots };
      return newScenes;
    });

    try {
        setCurrentlyGeneratingShot({ sceneId, shotType });
        const sceneToProcess = scenes[sceneIndex];
        const assignedCharacters = characters.filter(c => sceneToProcess.characterIds.includes(c.id));
        const imageUrl = await generateSingleImage(sceneToProcess.description, sceneToProcess.setting, shotType, assignedCharacters, stylePrompt);
        const newShot: GeneratedShot = { shotType, imageUrl };
        setScenes(prev => {
            const newScenes = [...prev];
            const newShots = [...newScenes[sceneIndex].generatedShots];
            newShots[shotIndex] = newShot;
            newScenes[sceneIndex] = { ...newScenes[sceneIndex], generatedShots: newShots };
            return newScenes;
        });
    } catch (error) {
        console.error(`Failed to retry shot "${shotType}" for scene ${sceneId}`, error);
        const errorMessage = error instanceof Error ? error.message : "Retry failed.";
        const failedShot: GeneratedShot = { shotType, imageUrl: '', error: errorMessage };
        setScenes(prev => {
            const newScenes = [...prev];
            const newShots = [...newScenes[sceneIndex].generatedShots];
            newShots[shotIndex] = failedShot;
            newScenes[sceneIndex] = { ...newScenes[sceneIndex], generatedShots: newShots };
            return newScenes;
        });
    } finally {
        setCurrentlyGeneratingShot(null);
    }
  };

  const resumeQueue = () => {
    setIsQueuePaused(false);
    setPauseMessage(null);
  };

  const processNextInQueue = async () => {
    if (generationQueue.length === 0) {
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    const sceneIdToProcess = generationQueue[0];
    const sceneToProcess = scenes.find(s => s.id === sceneIdToProcess);

    if (!sceneToProcess) {
        setGenerationQueue(prev => prev.slice(1));
        setIsProcessing(false);
        return;
    }
    
    setScenes(prev => prev.map(s => s.id === sceneIdToProcess ? { ...s, generationStatus: 'generating' } : s));

    const assignedCharacters = characters.filter(c => sceneToProcess.characterIds.includes(c.id));
    const newShots: (GeneratedShot | null)[] = [...sceneToProcess.generatedShots];
    let hasFailed = newShots.some(shot => !!shot?.error);

    for (let i = 0; i < SHOT_TYPES.length; i++) {
        // Skip shots that are already successfully generated
        if (newShots[i] && !newShots[i]?.error) {
            continue;
        }

        const shotType = SHOT_TYPES[i];
        try {
            setCurrentlyGeneratingShot({ sceneId: sceneIdToProcess, shotType });
            const imageUrl = await generateSingleImage(sceneToProcess.description, sceneToProcess.setting, shotType, assignedCharacters, stylePrompt);
            newShots[i] = { shotType, imageUrl };
            if (i < SHOT_TYPES.length - 1) { // Proactive delay
              await new Promise(res => setTimeout(res, SHOT_GENERATION_DELAY_MS));
            }
        } catch (error) {
            console.error(`Failed shot "${shotType}" for scene ${sceneIdToProcess}`, error);
            const errorMessage = error instanceof Error ? error.message : "Generation failed.";

            if (errorMessage.toLowerCase().includes('quota')) {
                setScenes(prev => prev.map(s => s.id === sceneIdToProcess ? { ...s, generationStatus: 'queued', generatedShots: newShots } : s));
                setIsQueuePaused(true);
                setPauseMessage("API quota reached. Pausing for 60 seconds, will resume automatically...");
                setTimeout(resumeQueue, 60000);
                setIsProcessing(false);
                setCurrentlyGeneratingShot(null);
                return; // Exit to pause processing
            }

            newShots[i] = { shotType, imageUrl: '', error: errorMessage };
            hasFailed = true;
        }
        setScenes(prev => prev.map(s => s.id === sceneIdToProcess ? { ...s, generatedShots: [...newShots] } : s));
    }

    setCurrentlyGeneratingShot(null);

    setScenes(prev => prev.map(s => s.id === sceneIdToProcess ? {
        ...s,
        generationStatus: hasFailed ? 'failed' : 'completed'
    } : s));

    setGenerationQueue(prev => prev.slice(1));
    setIsProcessing(false);
  };

  useEffect(() => {
    if (generationQueue.length > 0 && !isProcessing && !isQueuePaused) {
      processNextInQueue();
    }
  }, [generationQueue, isProcessing, isQueuePaused]);


  const handleBack = () => {
    setStep('input');
    setScenes([]);
    setStylePrompt('');
    setError(null);
    setGenerationQueue([]);
    setIsProcessing(false);
    generationTriggeredRef.current = false;
  }
  
  const getStatusMessage = () => {
    if (isAboutToGenerate) {
        return 'All set! Generating your storyboard...';
    }
    if (isAnalyzingStyle) {
      return 'Analyzing style...';
    }
  
    const missing = [];
    if (!lyrics.trim()) missing.push('lyrics');
    if (characters.length === 0) missing.push('a character');
    if (!styleReference) missing.push('a style reference');
  
    if (missing.length > 0) {
        const missingText = missing.length > 1 ? missing.slice(0, -1).join(', ') + ' and ' + missing.slice(-1) : missing[0];
        return `Please add ${missingText} to begin.`;
    }
    
    return 'Ready to generate!';
  };

  // --- Video Generation Logic ---
  const handleOpenVideoModal = () => {
    setIsVideoModalOpen(true);
    generateVideo();
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    if (generatedVideoUrl) {
      URL.revokeObjectURL(generatedVideoUrl);
    }
    setGeneratedVideoUrl(null);
    setVideoStatusMessage('');
    setVideoError(null);
    setIsGeneratingVideo(false);
  };

  const generateVideo = async () => {
    setIsGeneratingVideo(true);
    setGeneratedVideoUrl(null);
    setVideoError(null);
  
    const allShots = scenes
      .flatMap(s => s.generatedShots)
      .filter((shot): shot is GeneratedShot => !!(shot && shot.imageUrl && !shot.error));
  
    if (allShots.length === 0) {
      setVideoError("No generated shots available to create a video.");
      setIsGeneratingVideo(false);
      return;
    }
  
    setVideoStatusMessage(`Preparing to compile ${allShots.length} shots...`);
  
    try {
      const canvas = document.createElement('canvas');
      const width = 1280;
      const height = 720;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Could not get canvas context.");
      }
  
      const stream = canvas.captureStream(30); // 30 FPS
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];
  
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        setGeneratedVideoUrl(videoUrl);
        setVideoStatusMessage('Video compilation complete!');
        setIsGeneratingVideo(false);
      };
  
      recorder.start();
  
      const SHOT_DURATION_MS = 3000; // 3 seconds per shot
  
      for (let i = 0; i < allShots.length; i++) {
        setVideoStatusMessage(`Processing shot ${i + 1} of ${allShots.length}...`);
        const shot = allShots[i];
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image for shot: ${shot.shotType}`));
          img.src = shot.imageUrl;
        });
  
        // Clear canvas with black background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
  
        // Calculate dimensions to draw image with letterboxing
        const imgAspectRatio = img.width / img.height;
        const canvasAspectRatio = width / height;
        let drawWidth, drawHeight, x, y;
  
        if (imgAspectRatio > canvasAspectRatio) {
          drawWidth = width;
          drawHeight = width / imgAspectRatio;
          x = 0;
          y = (height - drawHeight) / 2;
        } else {
          drawHeight = height;
          drawWidth = height * imgAspectRatio;
          x = (width - drawWidth) / 2;
          y = 0;
        }
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        
        // Let the MediaRecorder capture the frame for its duration
        await new Promise(resolve => setTimeout(resolve, SHOT_DURATION_MS));
      }
  
      recorder.stop();
  
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during video creation.";
      console.error("Video creation failed:", errorMessage);
      setVideoError(errorMessage);
      setIsGeneratingVideo(false);
    }
  };


  return (
    <div className="font-bebas bg-green-300 text-black min-h-screen">
      {hoverPreview && <HoverPreview imageUrl={hoverPreview.imageUrl} position={{ x: hoverPreview.x, y: hoverPreview.y }} />}
      <VideoGenerationModal
          isOpen={isVideoModalOpen}
          onClose={handleCloseVideoModal}
          isGenerating={isGeneratingVideo}
          statusMessage={videoStatusMessage}
          videoUrl={generatedVideoUrl}
          error={videoError}
      />
      <Header onGoHome={onGoHome} />
      <main className="container mx-auto p-4 md:p-8">
        {isLoading && (
          <div className="fixed inset-0 bg-green-300 bg-opacity-80 flex flex-col items-center justify-center z-50">
            <Loader />
            <p className="mt-4 text-2xl tracking-wider">{loadingText}</p>
          </div>
        )}
        {error && (
            <div className="border-4 border-black bg-red-500 text-white p-4 my-4 shadow-[8px_8px_0px_#000]" role="alert">
                <strong className="text-2xl block">ERROR!</strong>
                <span className="block mt-1">{error}</span>
            </div>
        )}
        {step === 'input' ? (
          <Step1_Input
            lyrics={lyrics}
            setLyrics={setLyrics}
            sceneCount={sceneCount}
            setSceneCount={setSceneCount}
            characters={characters}
            setCharacters={setCharacters}
            styleReference={styleReference}
            onStyleUpload={handleStyleUpload}
            isAnalyzingStyle={isAnalyzingStyle}
            statusMessage={getStatusMessage()}
            isAboutToGenerate={isAboutToGenerate}
          />
        ) : (
          <Step2_Customize
            scenes={scenes}
            onBack={handleBack}
            allCharacters={characters}
            stylePrompt={stylePrompt}
            queue={generationQueue}
            addToQueue={addToQueue}
            retryShot={retryShot}
            updateScene={updateScene}
            isQueuePaused={isQueuePaused}
            pauseMessage={pauseMessage}
            currentlyGeneratingShot={currentlyGeneratingShot}
            isProcessing={isProcessing}
            reorderScenes={reorderScenes}
            clearQueue={clearQueue}
            setHoverPreview={setHoverPreview}
            onGenerateVideo={handleOpenVideoModal}
          />
        )}
      </main>
    </div>
  );
}