'use client';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  subtitle?: string;
  disabled?: boolean;
}

/**
 * Dropdown select. PRD Section 6 (theme, sound theme, streak rule, etc.).
 */
export function Select({ value, onChange, options, label, subtitle, disabled }: SelectProps) {
  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-surface-100">{label}</span>
        {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-surface-900 border border-surface-700 text-surface-100 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-amber transition-colors cursor-pointer appearance-none min-w-[140px]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
