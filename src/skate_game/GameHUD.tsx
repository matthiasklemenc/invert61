import React from 'react';
import SkateboardIcon from '../skate_session_review/SkateboardIcon';
import { PauseIcon, PlayIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from './GameIcons';
import { formatScore } from './GameConstants';
import { GameStats } from './GameTypes';

interface GameHUDProps {
    score: number;
    highScore: number;
    lives: number;
    isMuted: boolean;
    toggleMute: () => void;
    isPaused: boolean;
    togglePause: () => void;
    onExit: () => void;
    stats: GameStats;
    showStats: boolean;
}

const GameHUD: React.FC<GameHUDProps> = ({
    score,
    highScore,
    lives,
    isMuted,
    toggleMute,
    isPaused,
    togglePause,
    onExit,
    stats,
    showStats
}) => {
    // Dynamically show as many lives as the player has, defaulting to at least 3 placeholders for alignment
    const livesArray = Array.from({length: Math.max(3, lives)});

    return (
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-10">
            {/* TOP BAR */}
            <div className="w-full bg-gray-900/95 backdrop-blur-sm border-b border-white/10 p-1 md:p-3 grid grid-cols-3 items-center pointer-events-auto h-[60px] md:h-auto">
                
                {/* LEFT: Title & High Score */}
                <div className="flex flex-col justify-center justify-self-start">
                    <div className="flex items-baseline gap-1">
                        <h1 className="text-lg md:text-3xl font-black italic tracking-tighter text-[#c52323]">
                            INVERT
                        </h1>
                        <span className="hidden md:inline text-white font-bold text-sm tracking-normal opacity-80">
                            - THE GAME
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 font-mono leading-none">
                         <span className="uppercase tracking-wider font-bold text-[9px] md:text-xs">High Score</span>
                         <span className="text-white font-bold">{formatScore(highScore)}</span>
                    </div>
                </div>

                {/* CENTER: Current Score */}
                <div className="flex justify-center justify-self-center items-center w-full">
                    <div className="font-mono text-3xl md:text-5xl font-black text-white drop-shadow-lg tracking-wider leading-none">
                        {formatScore(score)}
                    </div>
                </div>

                {/* RIGHT: Controls & Lives */}
                <div className="flex items-center gap-2 justify-self-end">
                    {/* Lives */}
                    <div className="flex gap-0.5 md:gap-1 bg-black/30 p-1 rounded-full border border-white/5 overflow-hidden max-w-[150px]">
                        {livesArray.map((_, i) => (
                            <SkateboardIcon 
                                key={i} 
                                className={`w-3 h-3 md:w-5 md:h-5 transition-all duration-300 ${i < lives ? 'text-[#c52323]' : 'text-gray-700'}`} 
                            />
                        ))}
                    </div>
                    
                    {/* Buttons */}
                    <div className="flex gap-1 md:gap-2">
                        <button 
                            onClick={toggleMute} 
                            className="bg-gray-800 p-1.5 rounded-md hover:bg-gray-700 border border-gray-600 text-gray-200"
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <SpeakerXMarkIcon className="w-4 h-4 md:w-5 md:h-5" /> : <SpeakerWaveIcon className="w-4 h-4 md:w-5 md:h-5" />}
                        </button>
                        
                        <button 
                            onClick={togglePause} 
                            className="bg-gray-800 p-1.5 rounded-md hover:bg-gray-700 border border-gray-600 text-gray-200"
                            title={isPaused ? "Resume" : "Pause"}
                        >
                            {isPaused ? <PlayIcon className="w-4 h-4 md:w-5 md:h-5" /> : <PauseIcon className="w-4 h-4 md:w-5 md:h-5" />}
                        </button>

                        <button 
                            onClick={onExit} 
                            className="bg-gray-800 px-2 py-1.5 rounded-md hover:bg-gray-700 border border-gray-600 text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-200"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            </div>

            {/* BOTTOM BAR (Stats) */}
            {showStats && (
                <div className="w-full bg-gray-900/95 backdrop-blur-sm border-t border-white/10 p-1 md:p-2 pointer-events-auto">
                    <div className="flex justify-around items-center max-w-3xl mx-auto">
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-gray-500 font-bold">Grinds</span>
                            <span className="font-mono font-bold text-white text-sm md:text-xl leading-none">{stats.grinds}</span>
                        </div>
                        <div className="w-px h-6 bg-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-gray-500 font-bold">Jumps</span>
                            <span className="font-mono font-bold text-white text-sm md:text-xl leading-none">{stats.jumps}</span>
                        </div>
                        <div className="w-px h-6 bg-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-yellow-500 font-bold">180s</span>
                            <span className="font-mono font-bold text-white text-sm md:text-xl leading-none">{stats.c180}</span>
                        </div>
                        <div className="w-px h-6 bg-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-cyan-500 font-bold">360s</span>
                            <span className="font-mono font-bold text-white text-sm md:text-xl leading-none">{stats.c360}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameHUD;
