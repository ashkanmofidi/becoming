'use client';

import { useEffect, useCallback, useRef } from 'react';

interface ShortcutBindings {
  [key: string]: () => void;
}

/**
 * Keyboard shortcut engine. PRD Section 6.6, 9.3.
 * Globally active, suppressed in text input (except modifiers).
 * Debounced 100ms. Visual feedback toast (800ms).
 */
export function useShortcuts(
  bindings: ShortcutBindings,
  enabled: boolean,
  onShortcutUsed?: (key: string) => void,
) {
  const lastTrigger = useRef(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // PRD: Suppressed in text input (except modifiers)
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (!event.ctrlKey && !event.metaKey) return;
      }

      // PRD: Inactive in modals
      if (document.querySelector('[role="dialog"]')) return;

      // 100ms debounce (PRD 9.3)
      const now = Date.now();
      if (now - lastTrigger.current < 100) return;

      const key = event.key.toLowerCase();
      const handler = bindings[key];

      if (handler) {
        event.preventDefault();
        lastTrigger.current = now;
        handler();
        onShortcutUsed?.(key);
      }
    },
    [bindings, enabled, onShortcutUsed],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
