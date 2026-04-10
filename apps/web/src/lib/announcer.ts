/**
 * Screen reader announcer service — singleton module.
 *
 * Manages a visually-hidden ARIA live region. Components call announce()
 * with a message and minimum verbosity level. The service checks the
 * current setting and only outputs if the level is sufficient.
 *
 * Levels: 'minimal' < 'standard' < 'verbose'
 */

type Verbosity = 'minimal' | 'standard' | 'verbose';

let currentVerbosity: Verbosity = 'standard';
let announceEl: HTMLElement | null = null;

const LEVEL_ORDER: Record<Verbosity, number> = {
  minimal: 0,
  standard: 1,
  verbose: 2,
};

function ensureElement(): HTMLElement {
  if (announceEl && document.body.contains(announceEl)) return announceEl;

  announceEl = document.createElement('div');
  announceEl.id = 'sr-announcer';
  announceEl.setAttribute('aria-live', 'polite');
  announceEl.setAttribute('aria-atomic', 'true');
  announceEl.setAttribute('role', 'status');
  announceEl.className = 'sr-only';
  announceEl.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0';
  document.body.appendChild(announceEl);
  return announceEl;
}

/**
 * Announce a message to screen readers if the current verbosity allows it.
 * @param message The text to announce
 * @param minLevel Minimum verbosity required for this message
 * @param assertive Use aria-live="assertive" for critical announcements
 */
export function announce(message: string, minLevel: Verbosity = 'standard', assertive = false): void {
  if (typeof document === 'undefined') return;
  if (LEVEL_ORDER[minLevel] > LEVEL_ORDER[currentVerbosity]) return;

  const el = ensureElement();
  if (assertive) el.setAttribute('aria-live', 'assertive');
  else el.setAttribute('aria-live', 'polite');

  // Clear then set — forces re-announcement even if same text
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = message; });
}

/** Update the verbosity level. Called by DisplaySync when settings change. */
export function setVerbosity(level: Verbosity): void {
  currentVerbosity = level;
}
