import React from 'react';
import Carousel3D from '../Carousel3D';
import CharacterPreview from './CharacterPreview';
import { CHARACTERS } from './DrawingHelpers';
import { CharacterType } from './GameTypes';
import { formatScore, KAI_IMAGE_URL } from './GameConstants';

interface GameMenuProps {
    highScore: number;
    userName: string;
    setUserName: (name: string) => void;
    character: CharacterType;
    setCharacter: (char: CharacterType) => void;
    startGame: () => void;
    onExit: () => void;
}

const GameMenu: React.FC<GameMenuProps> = ({
    highScore,
    userName,
    setUserName,
    character,
    setCharacter,
    startGame,
    onExit
}) => {
    const currentCharacterInfo = CHARACTERS.find(c => c.id === character);
    const defaultName = currentCharacterInfo ? currentCharacterInfo.defaultName.toUpperCase() : "PLAYER";
    const currentCharacterIndex = CHARACTERS.findIndex(c => c.id === character);

    return (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 p-6 overflow-y-auto">
            <button 
                onClick={onExit}
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-bold tracking-wider">EXIT</span>
            </button>

            {/* ✅ FIXED: correct path for mobile + GitHub Pages */}
            <img 
                src="./asstes/game/invert_the_game_transpartent_small.png"
                alt="INVERT THE GAME"
                className="w-32 max-w-full h-auto mb-2 object-contain drop-shadow-[0_0_15px_rgba(197,35,35,0.5)]"
            />
            
            <div className="mb-4 text-center">
                 <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">High Score</span>
                 <div className="text-2xl font-mono font-bold text-[#c52323]">{formatScore(highScore)}</div>
            </div>

            <p className="text-gray-400 mb-4 text-center text-xs md:text-sm max-w-md leading-relaxed">
                Tap=Ollie | Swipe=Flip | 2xTap=180 | 3xTap=360<br/>
                Rapid Tap on Hydrant = Natas Spin
            </p>

            <Carousel3D 
                items={CHARACTERS.map(c => ({
                    id: c.id,
                    label: c.name,
                    content: c.id === 'male_cap' ? (
                        <img 
                            src={KAI_IMAGE_URL} 
                            alt="Kai" 
                            className="w-full h-full object-cover"
                            style={{ transform: 'scale(1.2)' }}
                        />
                    ) : (
                        <CharacterPreview charId={c.id} />
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
            
            <div className="relative group w-full max-w-xs mb-8 text-center">
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
