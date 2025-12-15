
import React, { useEffect, useRef } from 'react';
import { drawStickman } from './DrawingHelpers';
import { CharacterType } from './GameTypes';

type Props = {
    charId: CharacterType;
    className?: string;
};

const CharacterPreview: React.FC<Props> = ({ charId, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            // Clear transparent
            ctx.clearRect(0, 0, 200, 300);
            
            // Draw stickman larger and centered
            ctx.save();
            // Scale up slightly for the preview
            ctx.translate(100, 180); 
            ctx.scale(2.5, 2.5); 
            
            drawStickman(ctx, charId, 0, 0, 0, 'RUNNING', 0, '', false);
            ctx.restore();
        }
    }, [charId]);

    return (
        <canvas 
            ref={canvasRef} 
            width={200} 
            height={300} 
            className={className || "w-full h-full object-contain"} 
        />
    );
};

export default CharacterPreview;