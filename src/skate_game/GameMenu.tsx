
import React, { useState } from 'react';
import Carousel3D from '../Carousel3D';
import { CHARACTERS } from './DrawingHelpers';
import { CharacterType } from './GameTypes';
import { formatScore, GAME_LOGO_URL, CHARACTER_IMAGE_URLS } from './GameConstants';
import LevelTiles, { getGameLang } from './LevelTiles';

const L1TXT = {
    street: { de: 'GANZES LEVEL SPIELEN', en: 'PLAY THE WHOLE LEVEL', es: 'JUGAR EL NIVEL ENTERO' },
    ball: { de: 'NUR BASKETBALL', en: 'BASKETBALL ONLY', es: 'SOLO BALONCESTO' },
    back: { de: 'Zurück', en: 'Back', es: 'Volver' },
};

interface GameMenuProps {
    highScore: number;
    userName: string;
    setUserName: (name: string) => void;
    character: CharacterType;
    setCharacter: (char: CharacterType) => void;
    startGame: () => void;
    onBasketball?: () => void;
    onExit: () => void;
    level2Unlocked?: boolean;
    onLevel2?: () => void;
    level3Unlocked?: boolean;
    onLevel3?: () => void;
    level3Done?: boolean;
    onLevel4?: () => void;
    level4Done?: boolean;
    onStartOver?: () => void;
}

const GameMenu: React.FC<GameMenuProps> = ({
    highScore,
    userName,
    setUserName,
    character,
    setCharacter,
    startGame,
    onBasketball,
    onExit,
    level2Unlocked,
    onLevel2,
    level3Unlocked,
    onLevel3,
    level3Done,
    onLevel4,
    level4Done,
    onStartOver
}) => {
    const [confirmStartOver, setConfirmStartOver] = useState(false);
    const [pickL1, setPickL1] = useState(false);   // Level 1 tile: whole Street level or only the basketball game
    const [lang] = useState(getGameLang);
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
            
            <div className="relative group w-full max-w-xs mb-4 text-center">
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
                    // the name is saved with every letter; "OK"/Enter only closes the phone keyboard
                    enterKeyHint="done"
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    placeholder={defaultName}
                    className="bg-transparent border-b border-gray-700 w-full text-white text-center font-bold text-xl py-2 focus:border-[#c52323] outline-none uppercase tracking-widest transition-colors placeholder-gray-600 focus:placeholder-gray-800"
                />
            </div>

            {/* Level selection: square tiles for all levels (open / locked / coming soon) */}
            <LevelTiles
                lang={lang}
                tiles={[
                    { level: 1, state: 'open', done: !!level2Unlocked, onPlay: onBasketball ? () => setPickL1(true) : startGame },
                    { level: 2, state: level2Unlocked ? 'open' : 'locked', done: !!level3Unlocked, onPlay: onLevel2 },
                    { level: 3, state: level3Unlocked ? 'open' : 'locked', done: !!level3Done, onPlay: onLevel3 },
                    { level: 4, state: level3Done ? 'open' : 'locked', done: !!level4Done, onPlay: onLevel4 },
                ]}
            />
            <div className="mb-auto pb-8 flex justify-center">
            {level2Unlocked && onStartOver && (
                <div className="flex justify-center">
                    <button
                        onClick={() => setConfirmStartOver(true)}
                        className="text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 font-bold py-2 px-4 rounded-xl text-xs tracking-wider"
                    >
                        ↺ START OVER
                    </button>
                </div>
            )}
            </div>

            {pickL1 && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPickL1(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="text-white font-black text-xl mb-4">LEVEL 1 – STREET</div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => { setPickL1(false); startGame(); }}
                                className="bg-[#c52323] hover:bg-[#e03030] text-white font-black py-3 px-5 rounded-xl tracking-wider"
                            >
                                🛹 {L1TXT.street[lang]}
                            </button>
                            <button
                                onClick={() => { setPickL1(false); onBasketball && onBasketball(); }}
                                className="bg-orange-500 hover:bg-orange-400 text-white font-black py-3 px-5 rounded-xl tracking-wider"
                            >
                                🏀 {L1TXT.ball[lang]}
                            </button>
                            <button onClick={() => setPickL1(false)} className="text-gray-400 hover:text-white text-sm font-bold py-1">{L1TXT.back[lang]}</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmStartOver && onStartOver && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setConfirmStartOver(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="text-white font-black text-xl mb-2">Start over?</div>
                        <div className="text-gray-400 text-sm mb-5">Level 1 points, Level 2, Level 3, Level 4 and the whole saved game will be deleted. You start again at Level 1.</div>
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

        </div>
    );
};

export default GameMenu;

