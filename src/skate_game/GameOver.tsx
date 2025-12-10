
import React from 'react';
import { formatScore } from './GameConstants';
import { GameStats } from './GameTypes';

interface GameOverProps {
    score: number;
    highScore: number;
    stats: GameStats;
    startGame: () => void;
    onMenu: () => void;
}

const GameOver: React.FC<GameOverProps> = ({
    score,
    highScore,
    stats,
    startGame,
    onMenu
}) => {
    return (
        <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center z-20 p-6">
            <h2 className="text-5xl font-black text-white mb-4">GAME OVER</h2>
            <div className="text-3xl font-mono mb-2">{formatScore(score)}</div>
            <div className="text-sm text-white/80 mb-8">
                High Score: {formatScore(highScore)}
            </div>
            
            <div className="flex gap-4 text-center mb-8 bg-black/20 p-4 rounded-lg">
                 <div>
                    <div className="font-bold text-xl">{stats.grinds}</div>
                    <div className="text-xs text-gray-300">GRINDS</div>
                 </div>
                 <div>
                    <div className="font-bold text-xl">{stats.c180}</div>
                    <div className="text-xs text-gray-300">180s</div>
                 </div>
                 <div>
                    <div className="font-bold text-xl">{stats.c360}</div>
                    <div className="text-xs text-gray-300">360s</div>
                 </div>
            </div>

            <button 
                onClick={startGame}
                className="bg-white text-black font-bold py-3 px-8 rounded-xl text-lg shadow-lg"
            >
                TRY AGAIN
            </button>
            <button 
                onClick={onMenu}
                className="mt-4 text-white/70 hover:text-white"
            >
                Menu
            </button>
        </div>
    );
};

export default GameOver;
