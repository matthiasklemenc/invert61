import React from 'react';

// Simple outline video camera icon that matches INVERT FM white-button style.
export default function VideoCameraIcon({ className = "w-6 h-6", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      style={style}
    >
      <path d="M3.5 7.5h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z"/>
      <path d="M14.5 10l6-3v10l-6-3v-4z" />
    </svg>
  );
}