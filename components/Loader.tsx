import React from 'react';

interface LoaderProps {
  small?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ small = false }) => {
  const sizeClasses = small ? 'h-5 w-5' : 'h-12 w-12';
  const borderClasses = small ? 'border-2' : 'border-4';

  return (
    <div
      className={`${sizeClasses} ${borderClasses} border-t-green-500 border-r-green-500 border-b-green-500 border-l-transparent rounded-full animate-spin`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader;