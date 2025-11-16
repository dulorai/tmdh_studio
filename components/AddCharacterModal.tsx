import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, UploadIcon, CameraIcon } from './icons';
import Loader from './Loader';
import { fileToBase64 } from '../utils/fileUtils';
import { generateCharacterImage } from '../services/geminiService';

interface AddCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCharacter: (data: { base64Image: string, mimeType: string }) => void;
}

type Tab = 'generate' | 'upload' | 'camera';

const AddCharacterModal: React.FC<AddCharacterModalProps> = ({ isOpen, onClose, onAddCharacter }) => {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  // Generate Tab State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{ base64: string, mime: string } | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Camera Tab State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);


  const handleClose = () => {
    stopCamera();
    setPrompt('');
    setIsGenerating(false);
    setGeneratedImage(null);
    setGenerationError(null);
    setCapturedImage(null);
    setCameraError(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !stream) {
      startCamera();
    } else if (!isOpen || activeTab !== 'camera') {
      stopCamera();
    }
    
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const handleFileSelect = async (file: File) => {
    try {
        const base64Image = await fileToBase64(file);
        onAddCharacter({ base64Image, mimeType: file.type });
        handleClose();
    } catch (error) {
        console.error("Error processing file:", error);
    }
  };
  
  const handleGenerateClick = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedImage(null);
    try {
        const result = await generateCharacterImage(prompt);
        setGeneratedImage({ base64: result.base64Image, mime: result.mimeType });
    } catch (error) {
        setGenerationError(error instanceof Error ? error.message : "Failed to generate image.");
    } finally {
        setIsGenerating(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } else {
        throw new Error("Camera access is not supported by this browser.");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Could not access camera. Please check permissions and try again.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };
  
  const addCapturedImage = () => {
    if (capturedImage) {
        const [header, base64Data] = capturedImage.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
        onAddCharacter({ base64Image: base64Data, mimeType });
        handleClose();
    }
  }

  if (!isOpen) return null;

  const TabButton: React.FC<{ tab: Tab; icon: React.ReactNode; label: string; }> = ({ tab, icon, label }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`flex-1 flex items-center justify-center gap-2 py-2 text-lg font-bold border-b-4 transition-colors ${activeTab === tab ? 'border-green-500 text-black bg-white' : 'border-black text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
    >
        {icon}
        {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in-fast" onClick={handleClose}>
        <div className="bg-green-300 w-full max-w-lg border-4 border-black shadow-[12px_12px_0px_#000] flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3 border-b-4 border-black bg-white">
                <h2 className="text-2xl font-bold">Add New Character</h2>
                <button onClick={handleClose} className="p-1 hover:bg-gray-200 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="border-b-4 border-black flex">
                <TabButton tab="generate" icon={<SparklesIcon className="h-5 w-5" />} label="Generate" />
                <TabButton tab="upload" icon={<UploadIcon className="h-5 w-5" />} label="Upload" />
                <TabButton tab="camera" icon={<CameraIcon className="h-5 w-5" />} label="Camera" />
            </div>

            <div className="p-4 flex flex-col flex-grow overflow-y-auto bg-white">
                {activeTab === 'generate' && (
                    <div className="flex flex-col h-full">
                        <p className="font-inter mb-2 text-sm text-gray-700 leading-tight">Describe your character specifically (e.g., "A young woman with long silver hair, wearing futuristic silver armor").</p>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. Cyborg with neon blue eyes..."
                            rows={2}
                            className="w-full bg-white border-4 border-black p-2 text-base focus:ring-4 focus:ring-green-400 focus:outline-none transition-all duration-200"
                        />
                        <button onClick={handleGenerateClick} disabled={!prompt || isGenerating} className="w-full mt-3 bg-green-500 text-white text-xl font-bold py-2 px-4 border-4 border-black transition-all transform hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-y-[2px] active:shadow-none hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {isGenerating ? <><Loader small /> Generating...</> : 'Generate'}
                        </button>

                        <div className="mt-4 flex-grow flex items-center justify-center bg-gray-100 border-4 border-black p-2 min-h-[200px]">
                            {generationError && <p className="text-red-600 font-inter text-sm text-center px-2">{generationError}</p>}
                            {generatedImage && (
                                <div className="text-center w-full">
                                    <img src={`data:${generatedImage.mime};base64,${generatedImage.base64}`} alt="Generated Character" className="max-h-48 mx-auto border-4 border-black object-contain" />
                                    <button onClick={() => onAddCharacter({ base64Image: generatedImage.base64, mimeType: generatedImage.mime })} className="mt-3 w-full bg-blue-500 text-white text-lg font-bold py-2 px-4 border-4 border-black transition-all transform hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-y-[2px] active:shadow-none hover:bg-blue-600">
                                        Use This Character
                                    </button>
                                </div>
                            )}
                            {!isGenerating && !generationError && !generatedImage && <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Preview Area</p>}
                        </div>
                    </div>
                )}
                {activeTab === 'upload' && (
                    <div className="flex-grow flex flex-col justify-center">
                        <label className="w-full aspect-square max-h-[300px] mx-auto border-4 border-black border-dashed flex flex-col items-center justify-center text-center p-4 cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors">
                            <UploadIcon className="h-10 w-10 text-black mb-2" />
                            <span className="text-xl font-bold">Upload Image</span>
                            <span className="font-inter text-sm text-gray-600 mt-1">PNG, JPG, WEBP</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                        </label>
                    </div>
                )}
                {activeTab === 'camera' && (
                    <div className="flex flex-col flex-grow items-center justify-center">
                        <div className="w-full aspect-video bg-black border-4 border-black flex items-center justify-center overflow-hidden">
                            {cameraError && <p className="text-red-500 font-inter p-4 text-center text-sm">{cameraError}</p>}
                            {capturedImage ? (
                                <img src={capturedImage} alt="Captured character" className="w-full h-full object-contain" />
                            ) : (
                                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-contain ${!stream ? 'hidden' : ''}`}></video>
                            )}
                        </div>
                        <canvas ref={canvasRef} className="hidden"></canvas>

                        <div className="mt-4 flex gap-3 w-full">
                            {capturedImage ? (
                                <>
                                    <button onClick={handleRetake} className="flex-1 bg-white text-black text-lg font-bold py-2 border-4 border-black hover:bg-gray-200 transition-colors">Retake</button>
                                    <button onClick={addCapturedImage} className="flex-[2] bg-blue-500 text-white text-lg font-bold py-2 border-4 border-black hover:bg-blue-600 transition-colors">Use Photo</button>
                                </>
                            ) : (
                                <button onClick={handleCapture} disabled={!stream} className="w-full bg-green-500 text-white text-xl font-bold py-3 border-4 border-black disabled:bg-gray-400 transition-colors">
                                    Capture
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
          .animate-fade-in-fast { animation: fadeIn 0.15s ease-out for; }
      `}</style>
    </div>
  );
};

export default AddCharacterModal;