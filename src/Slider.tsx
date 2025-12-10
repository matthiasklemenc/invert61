import React, { useEffect, useState } from 'react';
import { CircularRestoreIcon } from './Icons';

const Slider: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  onReset: () => void;
  min?: number;
  max?: number;
  step?: number;
  displayValue?: string;
}> = ({ label, value, onChange, onReset, min = 0, max = 2, step = 0.01, displayValue }) => {
  const [internalValue, setInternalValue] = useState(value);
  useEffect(() => setInternalValue(value), [value]);

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const v = parseFloat(e.currentTarget.value);
    setInternalValue(v);
    onChange(v);
  };

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">{label} {displayValue && `(${displayValue})`}</label>
        <button onClick={onReset} title={`Reset ${label}`} className="text-gray-500 hover:text-white transition-colors">
          <CircularRestoreIcon />
        </button>
      </div>
      <input className="slider w-full" type="range" min={min} max={max} step={step} value={internalValue} onInput={handleInput}/>
    </div>
  );
};
export default Slider;