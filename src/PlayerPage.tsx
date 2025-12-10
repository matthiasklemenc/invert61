// C:\Users\user\Desktop\invert\build\PlayerPage.tsx

import React, { useRef, useState, useEffect } from 'react';
import { Song } from './types';
import Slider from './Slider';
import { PrevIcon, NextIcon, PlayIcon, PauseIcon, HeartIcon, DownloadIcon } from './Icons';

type Page = 'home' | 'music' | 'player' | 'my-music' | 'disclaimer';

const PlayerPage: React.FC<{
  song: Song;
  onSetPage: (page: Page) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevSong: () => void;
  onNextSong: () => void;
  playlistLength: number;
  isFavorited: (id: string | number) => boolean;
  onHeartClick: (song: Song) => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;

  volume: number;  onVolumeChange: (v: number) => void;
  speed: number;   onSpeedChange: (s: number) => void;
  keyVal: number;  onKeyChange: (p: number) => void;
  treble: number;  onTrebleChange: (t: number) => void;
  booster: number; onBoosterChange: (b: number) => void;

  /** Plate Reverb wet mix (0..1) */
  reverb: number;  onReverbChange: (r: number) => void;

  onShowLicense: () => void;
  // open the EQ modal
  onShowEqualizer: () => void;

  /** repeat toggle */
  repeat: boolean;
  onToggleRepeat: () => void;
}> = ({
  song, onSetPage, isPlaying, onPlayPause, onPrevSong, onNextSong, playlistLength,
  isFavorited, onHeartClick, currentTime, duration, onSeek,
  volume, onVolumeChange, speed, onSpeedChange, keyVal, onKeyChange, treble, onTrebleChange, booster, onBoosterChange,
  reverb, onReverbChange,
  onShowLicense, onShowEqualizer,
  repeat, onToggleRepeat
}) => {
  const isSeekingRef = useRef(false);
  const [sliderTime, setSliderTime] = useState(0);

  // WATCHDOG: wenn ein Track "spielen sollte", aber nach 4s immer noch bei ~0s steht,
  // skippe automatisch zum nächsten Track.
  const watchdogTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // alten Timer löschen
    if (watchdogTimeoutRef.current !== null) {
      window.clearTimeout(watchdogTimeoutRef.current);
      watchdogTimeoutRef.current = null;
    }

    // Nur Watchdog starten, wenn:
    // - gerade "playing" angezeigt wird
    // - die Zeit praktisch noch am Anfang ist (Song soll gerade starten)
    if (!isPlaying) return;
    if (currentTime > 0.5) return;

    // 4-Sekunden-Watchdog
    watchdogTimeoutRef.current = window.setTimeout(() => {
      // WICHTIG: Dieser Callback läuft nur, wenn sich innerhalb von 4s
      // weder isPlaying noch currentTime verändert haben.
      // (Sobald sich etwas bewegt, wird der Effekt neu ausgeführt und der Timer gelöscht.)
      if (isPlaying && currentTime <= 0.5) {
        // Track scheint "tot" zu sein -> automatisch weiter
        onNextSong();
      }
    }, 4000);

    // Cleanup, falls sich Dependencies ändern oder Komponente unmountet
    return () => {
      if (watchdogTimeoutRef.current !== null) {
        window.clearTimeout(watchdogTimeoutRef.current);
        watchdogTimeoutRef.current = null;
      }
    };
  }, [isPlaying, currentTime, song.id, onNextSong]);

  useEffect(() => {
    if (!isSeekingRef.current) setSliderTime(currentTime);
  }, [currentTime]);

  const handleTimeSliderInput = (e: React.FormEvent<HTMLInputElement>) => {
    const time = parseFloat(e.currentTarget.value);
    setSliderTime(time);
    if (!isSeekingRef.current) onSeek(time);
  };
  const handleSeekMouseDown = () => { isSeekingRef.current = true; };
  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    isSeekingRef.current = false;
    onSeek(parseFloat(e.currentTarget.value));
  };
  const handleSeekTouchUp = (e: React.TouchEvent<HTMLInputElement>) => {
    isSeekingRef.current = false;
    onSeek(parseFloat(e.currentTarget.value));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => onSetPage('music')}
            aria-label="Back to Music"
            className="text-white hover:text-gray-300 transition-colors inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-700/60 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-gray-400">Back</span>
        </div>

        <div className="relative max-w-[200px] mx-auto">
          <img
            src={song.album_image}
            alt={song.name}
            className="w-full h-auto object-cover rounded-lg shadow-md aspect-square"
          />
        </div>

        {/* Actions row: Heart — EQ — Download (öffnet jetzt License-Popup) */}
        <div className="flex justify-around items-center w-full max-w-[200px] mx-auto px-2 mt-4">
          <button
            onClick={() => onHeartClick(song)}
            aria-label={isFavorited(song.id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            <HeartIcon filled={isFavorited(song.id)} />
          </button>

          {/* Equalizer button */}
          <button
            onClick={onShowEqualizer}
            aria-label="Equalizer"
            className="text-white hover:text-gray-300 transition-colors"
            title="Equalizer"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="3" width="2" height="18" rx="1" fill="currentColor" />
              <rect x="11" y="3" width="2" height="18" rx="1" fill="currentColor" />
              <rect x="17" y="3" width="2" height="18" rx="1" fill="currentColor" />
              <circle cx="6" cy="16" r="3" fill="currentColor" />
              <circle cx="12" cy="8" r="3" fill="currentColor" />
              <circle cx="18" cy="12" r="3" fill="currentColor" />
            </svg>
          </button>

          {song.audiodownload_allowed && (
            <button
              type="button"
              onClick={onShowLicense}
              aria-label="Show license and download options"
              className="text-white hover:text-gray-300 transition-colors"
            >
              <DownloadIcon />
            </button>
          )}
        </div>

        <div className="text-center mt-4 mb-4">
          <h2 className="text-3xl font-bold truncate">{song.name}</h2>
          <p className="text-gray-400 text-lg truncate">{song.artist_name}</p>
          <div className="flex justify-center items-center gap-2 mt-2">
            {song.genre && (
              <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                {song.genre}
              </span>
            )}
            {song.license && (
              <button
                onClick={onShowLicense}
                className="text-xs bg-blue-800 px-2 py-1 rounded-full hover:bg-blue-700 transition"
              >
                License
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <span>{formatTime(sliderTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={sliderTime}
            onInput={handleTimeSliderInput}
            onMouseDown={handleSeekMouseDown}
            onMouseUp={handleSeekMouseUp}
            onTouchStart={handleSeekMouseDown}
            onTouchEnd={handleSeekTouchUp}
            className="slider w-full"
          />
          <span>{formatTime(duration)}</span>
        </div>

        {/* Transport row: Prev — Play/Pause — Next — Repeat */}
        <div className="flex justify-center items-center space-x-6 mb-6">
          <button
            onClick={onPrevSong}
            className="transport-btn press-flash-red disabled:opacity-50"
            disabled={playlistLength <= 1}
            aria-label="Previous"
          >
            <PrevIcon />
          </button>

          <button
            onClick={onPlayPause}
            className="transport-btn press-flash-red rounded-full w-14 h-14 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button
            onClick={onNextSong}
            className="transport-btn press-flash-red disabled:opacity-50"
            disabled={playlistLength <= 1}
            aria-label="Next"
          >
            <NextIcon />
          </button>

          {/* Repeat button: stays red when active */}
          <button
            onClick={onToggleRepeat}
            aria-pressed={repeat}
            aria-label={repeat ? 'Disable repeat' : 'Enable repeat'}
            className="transport-btn press-flash-red"
            style={{ color: repeat ? '#c52323' : undefined }}
            title={repeat ? 'Repeat: ON' : 'Repeat: OFF'}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7.5 7H15a4 4 0 0 1 0 8h-1.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 7l2.5-2.5M7.5 7l2.5 2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 17H9a 4 4 0 0 1 0-8h1.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 17l-2.5 2.5M16.5 17l-2.5-2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Controls grid — 6 sliders (inkl. Plate Reverb) */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Slider
            label="Volume"
            value={volume}
            onChange={onVolumeChange}
            onReset={() => onVolumeChange(0.5)}
            max={1}
          />
          <Slider
            label="Speed"
            value={speed}
            onChange={onSpeedChange}
            onReset={() => onSpeedChange(1)}
            min={0.5}
            max={2}
          />
          <Slider
            label="Treble"
            value={treble}
            onChange={onTrebleChange}
            onReset={() => onTrebleChange(0)}
            max={1}
          />
          <Slider
            label="Bass-Booster"
            value={booster}
            onChange={onBoosterChange}
            onReset={() => onBoosterChange(0)}
            max={1}
          />
          <Slider
            label="Key"
            value={keyVal}
            onChange={onKeyChange}
            onReset={() => onKeyChange(0)}
            min={-6}
            max={6}
            step={1}
            displayValue={`${keyVal > 0 ? '+' : ''}${keyVal}st`}
          />
          <Slider
            label="Plate Reverb"
            value={reverb}
            onChange={onReverbChange}
            onReset={() => onReverbChange(0)}
            min={0}
            max={1}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;