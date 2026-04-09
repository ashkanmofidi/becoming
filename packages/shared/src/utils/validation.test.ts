import { describe, it, expect } from 'vitest';
import {
  validateIntent,
  validateCategoryName,
  validateStepperValue,
  validateFeedback,
  validateHexColor,
  validateEmail,
  sanitizeString,
} from './validation';

describe('sanitizeString', () => {
  it('removes angle brackets', () => {
    const result = sanitizeString('<script>alert("xss")</script>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('encodes ampersands', () => {
    expect(sanitizeString('A & B')).toBe('A &amp; B');
  });

  it('encodes double quotes', () => {
    expect(sanitizeString('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('encodes single quotes', () => {
    expect(sanitizeString("it's")).toBe('it&#x27;s');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('');
  });

  it('handles string with only whitespace', () => {
    expect(sanitizeString('   ')).toBe('');
  });

  it('processes multiple special characters together', () => {
    const result = sanitizeString('<b>"Hello" & \'World\'</b>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).toContain('&quot;');
    expect(result).toContain('&#x27;');
    expect(result).toContain('&amp;');
  });
});

describe('validateIntent', () => {
  it('accepts valid intent', () => {
    const result = validateIntent('Deep work on project');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Deep work on project');
  });

  it('accepts empty intent (PRD 5.6.1: empty valid, optional)', () => {
    expect(validateIntent('').valid).toBe(true);
    expect(validateIntent('   ').valid).toBe(true);
    expect(validateIntent('   ').sanitized).toBe('');
  });

  it('rejects intent over 120 chars', () => {
    const long = 'a'.repeat(121);
    const result = validateIntent(long);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('accepts intent at exactly 120 chars', () => {
    const exact = 'a'.repeat(120);
    expect(validateIntent(exact).valid).toBe(true);
  });

  it('sanitizes the intent string', () => {
    const result = validateIntent('Focus on <task>');
    expect(result.valid).toBe(true);
    expect(result.sanitized).not.toContain('<');
  });

  it('trims before length check', () => {
    // 120 chars + leading/trailing spaces should be valid after trim
    const padded = '  ' + 'a'.repeat(120) + '  ';
    expect(validateIntent(padded).valid).toBe(true);
  });

  it('rejects after trimming if still over limit', () => {
    const long = '  ' + 'a'.repeat(121) + '  ';
    expect(validateIntent(long).valid).toBe(false);
  });
});

describe('validateCategoryName', () => {
  it('rejects empty name', () => {
    expect(validateCategoryName('', []).valid).toBe(false);
    expect(validateCategoryName('', []).error).toBeDefined();
  });

  it('rejects whitespace-only name', () => {
    expect(validateCategoryName('   ', []).valid).toBe(false);
  });

  it('rejects name over 24 chars (PRD 6.5)', () => {
    expect(validateCategoryName('a'.repeat(25), []).valid).toBe(false);
  });

  it('accepts name at exactly 24 chars', () => {
    expect(validateCategoryName('a'.repeat(24), []).valid).toBe(true);
  });

  it('rejects duplicate name (case-insensitive, PRD 6.5)', () => {
    expect(validateCategoryName('Work', ['work', 'Study']).valid).toBe(false);
    expect(validateCategoryName('WORK', ['Work']).valid).toBe(false);
    expect(validateCategoryName('work', ['WORK']).valid).toBe(false);
  });

  it('accepts valid unique name', () => {
    expect(validateCategoryName('New Category', ['Work', 'Study']).valid).toBe(
      true,
    );
  });

  it('accepts name when existing list is empty', () => {
    expect(validateCategoryName('First', []).valid).toBe(true);
  });

  it('rejects duplicate with error message', () => {
    const result = validateCategoryName('Work', ['Work']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('already exists');
  });
});

describe('validateStepperValue', () => {
  it('clamps below min', () => {
    expect(validateStepperValue(0, 1, 120)).toBe(1);
  });

  it('clamps above max', () => {
    expect(validateStepperValue(200, 1, 120)).toBe(120);
  });

  it('rounds to nearest integer', () => {
    expect(validateStepperValue(25.7, 1, 120)).toBe(26);
    expect(validateStepperValue(25.3, 1, 120)).toBe(25);
    expect(validateStepperValue(25.5, 1, 120)).toBe(26);
  });

  it('returns min for NaN', () => {
    expect(validateStepperValue(NaN, 1, 120)).toBe(1);
  });

  it('passes through valid value', () => {
    expect(validateStepperValue(25, 1, 120)).toBe(25);
  });

  it('returns min when value equals min', () => {
    expect(validateStepperValue(1, 1, 120)).toBe(1);
  });

  it('returns max when value equals max', () => {
    expect(validateStepperValue(120, 1, 120)).toBe(120);
  });

  it('handles negative values', () => {
    expect(validateStepperValue(-5, 1, 120)).toBe(1);
  });

  it('handles Infinity', () => {
    expect(validateStepperValue(Infinity, 1, 120)).toBe(120);
  });

  it('handles -Infinity', () => {
    expect(validateStepperValue(-Infinity, 1, 120)).toBe(1);
  });
});

describe('validateFeedback', () => {
  it('rejects empty subject', () => {
    const result = validateFeedback({
      subject: '',
      description: 'Valid description here',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Subject is required');
  });

  it('rejects whitespace-only subject', () => {
    const result = validateFeedback({
      subject: '   ',
      description: 'Valid description here',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Subject is required');
  });

  it('rejects short description (PRD 9.1: min 10 chars)', () => {
    const result = validateFeedback({
      subject: 'Bug',
      description: 'short',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects empty description', () => {
    const result = validateFeedback({ subject: 'Bug', description: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Description is required');
  });

  it('accepts valid feedback', () => {
    const result = validateFeedback({
      subject: 'Bug Report',
      description:
        'The timer freezes when I switch tabs on mobile.',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts description at exactly 10 chars', () => {
    const result = validateFeedback({
      subject: 'Bug',
      description: 'a'.repeat(10),
    });
    expect(result.valid).toBe(true);
  });

  it('rejects subject over 100 chars', () => {
    const result = validateFeedback({
      subject: 'a'.repeat(101),
      description: 'Valid description here',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects description over 2000 chars', () => {
    const result = validateFeedback({
      subject: 'Bug',
      description: 'a'.repeat(2001),
    });
    expect(result.valid).toBe(false);
  });

  it('collects multiple errors', () => {
    const result = validateFeedback({ subject: '', description: '' });
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('validateHexColor', () => {
  it('accepts valid hex', () => {
    expect(validateHexColor('#D97706')).toBe(true);
    expect(validateHexColor('#000000')).toBe(true);
    expect(validateHexColor('#ffffff')).toBe(true);
    expect(validateHexColor('#ABCDEF')).toBe(true);
    expect(validateHexColor('#abcdef')).toBe(true);
    expect(validateHexColor('#123456')).toBe(true);
  });

  it('rejects missing hash', () => {
    expect(validateHexColor('D97706')).toBe(false);
  });

  it('rejects short hex (3 digits)', () => {
    expect(validateHexColor('#D97')).toBe(false);
  });

  it('rejects invalid characters', () => {
    expect(validateHexColor('#GGGGGG')).toBe(false);
    expect(validateHexColor('#ZZZZZZ')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateHexColor('')).toBe(false);
  });

  it('rejects 8-digit hex (with alpha)', () => {
    expect(validateHexColor('#D97706FF')).toBe(false);
  });

  it('rejects hex with spaces', () => {
    expect(validateHexColor('# D97706')).toBe(false);
    expect(validateHexColor(' #D97706')).toBe(false);
  });
});

describe('validateEmail', () => {
  it('accepts valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.co.uk')).toBe(true);
    expect(validateEmail('user+tag@example.com')).toBe(true);
  });

  it('rejects missing @', () => {
    expect(validateEmail('not-an-email')).toBe(false);
  });

  it('rejects missing local part', () => {
    expect(validateEmail('@example.com')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('rejects emails with spaces', () => {
    expect(validateEmail('user @example.com')).toBe(false);
    expect(validateEmail('user@ example.com')).toBe(false);
  });
});
