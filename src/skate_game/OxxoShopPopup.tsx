import React, { useState, useEffect } from 'react';
import { formatScore } from './GameConstants';

interface OxxoShopProps {
    onBuy: (item: 'CHIPS' | 'COKE' | 'KOROVA' | 'LIFE') => void;
    onClose: () => void;
    currentScore: number;
}

const OxxoShopPopup: React.FC<OxxoShopProps> = ({ onBuy, onClose, currentScore }) => {
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    // Clear feedback after a short delay
    useEffect(() => {
        if (feedbackMessage) {
            const timer = setTimeout(() => setFeedbackMessage(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [feedbackMessage]);

    const handleAttemptBuy = (item: 'CHIPS' | 'COKE' | 'KOROVA' | 'LIFE', cost: number) => {
        if (currentScore >= cost) {
            onBuy(item);
            setFeedbackMessage("Bought!");
        } else {
            setFeedbackMessage("Not enough money!");
        }
    };

    const canAffordChips = currentScore >= 5000;
    const canAffordCoke = currentScore >= 10000;
    const canAffordKorova = currentScore >= 67;
    const canAffordLife = currentScore >= 50000;

    return (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border-4 border-[#fbbf24] rounded-xl shadow-2xl overflow-hidden w-full max-w-2xl relative">
                
                {/* Header */}
                <div className="bg-[#dc2626] p-3 flex justify-between items-center border-b-4 border-[#fbbf24]">
                    <div className="flex flex-col">
                        <h2 className="text-white font-black text-2xl tracking-widest drop-shadow-md">OXXO SPACE</h2>
                        <span className="text-xs text-yellow-200 font-mono font-bold">PTS: {formatScore(currentScore)}</span>
                    </div>
                    <button onClick={onClose} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-1 rounded shadow-lg uppercase text-sm border-2 border-white">Exit Shop</button>
                </div>

                {/* Scene */}
                <div className="relative h-64 bg-gray-900 overflow-hidden">
                    {/* Background Wall */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-700"></div>
                    
                    {/* Feedback Message Overlay */}
                    {feedbackMessage && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                            <div className="bg-red-600/90 text-white px-6 py-3 rounded-lg font-black text-xl shadow-xl animate-bounce border-2 border-white">
                                {feedbackMessage}
                            </div>
                        </div>
                    )}
                    
                    {/* Alien Cashier */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-60">
                        <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-lg">
                            {/* Body */}
                            <path d="M30 150 L30 100 Q50 90 70 100 L70 150 Z" fill="#dc2626" /> {/* Red Vest */}
                            <path d="M40 100 L40 150 M60 100 L60 150" stroke="#fbbf24" strokeWidth="2" /> {/* Vest Stripes */}
                            {/* Head */}
                            <ellipse cx="50" cy="60" rx="35" ry="45" fill="#39ff14" />
                            {/* Eyes */}
                            <ellipse cx="35" cy="55" rx="12" ry="18" fill="black" />
                            <ellipse cx="65" cy="55" rx="12" ry="18" fill="black" />
                            <circle cx="38" cy="50" r="3" fill="white" />
                            <circle cx="68" cy="50" r="3" fill="white" />
                            {/* Mouth */}
                            <path d="M45 85 Q50 90 55 85" stroke="black" fill="none" strokeWidth="1"/>
                        </svg>
                    </div>

                    {/* Speech Bubble */}
                    <div className="absolute top-4 left-4 bg-white text-black p-2 rounded-xl rounded-bl-none max-w-[150px] text-xs font-bold shadow-lg animate-bounce">
                        Chips, Coke, Korova Plus? We got it all!
                    </div>

                    {/* Counter */}
                    <div className="absolute bottom-0 w-full h-12 bg-gray-600 border-t-4 border-gray-500"></div>

                    {/* Skater (Back of Head) */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-48">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* Shoulders */}
                            <path d="M10 100 Q50 80 90 100" fill="#333" />
                            {/* Long Blonde Hair */}
                            <path d="M30 60 Q50 90 70 60 L75 90 L25 90 Z" fill="#facc15" />
                            {/* Cap (Backwards) */}
                            <path d="M25 50 Q50 20 75 50" fill="#1d4ed8" />
                            <rect x="35" y="48" width="30" height="5" fill="#1e3a8a" /> {/* Snapback strap */}
                        </svg>
                    </div>
                </div>

                {/* Items Selection */}
                <div className="bg-gray-800 p-4 grid grid-cols-4 gap-4">
                    <button 
                        onClick={() => handleAttemptBuy('CHIPS', 5000)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors group relative hover:bg-gray-700 cursor-pointer ${!canAffordChips ? 'opacity-70' : ''}`}
                    >
                        <div className="w-12 h-12 bg-yellow-400 rounded-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform relative overflow-hidden">
                            <span className="font-black text-red-600 -rotate-12 text-[10px]">CHIPS</span>
                            <div className="absolute top-0 right-0 w-3 h-3 bg-white/30 rounded-bl-full"></div>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-yellow-400 text-xs">Chips</div>
                            <div className="text-[9px] text-gray-400 leading-tight mb-1">Laser + UFOs</div>
                            <div className={`text-[10px] font-mono font-bold ${canAffordChips ? 'text-green-400' : 'text-red-500'}`}>5,000</div>
                        </div>
                    </button>

                    <button 
                        onClick={() => handleAttemptBuy('COKE', 10000)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors group relative hover:bg-gray-700 cursor-pointer ${!canAffordCoke ? 'opacity-70' : ''}`}
                    >
                        <div className="w-12 h-12 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            {/* Coke Bottle SVG */}
                            <svg viewBox="0 0 40 100" className="h-10 w-auto">
                                <path d="M10 10 L30 10 L35 30 L35 90 Q35 100 20 100 Q5 100 5 90 L5 30 Z" fill="#4a0404" /> {/* Dark liquid */}
                                <rect x="5" y="45" width="30" height="20" fill="#dc2626" /> {/* Label */}
                                <path d="M12 55 L28 55" stroke="white" strokeWidth="2" strokeLinecap="round" /> {/* Logo scribble */}
                                <rect x="12" y="0" width="16" height="10" fill="#ef4444" /> {/* Cap */}
                            </svg>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-red-500 text-xs">Coke</div>
                            <div className="text-[9px] text-gray-400 leading-tight mb-1">Speed + Riches</div>
                            <div className={`text-[10px] font-mono font-bold ${canAffordCoke ? 'text-green-400' : 'text-red-500'}`}>10,000</div>
                        </div>
                    </button>

                    <button 
                        onClick={() => handleAttemptBuy('KOROVA', 67)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors group relative hover:bg-gray-700 cursor-pointer ${!canAffordKorova ? 'opacity-70' : ''}`}
                    >
                        <div className="w-12 h-12 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            {/* Tetra Pak SVG */}
                            <svg viewBox="0 0 60 80" className="h-10 w-auto">
                                <path d="M10 20 L50 20 L50 80 L10 80 Z" fill="white" stroke="#ccc" strokeWidth="1" />
                                <path d="M10 20 L30 0 L50 20" fill="#f3f4f6" stroke="#ccc" strokeWidth="1" />
                                <text x="30" y="50" textAnchor="middle" fontSize="10" fontWeight="bold" fill="black">MILK</text>
                                <path d="M25 55 L35 55" stroke="black" strokeWidth="2" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-white text-xs">Korova +</div>
                            <div className="text-[9px] text-gray-400 leading-tight mb-1">Psychedelic</div>
                            <div className={`text-[10px] font-mono font-bold ${canAffordKorova ? 'text-green-400' : 'text-red-500'}`}>67</div>
                        </div>
                    </button>

                    <button 
                        onClick={() => handleAttemptBuy('LIFE', 50000)}
                        className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors group relative hover:bg-gray-700 cursor-pointer ${!canAffordLife ? 'opacity-70' : ''}`}
                    >
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border-2 border-white">
                            <span className="font-black text-white text-lg">1UP</span>
                        </div>
                        <div className="text-center">
                            <div className="font-bold text-green-400 text-xs">Extra Life</div>
                            <div className="text-[9px] text-gray-400 leading-tight mb-1">+1 Skateboard</div>
                            <div className={`text-[10px] font-mono font-bold ${canAffordLife ? 'text-green-400' : 'text-red-500'}`}>50,000</div>
                        </div>
                    </button>
                </div>
                
                <div className="bg-gray-900 p-2 text-center text-[9px] text-gray-500">
                    Buying extends space time by 20s. Effects stack!
                </div>
            </div>
        </div>
    );
};

export default OxxoShopPopup;
