'use client';

import { useState } from 'react';
import { COLORS } from '@becoming/shared';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
  disabled?: boolean;
}

/**
 * Color picker with 8 presets + custom hex. PRD Section 6.3.
 */
export function ColorPicker({ value, onChange, label, disabled }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customHex, setCustomHex] = useState(value);

  return (
    <div className={`${disabled ? 'opacity-50' : ''}`}>
      <span className="text-sm text-surface-100 block mb-2">{label}</span>
      <div className="flex flex-wrap gap-2">
        {COLORS.ACCENT_PRESETS.map((color) => (
          <button
            key={color}
            onClick={() => !disabled && onChange(color)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              value === color ? 'border-white scale-110' : 'border-transparent hover:border-surface-500'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
        <button
          onClick={() => !disabled && setShowCustom(!showCustom)}
          className={`w-8 h-8 rounded-full border-2 border-dashed border-surface-500 flex items-center justify-center text-surface-500 text-xs hover:border-surface-300 transition-colors`}
        >
          #
        </button>
      </div>
      {showCustom && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            onBlur={() => {
              if (/^#[0-9A-Fa-f]{6}$/.test(customHex)) {
                onChange(customHex);
              }
            }}
            placeholder="#D97706"
            className="bg-surface-900 border border-surface-700 text-sm font-mono px-2 py-1 rounded w-24 text-surface-100 outline-none focus:border-amber"
            maxLength={7}
          />
          <div className="w-6 h-6 rounded-full border border-surface-700" style={{ backgroundColor: customHex }} />
        </div>
      )}
    </div>
  );
}
