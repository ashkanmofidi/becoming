'use client';

interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentOption[];
  label: string;
  subtitle?: string;
  disabled?: boolean;
}

/**
 * Segmented control for discrete options.
 * PRD Section 6.3 (font size detents, animation intensity).
 */
export function SegmentedControl({
  value,
  onChange,
  options,
  label,
  subtitle,
  disabled,
}: SegmentedControlProps) {
  return (
    <div className={`${disabled ? 'opacity-50' : ''}`}>
      <div className="mb-2">
        <span className="text-sm text-surface-100">{label}</span>
        {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex bg-surface-900 rounded-lg p-0.5 gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            className={`
              flex-1 py-1.5 px-3 rounded-md text-xs font-mono uppercase tracking-wider
              transition-colors duration-150
              ${value === opt.value
                ? 'bg-amber text-white'
                : 'text-surface-500 hover:text-surface-300'
              }
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
