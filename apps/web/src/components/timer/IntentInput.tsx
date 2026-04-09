'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { LIMITS } from '@becoming/shared';

interface IntentInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Session intent input. PRD Section 5.6.1.
 * Single-line, max 120 chars, autocomplete at 2+ chars.
 * Placeholder: "What are you becoming?"
 */
export function IntentInput({ value, onChange, disabled }: IntentInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const charCount = value.length;

  const showCounter = charCount >= LIMITS.INTENT_WARNING_THRESHOLD;
  const isDanger = charCount >= LIMITS.INTENT_DANGER_THRESHOLD;

  return (
    <div className="relative w-full max-w-md">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border
        transition-colors duration-200
        ${isFocused ? 'border-amber bg-surface-900/50' : 'border-surface-700 bg-surface-900/30'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}>
        {/* Pencil icon prefix (PRD 5.6.1) */}
        <svg className="w-4 h-4 text-surface-500 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5z" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, LIMITS.INTENT_MAX_LENGTH))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="What are you becoming?"
          className="flex-1 bg-transparent text-sm font-mono text-surface-100 placeholder:text-surface-500 outline-none min-w-0"
          style={{ fontSize: '16px' }} // PRD: 16px min (no iOS zoom)
          maxLength={LIMITS.INTENT_MAX_LENGTH}
          autoComplete="off"
        />

        {showCounter && (
          <span className={`text-[10px] font-mono flex-shrink-0 ${isDanger ? 'text-red-400' : 'text-surface-500'}`}>
            {charCount}/{LIMITS.INTENT_MAX_LENGTH}
          </span>
        )}
      </div>
    </div>
  );
}
