import React from 'react';
import Loader from './Loader';
import { DownloadIcon } from './icons';

interface VideoGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGenerating: boolean;
  statusMessage: string;
  videoUrl: string | null;
  error: string | null;
}

const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({ 
    isOpen, onClose, isGenerating, statusMessage, videoUrl, error 
}) => {
  if (!isOpen) return null;

  const renderContent = () => {
    if (error) {
         return (
             <div className="my-6 bg-red-100 border-4 border-red-500 p-4">
                 <h3 className="text-red-800 text-2xl font-bold">Generation Failed</h3>
                 <p className="font-inter mt-2 text-red-700">{error}</p>
             </div>
         )
    }

    if (isGenerating || !videoUrl) {
        return (
            <div className="my-8">
                <Loader />
                <p className="font-inter mt-4 text-gray-800 text-xl h-6">
                    {statusMessage || 'Preparing...'}
                </p>
            </div>
        );
    }
    
    if (videoUrl) {
         return (
            <div className="my-6">
                <p className="font-inter text-xl mb-4">Your video is ready!</p>
                <video src={videoUrl} controls className="w-full aspect-video border-4 border-black bg-black" />
                <a
                    href={videoUrl}
                    download="tumdah-ai-storyboard.webm"
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-green-500 text-white text-2xl font-bold py-3 px-4 border-4 border-black transition-all transform hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] active:translate-y-[2px] active:shadow-none hover:bg-green-600"
                >
                    <DownloadIcon className="h-6 w-6" />
                    Download Video (.webm)
                </a>
            </div>
        );
    }

    return null;
  };


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
      onClick={onClose}
    >
      <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in-fast { animation: fadeIn 0.2s ease-in-out; }
      `}</style>
      <div
        className="bg-green-300 w-full max-w-2xl text-center p-6 border-4 border-black shadow-[12px_12px_0px_#000]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-4xl font-bold">Video Generation</h2>
        
        {renderContent()}
        
        <button
          onClick={onClose}
          className="mt-4 bg-white text-black text-lg border-4 border-black py-2 px-6 hover:bg-gray-200 transition-all transform hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default VideoGenerationModal;