import React, { useState } from "react";
import { Song, Playlist } from "./types";
import { PlayIcon, PauseIcon, TrashIcon } from "./Icons";

type Page = "home" | "music" | "player" | "my-music" | "disclaimer";

const MyMusicPage: React.FC<{
  onSetPage: (page: Page) => void;
  favorites: Song[];
  playlists: Playlist[];
  onPlayPlaylist: (songs: Song[], startIndex: number) => void;
  onCreateEmptyPlaylist: (name: string) => void;
  onDeletePlaylist: (id: string) => void;
  onDeleteFromFavorites: (id: string | number) => void;
  onDeleteFromPlaylist: (playlistId: string, songId: string | number) => void;
  onMoveFavoriteToPlaylist: (songId: string, playlistId: string) => void;
  onMovePlaylistSongToFavorites: (songId: string, sourcePlaylistId: string) => void;
  onShowDisclaimer: () => void;
  currentSong: Song | undefined;
  isPlaying: boolean;
  onPlayPause: () => void;
}> = ({
  onSetPage,
  favorites,
  playlists,
  onPlayPlaylist,
  onCreateEmptyPlaylist,
  onDeletePlaylist,
  onDeleteFromFavorites,
  onDeleteFromPlaylist,
  onMoveFavoriteToPlaylist,
  onMovePlaylistSongToFavorites,
  onShowDisclaimer,
  currentSong,
  isPlaying,
  onPlayPause,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isDraggingOverFavorites, setIsDraggingOverFavorites] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ songId: string; sourcePlaylistId?: string } | null>(null);

  // Start dragging (both desktop and mobile support)
  const startDrag = (e: any, songId: string, sourcePlaylistId?: string) => {
    setIsDragging(true);
    setDraggedItem({ songId, sourcePlaylistId });
    document.body.style.overflow = "hidden"; // Disable page scroll while dragging

    // For Desktop (drag event)
    if (e.dataTransfer) {
      e.dataTransfer.setData("songId", songId);
      if (sourcePlaylistId) {
        e.dataTransfer.setData("sourcePlaylistId", sourcePlaylistId);
      }
    }

    // For Mobile (touch events)
    if (e.touches) {
      // Prevent scrolling so we can drag the item
      e.preventDefault(); 
    }
  };

  // End dragging
  const endDrag = () => {
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverId(null);
    setIsDraggingOverFavorites(false);
    document.body.style.overflow = ""; // Re-enable page scroll
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target) return;

    // Check if hovering over playlist
    const playlistZone = target.closest('[data-drop-zone="playlist"]');
    if (playlistZone) {
      const pid = playlistZone.getAttribute('data-playlist-id');
      if (pid) {
          setDragOverId(pid);
          setIsDraggingOverFavorites(false);
          return;
      }
    }

    // Check if hovering over favorites
    const favZone = target.closest('[data-drop-zone="favorites"]');
    if (favZone) {
      setIsDraggingOverFavorites(true);
      setDragOverId(null);
      return;
    }
    
    setDragOverId(null);
    setIsDraggingOverFavorites(false);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || !draggedItem) {
        endDrag();
        return;
    }
    
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (target) {
        // Drop on Playlist
        const playlistZone = target.closest('[data-drop-zone="playlist"]');
        if (playlistZone) {
            const pid = playlistZone.getAttribute('data-playlist-id');
            const { songId, sourcePlaylistId } = draggedItem;
            // Only move if coming from favorites (no sourcePlaylistId)
            if (pid && songId && !sourcePlaylistId) {
                onMoveFavoriteToPlaylist(songId, pid);
            }
        }
        
        // Drop on Favorites
        const favZone = target.closest('[data-drop-zone="favorites"]');
        if (favZone) {
             const { songId, sourcePlaylistId } = draggedItem;
             // Only move if coming from a playlist
             if (songId && sourcePlaylistId) {
                 onMovePlaylistSongToFavorites(songId, sourcePlaylistId);
             }
        }
    }
    endDrag();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateEmptyPlaylist(newPlaylistName);
    setNewPlaylistName("");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 flex flex-col">
      {/* HEADER */}
      <header className="flex items-center justify-between mb-8 relative">
        <button
          onClick={() => onSetPage("music")}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-300 text-center w-full">Favorites</h1>
      </header>

      <main className="w-full max-w-4xl mx-auto flex-grow">
        {/* FAVORITE SONGS */}
        <section
          data-drop-zone="favorites"
          className={`mb-12 transition-all ${
            isDraggingOverFavorites ? "outline outline-2 outline-indigo-500 rounded-lg" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOverFavorites(true);
          }}
          onDragLeave={() => setIsDraggingOverFavorites(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOverFavorites(false);
            const songId = e.dataTransfer.getData("songId");
            const sourcePlaylistId = e.dataTransfer.getData("sourcePlaylistId");
            if (songId && sourcePlaylistId) {
              onMovePlaylistSongToFavorites(songId, sourcePlaylistId);
            }
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Favorite songs - general list</h2>
            {favorites.length > 0 && (
              <button
                onClick={() => onPlayPlaylist(favorites, 0)}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm"
              >
                Play All
              </button>
            )}
          </div>

          {favorites.length > 0 ? (
            <div className="bg-gray-800 rounded-lg p-2">
              {favorites.map((song, index) => {
                const isCurrentlyPlaying = isPlaying && currentSong?.id === song.id;

                return (
                  <div
                    key={song.id}
                    className="group flex items-center p-2 hover:bg-gray-700 rounded-md transition-colors"
                    style={{ touchAction: "none" }}
                  >
                    {/* DRAGGABLE ZONE LEFT */}
                    <div
                      draggable
                      onDragStart={(e) => startDrag(e, song.id.toString())}
                      onDragEnd={endDrag}
                      onTouchStart={(e) => startDrag(e, song.id.toString())}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      style={{
                        flexGrow: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        paddingRight: "10px",
                        cursor: "grab",
                      }}
                    >
                      <img src={song.album_image} className="w-12 h-12 rounded-md object-cover" />
                      <div>
                        <p className="font-semibold">{song.name}</p>
                        <p className="text-sm text-gray-400">{song.artist_name}</p>
                      </div>
                    </div>

                    {/* VERTICAL LINE */}
                    <div
                      style={{
                        width: "1px",
                        backgroundColor: "#555",
                        height: "40px",
                        marginRight: "10px",
                      }}
                    ></div>

                    {/* CONTROLS */}
                    <div className="flex items-center gap-3" style={{ pointerEvents: "auto" }}>
                      <button
                        onClick={() =>
                          isCurrentlyPlaying ? onPlayPause() : onPlayPlaylist(favorites, index)
                        }
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        {isCurrentlyPlaying ? <PauseIcon /> : <PlayIcon />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFromFavorites(song.id);
                        }}
                        className="text-gray-500 hover:text-red-500 p-2"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 bg-gray-800 p-4 rounded-lg">
              You haven't favorited any songs for the general list yet.
            </p>
          )}
        </section>

        {/* PLAYLISTS */}
        <section>
          <h2 className="text-xl font-bold mb-4">Playlists</h2>

          {playlists.length > 0 ? (
            <div className="space-y-6">
              {playlists.map((p) => (
                <div
                  key={p.id}
                  data-drop-zone="playlist"
                  data-playlist-id={p.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverId(p.id);
                  }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverId(null);

                    const songId = e.dataTransfer.getData("songId");
                    const sourcePlaylistId = e.dataTransfer.getData("sourcePlaylistId");

                    if (songId && !sourcePlaylistId) {
                      onMoveFavoriteToPlaylist(songId, p.id);
                    }
                  }}
                  className={`bg-gray-800 rounded-lg p-4 transition-all ${
                    dragOverId === p.id ? "outline outline-2 outline-indigo-500" : ""
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">{p.name}</h3>

                    <div className="flex items-center gap-2">
                      {p.songs.length > 0 && (
                        <button
                          onClick={() => onPlayPlaylist(p.songs, 0)}
                          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm"
                        >
                          Play All
                        </button>
                      )}

                      <button
                        onClick={() => onDeletePlaylist(p.id)}
                        className="text-gray-500 hover:text-red-500 p-2"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {p.songs.map((song, index) => {
                      const isCurrentlyPlaying = isPlaying && currentSong?.id === song.id;

                      return (
                        <div
                          key={song.id}
                          style={{ touchAction: "none" }}
                          className="group flex items-center p-2 hover:bg-gray-700 rounded-md transition-colors"
                        >
                          {/* DRAG ZONE */}
                          <div
                            draggable
                            onDragStart={(e) => startDrag(e, song.id.toString(), p.id)}
                            onDragEnd={endDrag}
                            onTouchStart={(e) => startDrag(e, song.id.toString(), p.id)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            style={{
                              flexGrow: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              paddingRight: "10px",
                              cursor: "grab",
                            }}
                          >
                            <img
                              src={song.album_image}
                              className="w-12 h-12 rounded-md object-cover"
                            />
                            <div>
                              <p className="font-semibold">{song.name}</p>
                              <p className="text-sm text-gray-400">{song.artist_name}</p>
                            </div>
                          </div>

                          {/* VERTICAL LINE */}
                          <div
                            style={{
                              width: "1px",
                              backgroundColor: "#555",
                              height: "40px",
                              marginRight: "10px",
                            }}
                          ></div>

                          {/* CONTROLS */}
                          <div className="flex items-center gap-3" style={{ pointerEvents: "auto" }}>
                            <button
                              onClick={() =>
                                isCurrentlyPlaying
                                  ? onPlayPause()
                                  : onPlayPlaylist(p.songs, index)
                              }
                              className="w-8 h-8 flex items-center justify-center"
                            >
                              {isCurrentlyPlaying ? <PauseIcon /> : <PlayIcon />}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteFromPlaylist(p.id, song.id);
                              }}
                              className="text-gray-500 hover:text-red-500 p-2"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {p.songs.length === 0 && (
                      <p className="text-gray-500 p-2">This playlist is empty.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 bg-gray-800 p-4 rounded-lg">
              You haven't created any playlists yet.
            </p>
          )}

          {/* CREATE PLAYLIST */}
          <form onSubmit={handleCreate} className="mt-6 flex flex-wrap gap-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Create a new playlist..."
              className="flex-grow p-3 bg-gray-700 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
            />
            <button
              type="submit"
              disabled={!newPlaylistName.trim()}
              className="bg-indigo-600 text-white font-bold py-3 px-5 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0"
            >
              Create
            </button>
          </form>
        </section>
      </main>

      <footer className="w-full text-center p-4 mt-4">
        <button
          onClick={onShowDisclaimer}
          className="text-sm text-gray-500 hover:text-gray-300 underline"
        >
          Disclaimer
        </button>
      </footer>
    </div>
  );
};

export default MyMusicPage;
