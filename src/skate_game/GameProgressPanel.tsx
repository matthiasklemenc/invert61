import React, { useState } from 'react';
import type { GameProgress } from './GameProgress';

type Props = {
  progress: GameProgress;
  onReset: () => void;
};

const achievementNames: Record<string, string> = {
  FIRST_JUMP: 'First Jump',
  FIRST_SHOP_PURCHASE: 'First Shop Purchase',
  OLD_SCHOOL: 'Old School Question Answered',
  BACKTRACKER: 'Backtracker',
  GARAGE_BREAKIN: 'Garage Opened',
  SOS_QUESTION: 'SOS Question Answered',
  FIREBALL_HOOPER: 'Fireball Hooper',
};

export default function GameProgressPanel({ progress, onReset }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="absolute top-[68px] left-2 z-30 select-none"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <button
        className="hud-button bg-black/75 border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg"
        onClick={() => setOpen(v => !v)}
      >
        🧠 {progress.knowledgePoints}  🎯 {progress.skillPoints}  🎒 {progress.inventory.length}  🏆 {progress.achievements.length}
      </button>

      {open && (
        <div className="mt-2 w-64 max-h-[55vh] overflow-y-auto bg-gray-950/95 border border-gray-600 rounded-xl p-3 shadow-2xl text-xs text-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="font-black tracking-widest text-white">INVERT61 DISCOVERIES</div>
            <button
              className="text-gray-500 hover:text-white text-lg leading-none px-1"
              onClick={() => setOpen(false)}
              aria-label="Close discoveries"
              title="Close"
            >
              ×
            </button>
          </div>

          <div className="mb-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-gray-900 rounded p-2">
                <div className="text-gray-500">KNOWLEDGE</div>
                <div className="text-lg font-bold">{progress.knowledgePoints}</div>
              </div>
              <div className="bg-gray-900 rounded p-2">
                <div className="text-gray-500">SKILL</div>
                <div className="text-lg font-bold">{progress.skillPoints}</div>
              </div>
            </div>
            <div className="text-gray-400 leading-snug">
              2 Knowledge Points and 1 Skill Point are needed for the next level: 1 Knowledge Point in the normal world, 1 in Space, and 1 Skill Point in the Underworld.
            </div>
          </div>

          <section className="mb-3">
            <div className="text-gray-500 font-bold mb-1">INVENTORY</div>
            {progress.inventory.length === 0 ? <div className="text-gray-600">Nothing found yet.</div> : progress.inventory.map(item => <div key={item}>{item === 'Garage Key' ? '🔑 Garage Key' : `• ${item}`}</div>)}
          </section>

          <section>
            <div className="text-gray-500 font-bold mb-1">ACHIEVEMENTS</div>
            {progress.achievements.length === 0 ? <div className="text-gray-600">No achievements yet.</div> : progress.achievements.map(id => <div key={id}>🏆 {achievementNames[id] ?? id}</div>)}
          </section>

          <button
            className="mt-4 w-full bg-red-950/80 border border-red-700/70 text-red-300 px-3 py-2 rounded-lg text-xs font-bold hover:bg-red-900/80"
            onClick={() => {
              if (window.confirm('Reset all INVERT61 discoveries and start from zero?')) {
                onReset();
              }
            }}
          >
            RESET PROGRESS
          </button>
        </div>
      )}
    </div>
  );
}
