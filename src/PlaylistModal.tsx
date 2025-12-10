import React, { useState } from 'react';
import { Song, Playlist } from './types';

const PlaylistModal: React.FC<{
  song: Song;
  onClose: () => void;
  onAddToPlaylist: (playlistId: string, song: Song) => void;
  onCreatePlaylist: (name: string, song: Song) => void;
  playlists: Playlist[];
}> = ({ song, onClose, onAddToPlaylist, onCreatePlaylist, playlists }) => {
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim(), song);
      onClose();
    }
  };

  const handleAdd = (playlistId: string) => {
    onAddToPlaylist(playlistId, song);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add to Playlist</h3>
          <button onClick={onClose} className="text-3xl text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <p className="text-sm text-gray-400 mb-4">
          This song has been added to your general favorites. You can move it to a specific playlist below.
        </p>
        
        <div className="mb-4 max-h-40 overflow-y-auto">
          {playlists.map(p => (
            <button
              key={p.id}
              onClick={() => handleAdd(p.id)}
              className="w-full text-left p-3 hover:bg-gray-700 rounded-md transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="New playlist name..."
            className="flex-grow p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
          />
          <button
            onClick={handleCreate}
            className="bg-indigo-600 text-white font-bold py-3 px-5 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0"
            disabled={!newPlaylistName.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaylistModal;