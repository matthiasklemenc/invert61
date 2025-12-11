import React from 'react';
import { FLAT_TRICK_BLOCKS, TRANSITION_TRICK_BLOCKS, type TrickBlock } from '../planner/trickBlocks';

interface TrickBlocksPanelProps {}

const makeDragStart = (block: TrickBlock) => (e: React.DragEvent<HTMLButtonElement>) => {
    e.dataTransfer.setData('text/plain', block.id);
    e.dataTransfer.effectAllowed = 'copyMove';
};

const TrickBlocksPanel: React.FC<TrickBlocksPanelProps> = () => {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold">Trick-Bausteine</h2>
            <p className="text-xs text-gray-400">
                Zieh die Blöcke auf deine Fahrspur. Sie werden automatisch an die Line gesnappt.
            </p>

            <div>
                <h3 className="text-xs font-semibold uppercase text-gray-400 mb-1">Flatground</h3>
                <div className="flex flex-wrap gap-2">
                    {FLAT_TRICK_BLOCKS.map(block => (
                        <button
                            key={block.id}
                            draggable
                            onDragStart={makeDragStart(block)}
                            className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold"
                        >
                            {block.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xs font-semibold uppercase text-gray-400 mb-1">Transition</h3>
                <div className="flex flex-wrap gap-2">
                    {TRANSITION_TRICK_BLOCKS.map(block => (
                        <button
                            key={block.id}
                            draggable
                            onDragStart={makeDragStart(block)}
                            className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold"
                        >
                            {block.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrickBlocksPanel;
