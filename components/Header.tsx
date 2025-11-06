import React from 'react';
import { TumdahLogoIcon } from './icons';

interface HeaderProps {
    onGoHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGoHome }) => {
  return (
    <header className="bg-green-300 border-b-4 border-black sticky top-0 z-40 shadow-[0_8px_0px_#000]">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-center md:justify-start h-20">
          <button onClick={onGoHome} className="flex items-center space-x-4 bg-white border-4 border-black p-2 -mb-5 shadow-[8px_8px_0px_#000] focus:outline-none focus:ring-4 focus:ring-green-400 transition-all duration-200">
            <TumdahLogoIcon className="h-10 w-10 text-black" />
            <h1 className="text-2xl md:text-4xl text-black">
              Tumdah AI Studio
            </h1>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;