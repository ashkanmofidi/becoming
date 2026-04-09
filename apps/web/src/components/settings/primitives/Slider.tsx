'use client';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  subtitle?: string;
  showValue?: boolean;
  valueLabel?: string;
  disabled?: boolean;
}

/**
 * Range slider. PRD Section 6 (volume, font size).
 */
export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  subtitle,
  showValue = true,
  valueLabel,
  disabled,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm text-surface-100">{label}</span>
          {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
        </div>
        {showValue && (
          <span className="text-sm font-mono text-surface-300">
            {valueLabel ?? `${value}%`}
          </span>
        )}
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-700
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-md
          disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(to right, #D97706 0%, #D97706 ${percentage}%, #3A3A3A ${percentage}%, #3A3A3A 100%)`,
        }}
      />
    </div>
  );
}
