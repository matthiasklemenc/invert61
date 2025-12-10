import React from 'react';
import { Song } from './types';
import { PlayIcon, PauseIcon } from './Icons';

type Page = 'home' | 'player' | 'my-music' | 'disclaimer';

const MiniPlayer: React.FC<{
  song: Song;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSetPage: (page: Page) => void;
}> = ({ song, isPlaying, onPlayPause, onSetPage }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-2 border-t border-gray-700 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSetPage('player')}>
        <img src={song.album_image} alt={song.name} className="w-12 h-12 rounded-md object-cover" />
        <div>
          <p className="font-semibold text-sm truncate">{song.name}</p>
          <p className="text-xs text-gray-400 truncate">{song.artist_name}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 pr-4">
        <button onClick={(e) => { e.stopPropagation(); onPlayPause(); }} className="text-white">
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </div>
  );
};

export default MiniPlayer;