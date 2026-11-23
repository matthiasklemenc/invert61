
import React, { useState } from 'react';
import Carousel3D from '../Carousel3D';
import { CHARACTERS } from './DrawingHelpers';
import { CharacterType } from './GameTypes';
import { formatScore, GAME_LOGO_URL, CHARACTER_IMAGE_URLS } from './GameConstants';

interface GameMenuProps {
    highScore: number;
    userName: string;
    setUserName: (name: string) => void;
    character: CharacterType;
    setCharacter: (char: CharacterType) => void;
    startGame: () => void;
    onExit: () => void;
    level2Unlocked?: boolean;
    onLevel2?: () => void;
    level3Unlocked?: boolean;
    onLevel3?: () => void;
    onStartOver?: () => void;
}

const GameMenu: React.FC<GameMenuProps> = ({
    highScore,
    userName,
    setUserName,
    character,
    setCharacter,
    startGame,
    onExit,
    level2Unlocked,
    onLevel2,
    level3Unlocked,
    onLevel3,
    onStartOver
}) => {
    const [confirmStartOver, setConfirmStartOver] = useState(false);
    const currentCharacterInfo = CHARACTERS.find(c => c.id === character);
    const defaultName = currentCharacterInfo ? currentCharacterInfo.defaultName.toUpperCase() : "PLAYER";
    const currentCharacterIndex = CHARACTERS.findIndex(c => c.id === character);

    return (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-start z-20 p-6 overflow-y-auto">
            <button 
                onClick={onExit}
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-bold tracking-wider">EXIT</span>
            </button>

            <img 
                src={GAME_LOGO_URL}
                alt="INVERT THE GAME"
                style={{ maxHeight: '18vh' }}
                className="mt-auto w-32 max-w-full h-auto mb-2 object-contain drop-shadow-[0_0_15px_rgba(197,35,35,0.5)]"
            />
            
            <div className="mb-2 text-center">
                 <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">High Score</span>
                 <div className="text-2xl font-mono font-bold text-[#c52323]">{formatScore(highScore)}</div>
            </div>

            <Carousel3D 
                items={CHARACTERS.map(c => ({
                    id: c.id,
                    label: c.name,
                    content: (
                        <img
                            src={CHARACTER_IMAGE_URLS[c.id]}
                            alt={c.name}
                            className="w-full h-full object-cover"
                            style={{ transform: 'scale(1.2)' }}
                            draggable={false}
                        />
                    )
                }))}
                selectedIndex={currentCharacterIndex !== -1 ? currentCharacterIndex : 0}
                onSelect={(index) => {
                    if (index === currentCharacterIndex) {
                        startGame();
                    } else {
                        setCharacter(CHARACTERS[index].id);
                    }
                }}
            />
            
            {/* Level 1 done: choose Level 1 again, Level 2, or start everything over */}
            {level2Unlocked && onLevel2 && (
                <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                        onClick={startGame}
                        className="bg-[#c52323] hover:bg-[#e03030] text-white font-black py-3 px-6 rounded-xl shadow-lg tracking-wider"
                    >
                        ▶ LEVEL 1 AGAIN
                    </button>
                    <button
                        onClick={onLevel2}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3 px-8 rounded-xl shadow-lg tracking-wider"
                    >
                        ▶ LEVEL 2
                    </button>
                    {level3Unlocked && onLevel3 && (
                        <button
                            onClick={onLevel3}
                            className="bg-orange-500 hover:bg-orange-400 text-black font-black py-3 px-8 rounded-xl shadow-lg tracking-wider"
                        >
                            ▶ LEVEL 3
                        </button>
                    )}
                    {onStartOver && (
                        <button
                            onClick={() => setConfirmStartOver(true)}
                            className="text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 font-bold py-3 px-4 rounded-xl text-sm tracking-wider"
                        >
                            ↺ START OVER
                        </button>
                    )}
                </div>
            )}

            {confirmStartOver && onStartOver && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setConfirmStartOver(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="text-white font-black text-xl mb-2">Start over?</div>
                        <div className="text-gray-400 text-sm mb-5">Level 1 points, Level 2, Level 3 and the whole saved game will be deleted. You start again at Level 1.</div>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => { setConfirmStartOver(false); onStartOver(); }}
                                className="bg-[#c52323] hover:bg-[#e03030] text-white font-black py-2 px-5 rounded-lg tracking-wider"
                            >
                                YES, DELETE
                            </button>
                            <button
                                onClick={() => setConfirmStartOver(false)}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-black py-2 px-5 rounded-lg tracking-wider"
                            >
                                NO
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative group w-full max-w-xs mb-auto pb-8 text-center">
                <label className="block text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-2">
                    Choose your own name
                </label>
                <input 
                    type="text"
                    value={userName}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        setUserName(e.target.value);
                        localStorage.setItem('invert-skate-username', e.target.value);
                    }}
                    placeholder={defaultName}
                    className="bg-transparent border-b border-gray-700 w-full text-white text-center font-bold text-xl py-2 focus:border-[#c52323] outline-none uppercase tracking-widest transition-colors placeholder-gray-600 focus:placeholder-gray-800"
                />
            </div>
        </div>
    );
};

export default GameMenu;

