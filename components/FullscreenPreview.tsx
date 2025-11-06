import React from 'react';

interface HoverPreviewProps {
  imageUrl: string;
  position: { x: number; y: number };
}

const HoverPreview: React.FC<HoverPreviewProps> = ({ imageUrl, position }) => {
  const style: React.CSSProperties = {
    // Position the preview relative to the cursor, with an offset
    // to avoid flickering. Also, ensure it doesn't go off-screen.
    top: `min(calc(100vh - 21rem), ${position.y + 20}px)`, // 21rem is approx. height + padding
    left: `min(calc(100vw - 21rem), ${position.x + 20}px)`, // 21rem is approx. width + padding
    pointerEvents: 'none', // Prevent the preview from capturing mouse events
  };

  return (
    <div
      className="fixed z-[100] w-80 h-80 bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-1 animate-fade-in-fast"
      style={style}
      role="tooltip"
    >
      <img
        src={imageUrl}
        alt="Shot Preview"
        className="w-full h-full object-cover"
      />
       <style>{`
          @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in-fast {
              animation: fadeIn 0.15s ease-out;
          }
      `}</style>
    </div>
  );
};

export default HoverPreview;
