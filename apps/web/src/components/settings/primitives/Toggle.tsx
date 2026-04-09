'use client';

interface ToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
  description?: string;
}

/**
 * Toggle switch. PRD Section 6 (used across all settings).
 */
export function Toggle({ enabled, onChange, disabled, label, description }: ToggleProps) {
  return (
    <label className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-surface-100">{label}</span>
        {description && <p className="text-xs text-surface-500 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 rounded-full
          transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber/50
          ${enabled ? 'bg-amber' : 'bg-surface-700'}
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <span
          className={`
            inline-block h-5 w-5 rounded-full bg-white shadow transform
            transition-transform duration-200
            ${enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}
            mt-[2px]
          `}
        />
      </button>
    </label>
  );
}
