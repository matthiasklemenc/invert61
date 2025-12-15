
import React, { useState } from 'react';
import { Stance, UserSettings } from '../types';

interface OnboardingProps {
  onComplete: (settings: UserSettings) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [stance, setStance] = useState<Stance>(Stance.Regular);

  const handleSubmit = () => {
    onComplete({ stance });
  };

  const OptionButton: React.FC<{
    onClick: () => void;
    label: string;
    isActive: boolean;
  }> = ({ onClick, label, isActive }) => (
    <button
      onClick={onClick}
      className={`w-full py-3 px-4 rounded-lg border-2 transition-all duration-200 ${
        isActive
          ? 'bg-cyan-400 text-gray-900 border-cyan-400 font-bold'
          : 'bg-gray-800 border-gray-600 hover:border-cyan-400'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col items-center text-center p-4 bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2 text-cyan-300">Welcome, Skater!</h2>
      <p className="text-gray-400 mb-8">Let's get you set up for accurate tracking.</p>

      <div className="w-full space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">What's your stance?</h3>
          <div className="grid grid-cols-2 gap-4">
            <OptionButton
              onClick={() => setStance(Stance.Regular)}
              label="Regular"
              isActive={stance === Stance.Regular}
            />
            <OptionButton
              onClick={() => setStance(Stance.Goofy)}
              label="Goofy"
              isActive={stance === Stance.Goofy}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-10 w-full bg-green-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-green-400 transition-colors duration-200 shadow-lg"
      >
        Start Skating
      </button>
    </div>
  );
};

export default Onboarding;
