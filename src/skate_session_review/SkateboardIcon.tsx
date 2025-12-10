import React from 'react';

const SkateboardIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 40"
      fill="currentColor"
      className={className}
      role="img"
      aria-label="Skateboard icon"
    >
      {/* Deck Path, designed to match the reference image's subtle curve */}
      <path d="M78.1,17.6C75,15.9,69,15,40,15S5,15.9,1.9,17.6C0.7,18.2,0,19,0,20s0.7,1.8,1.9,2.4C5,24.1,11,25,40,25s35-0.9,38.1-2.6C79.3,21.8,80,21,80,20S79.3,18.2,78.1,17.6z" />
      
      {/* Wheels with cutouts, created using compound paths for a clean look on any background */}
      <path fillRule="evenodd" d="M20,38 C15.582,38 12,34.418 12,30 C12,25.582 15.582,22 20,22 C24.418,22 28,25.582 28,30 C28,34.418 24.418,38 20,38 Z M20,32.5 C21.381,32.5 22.5,31.381 22.5,30 C22.5,28.619 21.381,27.5 20,27.5 C18.619,27.5 17.5,28.619 17.5,30 C17.5,31.381 18.619,32.5 20,32.5 Z" />
      <path fillRule="evenodd" d="M60,38 C55.582,38 52,34.418 52,30 C52,25.582 55.582,22 60,22 C64.418,22 68,25.582 68,30 C68,34.418 64.418,38 60,38 Z M60,32.5 C61.381,32.5 62.5,31.381 62.5,30 C62.5,28.619 61.381,27.5 60,27.5 C58.619,27.5 57.5,28.619 57.5,30 C57.5,31.381 58.619,32.5 60,32.5 Z" />
    </svg>
  );
};

export default SkateboardIcon;