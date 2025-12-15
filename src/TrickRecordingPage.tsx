
import React, { useState } from 'react';
import { useMotionRecorder, RecorderStatus } from './useMotionRecorder';
import useLocalStorage from './useLocalStorage';
import { TrainedTricks } from './types';

const MAX_TAKES = 5;

type Props = {
    trickName: string;
    onBack: () => void;
};

const statusMessages: Record<RecorderStatus, string> = {
    idle: "Ready to Record",
    permission: "Requesting sensor access...",
    arming: "Place phone in pocket. Waiting for you to be still...",
    armed: "ARMED! Perform the trick now.",
    recording: "RECORDING...",
    confirming: "Was that a good take?",
    denied: "Sensor access was denied. Please grant permission in your browser settings.",
    error: "An error occurred with the motion sensors.",
};

const TrickRecordingPage: React.FC<Props> = ({ trickName, onBack }) => {
    const [trainedTricks, setTrainedTricks] = useLocalStorage<TrainedTricks>('invert-trained-tricks', {});
    const { status, startRecordingAttempt, confirmTake, discardTake, recordedData } = useMotionRecorder();
    const [activeTake, setActiveTake] = useState<number | null>(null);

    const takes = trainedTricks[trickName] || [];

    const handleStart = (takeIndex: number) => {
        setActiveTake(takeIndex);
        startRecordingAttempt();
    };

    const handleConfirm = () => {
        if (activeTake === null || !recordedData) return;
        const newTakes = [...takes];
        newTakes[activeTake] = recordedData;
        setTrainedTricks(prev => ({ ...prev, [trickName]: newTakes }));
        confirmTake();
        setActiveTake(null);
    };
    
    const handleDiscard = () => {
        discardTake();
        setActiveTake(null);
    };
    
    const isRecordingOrConfirming = status !== 'idle' && status !== 'error' && status !== 'denied';

    const renderStatusUI = () => (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="text-4xl mb-6 animate-pulse">
                {status === 'arming' && '⏳'}
                {status === 'armed' && '🔴'}
                {status === 'recording' && '🛹'}
                {status === 'confirming' && '🤔'}
            </div>
            <p className="text-2xl font-bold text-white mb-8">{statusMessages[status]}</p>
            
            {status === 'confirming' ? (
                <div className="flex gap-4">
                    <button onClick={handleConfirm} className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg transition-colors">Yes, Save</button>
                    <button onClick={handleDiscard} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 rounded-lg transition-colors">No, Discard</button>
                </div>
            ) : (
                <button 
                    onClick={handleDiscard} 
                    className="mt-8 text-gray-400 hover:text-white border border-gray-600 hover:border-white px-6 py-2 rounded-full transition-colors text-sm uppercase tracking-widest"
                >
                    Cancel
                </button>
            )}
        </div>
    );
    
    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 flex flex-col">
            {isRecordingOrConfirming && renderStatusUI()}

            <header className="flex items-center justify-between mb-8 relative h-10">
                <button onClick={onBack} className="text-white hover:text-gray-300 transition-colors z-10 p-2 -ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="text-center w-full absolute left-1/2 -translate-x-1/2 pointer-events-none">
                    <h1 className="text-xl font-bold tracking-wider text-gray-100">Train: {trickName}</h1>
                </div>
            </header>

            <main className="w-full max-w-2xl mx-auto flex-grow">
                <p className="text-gray-400 text-center mb-6 text-sm">Record at least 3 clean takes of the trick. The more, the better the recognition will be.</p>
                
                <div className="space-y-3">
                    {Array.from({ length: MAX_TAKES }).map((_, index) => {
                        const isRecorded = !!takes[index];
                        return (
                            <div key={index} className="bg-neutral-800 rounded-lg p-4 flex items-center justify-between border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isRecorded ? 'bg-green-500 text-white' : 'bg-neutral-700 text-gray-400'}`}>
                                        {isRecorded ? '✓' : index + 1}
                                    </div>
                                    <span className={`font-semibold ${isRecorded ? 'text-white' : 'text-gray-400'}`}>{trickName} #{index + 1}</span>
                                </div>
                                <button
                                    onClick={() => handleStart(index)}
                                    className={`font-bold py-2 px-5 rounded-md transition-colors text-sm ${isRecorded ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-[#c52323] text-white hover:bg-[#a91f1f]'}`}
                                >
                                    {isRecorded ? 'Redo' : 'Record'}
                                </button>
                            </div>
                        );
                    })}
                </div>
                
                {(status === 'error' || status === 'denied') && (
                    <div className="mt-6 p-4 bg-red-900/50 text-red-200 border border-red-500/30 rounded-lg text-center">
                       {statusMessages[status]}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TrickRecordingPage;
