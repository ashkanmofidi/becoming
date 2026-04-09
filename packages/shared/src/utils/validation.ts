import { LIMITS } from '../constants/limits';

/**
 * Input sanitization and validation. PRD Section 17.
 * All user inputs are validated server-side.
 */

/**
 * Sanitizes a string by removing HTML tags and trimming.
 * PRD Section 17: Input sanitization server-side (HTML encoding, max lengths).
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/**
 * Validates intent input.
 * PRD Section 5.6.1: Max 120 chars. Whitespace-only trimmed to empty.
 */
export function validateIntent(intent: string): { valid: boolean; sanitized: string; error?: string } {
  const trimmed = intent.trim();
  if (trimmed.length === 0) {
    return { valid: true, sanitized: '' };
  }
  if (trimmed.length > LIMITS.INTENT_MAX_LENGTH) {
    return { valid: false, sanitized: trimmed, error: `Intent must be ${LIMITS.INTENT_MAX_LENGTH} characters or less` };
  }
  return { valid: true, sanitized: sanitizeString(trimmed) };
}

/**
 * Validates category name.
 * PRD Section 6.5: Max 24 chars, unique case-insensitive.
 */
export function validateCategoryName(
  name: string,
  existingNames: string[],
): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Category name is required' };
  }
  if (trimmed.length > LIMITS.CATEGORY_NAME_MAX_LENGTH) {
    return { valid: false, error: `Category name must be ${LIMITS.CATEGORY_NAME_MAX_LENGTH} characters or less` };
  }
  if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
    return { valid: false, error: 'A category with this name already exists' };
  }
  return { valid: true };
}

/**
 * Validates a numeric stepper value within range.
 */
export function validateStepperValue(
  value: number,
  min: number,
  max: number,
): number {
  if (isNaN(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

/**
 * Validates feedback submission.
 * PRD Section 9.1.
 */
export function validateFeedback(data: {
  subject: string;
  description: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.subject.trim()) {
    errors.push('Subject is required');
  } else if (data.subject.length > LIMITS.FEEDBACK_SUBJECT_MAX_LENGTH) {
    errors.push(`Subject must be ${LIMITS.FEEDBACK_SUBJECT_MAX_LENGTH} characters or less`);
  }
  if (!data.description.trim()) {
    errors.push('Description is required');
  } else if (data.description.length < LIMITS.FEEDBACK_DESCRIPTION_MIN_LENGTH) {
    errors.push(`Description must be at least ${LIMITS.FEEDBACK_DESCRIPTION_MIN_LENGTH} characters`);
  } else if (data.description.length > LIMITS.FEEDBACK_DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be ${LIMITS.FEEDBACK_DESCRIPTION_MAX_LENGTH} characters or less`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validates hex color code.
 */
export function validateHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Validates email format (basic).
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
