
import React, { useState, useEffect } from 'react';
import useLocalStorage from '../useLocalStorage';
import { TrainedTricks } from '../types';

const TRICK_LIST = [
    "Ollie", "Kickflip", "Heelflip", "Pop Shuvit", 
    "Frontside 180", "Backside 180", "Rock to Fakie", 
    "Axle Stall", "50-50 Grind", "Boardslide"
];

type Props = {
    onBack: () => void;
    onSelectTrick: (trickName: string) => void;
};

const TrickTrainerPage: React.FC<Props> = ({ onBack, onSelectTrick }) => {
    const [trainedTricks] = useLocalStorage<TrainedTricks>('invert-trained-tricks', {});
    const [customTrickName, setCustomTrickName] = useState('');

    const getProgress = (trick: string) => {
        const takes = trainedTricks[trick];
        if (!takes) return 0;
        return takes.filter(t => t && t.length > 0).length;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 flex flex-col">
            <header className="flex items-center justify-between mb-8 relative h-10">
                <button onClick={onBack} className="text-white hover:text-gray-300 transition-colors z-10 p-2 -ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="text-center w-full absolute left-1/2 -translate-x-1/2 pointer-events-none">
                    <h1 className="text-xl font-bold tracking-wider text-gray-100">TRICK TRAINER</h1>
                </div>
            </header>

            <main className="w-full max-w-2xl mx-auto flex-grow">
                <div className="bg-gray-800 p-6 rounded-xl border border-white/5 mb-6">
                    <h2 className="text-lg font-bold mb-4">Train Custom Trick</h2>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={customTrickName}
                            onChange={(e) => setCustomTrickName(e.target.value)}
                            placeholder="e.g. Tre Flip"
                            className="flex-grow bg-gray-700 rounded-lg px-4 py-2 border border-gray-600 focus:border-indigo-500 outline-none"
                        />
                        <button 
                            onClick={() => {
                                if (customTrickName.trim()) {
                                    onSelectTrick(customTrickName.trim());
                                }
                            }}
                            disabled={!customTrickName.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Train
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {TRICK_LIST.map(trick => {
                        const progress = getProgress(trick);
                        const isComplete = progress >= 3;
                        
                        return (
                            <button 
                                key={trick}
                                onClick={() => onSelectTrick(trick)}
                                className="w-full bg-neutral-800 p-4 rounded-lg border border-white/5 flex items-center justify-between hover:bg-neutral-700 transition-colors group"
                            >
                                <div className="text-left">
                                    <div className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{trick}</div>
                                    <div className="text-xs text-gray-400">
                                        {isComplete ? 'Training Complete' : `${progress} / 3 takes recorded`}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`w-2 h-2 rounded-full ${i <= progress ? 'bg-green-500' : 'bg-gray-700'}`} />
                                        ))}
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-white ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default TrickTrainerPage;
