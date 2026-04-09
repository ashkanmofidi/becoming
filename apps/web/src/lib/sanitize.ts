/**
 * Server-side output encoding. PRD Section 17.
 * All user-generated content is output-encoded on render.
 * Raw HTML is never injected into the DOM.
 */

/**
 * Encode HTML entities to prevent XSS.
 */
export function encodeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Strip all HTML tags from a string.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Validate and sanitize a URL to prevent javascript: protocol XSS.
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url;
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Truncate a string safely (no mid-emoji breaks).
 */
export function truncateSafe(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  const truncated = [...input].slice(0, maxLength).join('');
  return truncated + '…';
}
