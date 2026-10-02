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
            <div className="w-full bg-transparent lg:bg-gray-900/95 backdrop-blur-none lg:backdrop-blur-sm border-b-0 lg:border-b lg:border-white/10 p-0.5 lg:p-3 grid grid-cols-3 items-center pointer-events-auto h-[42px] lg:h-auto">
                
                {/* LEFT: Title & High Score */}
                <div className="flex flex-col justify-center justify-self-start">
                    <div className="flex items-baseline gap-1">
                        <h1 className="text-sm lg:text-3xl font-black italic tracking-tighter text-[#c52323]">
                            INVERT
                        </h1>
                        <span className="hidden lg:inline text-white font-bold text-sm tracking-normal opacity-80">
                            - THE GAME
                        </span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2 text-[8px] lg:text-sm text-gray-400 font-mono leading-none">
                         <span className="uppercase tracking-wider font-bold text-[7px] lg:text-xs">High Score</span>
                         <span className="text-white font-bold text-[9px] lg:text-base">{formatScore(highScore)}</span>
                    </div>
                </div>

                {/* CENTER: Current Score */}
                <div className="flex justify-center justify-self-center items-center w-full">
                    <div className="font-mono text-xl lg:text-5xl font-black text-white drop-shadow-lg tracking-wider leading-none">
                        {formatScore(score)}
                    </div>
                </div>

                {/* RIGHT: Controls & Lives */}
                <div className="flex items-center gap-1 lg:gap-2 justify-self-end">
                    {/* Lives */}
                    <div className="flex gap-0.5 lg:gap-1 bg-black/30 p-0.5 lg:p-1 rounded-full border border-white/5 overflow-hidden max-w-[90px] lg:max-w-[150px]">
                        {livesArray.map((_, i) => (
                            <SkateboardIcon 
                                key={i} 
                                className={`w-2.5 h-2.5 lg:w-5 lg:h-5 transition-all duration-300 ${i < lives ? 'text-[#c52323]' : 'text-gray-700'}`} 
                            />
                        ))}
                    </div>
                    
                    {/* Buttons */}
                    <div className="flex gap-0.5 lg:gap-2">
                        <button 
                            onClick={toggleMute} 
                            className="bg-gray-800/90 lg:bg-gray-800 p-1 lg:p-1.5 rounded-md hover:bg-gray-700 border border-gray-600 text-gray-200"
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <SpeakerXMarkIcon className="w-3 h-3 lg:w-5 lg:h-5" /> : <SpeakerWaveIcon className="w-3 h-3 lg:w-5 lg:h-5" />}
                        </button>
                        
                        <button 
                            onClick={togglePause} 
                            className="bg-gray-800/90 lg:bg-gray-800 p-1 lg:p-1.5 rounded-md hover:bg-gray-700 border border-gray-600 text-gray-200"
                            title={isPaused ? "Resume" : "Pause"}
                        >
                            {isPaused ? <PlayIcon className="w-3 h-3 lg:w-5 lg:h-5" /> : <PauseIcon className="w-3 h-3 lg:w-5 lg:h-5" />}
                        </button>

                        <button 
                            onClick={onExit} 
                            className="bg-gray-800/90 lg:bg-gray-800 px-1.5 py-1 rounded-md hover:bg-gray-700 border border-gray-600 text-[8px] lg:text-xs font-bold uppercase tracking-wider text-gray-200"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            </div>

            {/* BOTTOM BAR (Stats) */}
            {showStats && (
                <div className="w-full bg-gray-900/80 lg:bg-gray-900/95 backdrop-blur-sm border-t border-white/10 p-0.5 lg:p-2 pointer-events-auto">
                    <div className="flex justify-around items-center max-w-3xl mx-auto">
                        <div className="flex flex-col items-center">
                            <span className="text-[7px] lg:text-[10px] uppercase tracking-wider text-gray-500 font-bold">Grinds</span>
                            <span className="font-mono font-bold text-white text-xs lg:text-xl leading-none">{stats.grinds}</span>
                        </div>
                        <div className="w-px h-4 lg:h-6 bg-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[7px] lg:text-[10px] uppercase tracking-wider text-gray-500 font-bold">Jumps</span>
                            <span className="font-mono font-bold text-white text-xs lg:text-xl leading-none">{stats.jumps}</span>
                        </div>
                        <div className="w-px h-4 lg:h-6 bg-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] lg:text-[10px] uppercase tracking-wider text-yellow-500 font-bold">180s</span>
                            <span className="font-mono font-bold text-white text-xs lg:text-xl leading-none">{stats.c180}</span>
                        </div>
                        <div className="w-px h-4 lg:h-6 bg-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] lg:text-[10px] uppercase tracking-wider text-cyan-500 font-bold">360s</span>
                            <span className="font-mono font-bold text-white text-xs lg:text-xl leading-none">{stats.c360}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameHUD;
