import React, { useState } from 'react';
import type { GameProgress } from './GameProgress';

type Props = {
  progress: GameProgress;
  onReset: () => void;
};

const achievementNames: Record<string, string> = {
  FIRST_JUMP: 'First Jump',
  FIRST_SHOP_PURCHASE: 'First Shop Purchase',
  SECRET_HUNTER: 'Secret Hunter',
  OLD_SCHOOL: 'Old School',
  BACKTRACKER: 'Backtracker',
  GARAGE_BREAKIN: 'Garage Break-In',
};

export default function GameProgressPanel({ progress, onReset }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="absolute top-1 left-1 lg:top-[96px] lg:left-2 z-30 select-none"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <button
        className="hud-button bg-black/75 border border-white/20 text-white px-2 py-1 rounded-lg text-[10px] lg:text-xs font-bold shadow-lg"
        onClick={() => setOpen(v => !v)}
      >
        🧠 {progress.knowledgePoints}  🎯 {progress.skillPoints}  🎒 {progress.inventory.length}  🏆 {progress.achievements.length}
      </button>

      {open && (
        <div className="mt-2 w-64 max-h-[55vh] overflow-y-auto bg-gray-950/95 border border-gray-600 rounded-xl p-3 shadow-2xl text-xs text-gray-200">
          <div className="font-black tracking-widest text-white mb-3">INVERT61 DISCOVERIES</div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-900 rounded p-2"><div className="text-gray-500">KNOWLEDGE</div><div className="text-lg font-bold">{progress.knowledgePoints}</div></div>
            <div className="bg-gray-900 rounded p-2"><div className="text-gray-500">SECRETS</div><div className="text-lg font-bold">{progress.unlockedAreas.length}</div></div>
          </div>

          <section className="mb-3">
            <div className="text-gray-500 font-bold mb-1">INVENTORY</div>
            {progress.inventory.length === 0 ? <div className="text-gray-600">Nothing found yet.</div> : progress.inventory.map(item => <div key={item}>• {item}</div>)}
          </section>

          <section className="mb-3">
            <div className="text-gray-500 font-bold mb-1">CODES</div>
            {progress.codes.length === 0 ? <div className="text-gray-600">No codes discovered.</div> : progress.codes.map(code => <div key={code}>🔢 {code}</div>)}
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
