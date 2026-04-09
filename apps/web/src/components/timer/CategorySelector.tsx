'use client';

import { useState, useRef, useEffect } from 'react';
import type { Category } from '@becoming/shared';

interface CategorySelectorProps {
  selected: string;
  categories: Category[];
  onChange: (category: string) => void;
  disabled?: boolean;
}

/**
 * Category selector. PRD Section 5.6.2.
 * Bordered pill showing selected category. Tap: dropdown.
 */
export function CategorySelector({ selected, categories, onChange, disabled }: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategory = categories.find((c) => c.name === selected);
  const dotColor = selectedCategory?.color ?? '#6B7280';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-mono
          transition-colors duration-150 max-w-[120px]
          ${isOpen ? 'border-amber' : 'border-surface-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-surface-500'}
        `}
      >
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
        <span className="truncate text-surface-300">{selected}</span>
        <svg className="w-3 h-3 text-surface-500 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 w-48 bg-bg-card border border-surface-700 rounded-lg shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => { onChange(cat.name); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-surface-900/50 transition-colors"
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-surface-300 flex-1 truncate">{cat.name}</span>
              {cat.name === selected && (
                <span className="text-amber text-xs">&#10003;</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
