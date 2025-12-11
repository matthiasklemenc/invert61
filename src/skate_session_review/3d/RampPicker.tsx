import React from 'react';
import { RAMP_TYPES, type RampConfig } from '../planner/rampTypes';

interface RampPickerProps {
    config: RampConfig;
    onChange: (cfg: RampConfig) => void;
}

const RampPicker: React.FC<RampPickerProps> = ({ config, onChange }) => {
    const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const ft = parseInt(e.target.value, 10);
        onChange({ ...config, heightFt: ft });
    };

    const handleWidthChange = (level: RampConfig['widthLevel']) => {
        onChange({ ...config, widthLevel: level });
    };

    const handleTypeChange = (typeId: string) => {
        onChange({ ...config, typeId });
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold mb-2">Spot auswählen</h2>
            <p className="text-xs text-gray-400 mb-2">
                Wähle die Rampe/Obstacle, die deinem Spot am ähnlichsten ist. Dann schätze die Höhe.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {RAMP_TYPES.map(rt => {
                    const isActive = rt.id === config.typeId;
                    return (
                        <button
                            key={rt.id}
                            type="button"
                            onClick={() => handleTypeChange(rt.id)}
                            className={`border rounded-lg p-2 text-xs text-left transition
${isActive ? 'border-[#c52323] bg-white/5' : 'border-white/10 bg-black/20'}`}
                        >
                            <div className="font-semibold">{rt.label}</div>
                            <div className="text-[10px] uppercase text-gray-500">
                                {rt.discipline}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4">
                <label className="block text-xs font-semibold mb-1">
                    Rampenhöhe (ca.) in ft
                </label>
                <input
                    type="range"
                    min={2}
                    max={10}
                    step={1}
                    value={config.heightFt}
                    onChange={handleHeightChange}
                    className="w-full"
                />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                    <span>2 ft</span>
                    <span>{config.heightFt} ft</span>
                    <span>10 ft</span>
                </div>
            </div>

            <div className="mt-4">
                <label className="block text-xs font-semibold mb-1">
                    Breite
                </label>
                <div className="flex gap-2">
                    {(['narrow', 'medium', 'wide'] as const).map(level => (
                        <button
                            key={level}
                            type="button"
                            onClick={() => handleWidthChange(level)}
                            className={`px-2 py-1 rounded text-[11px] uppercase tracking-wide
${config.widthLevel === level ? 'bg-white text-black' : 'bg-white/10 text-gray-300'}`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RampPicker;
