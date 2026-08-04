/**
 * Validation primitives.
 *
 * WHY plain predicates + rule builders rather than a schema library (zod/yup):
 * React Hook Form is the consumer, and RHF's `rules` API wants
 * `(value) => true | string`. Small composable builders map onto that with zero
 * adapter and zero bundle cost. If/when we need to validate *API responses*
 * (a different problem — untrusted external data), a schema library is the
 * right tool and belongs in `api/`, not here.
 */

/* ---- Patterns --------------------------------------------------------- */

export const Patterns = {
  /** Pragmatic email check. Deliberately not RFC 5322 — that regex rejects
   *  fewer bad addresses than it wrongly rejects good ones. */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  /** Indian mobile: optional +91 / 0 prefix, then 6-9 followed by 9 digits. */
  indianPhone: /^(?:\+?91[-\s]?|0)?[6-9]\d{9}$/,
  /** Indian PIN code. */
  pincode: /^[1-9]\d{5}$/,
  /** Letters, spaces, apostrophes and hyphens — covers most Indian names. */
  personName: /^[\p{L}][\p{L}\s'.-]{1,63}$/u,
  url: /^https?:\/\/[^\s/$.?#][^\s]*$/i,
  numeric: /^\d+$/,
  alphanumeric: /^[a-z0-9]+$/i,
} as const;

/* ---- Predicates ------------------------------------------------------- */

export function isNonEmpty(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isEmail(value: string): boolean {
  return Patterns.email.test(value.trim());
}

export function isIndianPhone(value: string): boolean {
  return Patterns.indianPhone.test(value.replace(/\s|-/g, ''));
}

export function isPincode(value: string): boolean {
  return Patterns.pincode.test(value.trim());
}

export function isUrl(value: string): boolean {
  return Patterns.url.test(value.trim());
}

export function isInRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

/* ---- React Hook Form rule builders ------------------------------------ */
/**
 * Each builder returns a validator in RHF's shape: `true` when valid, or the
 * error message to display. Compose them with `composeRules`.
 */
export type ValidationRule<T = string> = (value: T) => true | string;

export function required(message = 'This field is required'): ValidationRule {
  return value => (isNonEmpty(value) ? true : message);
}

export function minLength(length: number, message?: string): ValidationRule {
  return value =>
    value.trim().length >= length
      ? true
      : message ?? `Must be at least ${length} characters`;
}

export function maxLength(length: number, message?: string): ValidationRule {
  return value =>
    value.trim().length <= length
      ? true
      : message ?? `Must be at most ${length} characters`;
}

export function matches(
  pattern: RegExp,
  message = 'Invalid format',
): ValidationRule {
  return value => (pattern.test(value) ? true : message);
}

export function emailRule(
  message = 'Enter a valid email address',
): ValidationRule {
  return value => (isEmail(value) ? true : message);
}

export function phoneRule(
  message = 'Enter a valid 10-digit mobile number',
): ValidationRule {
  return value => (isIndianPhone(value) ? true : message);
}

/** Runs rules in order and returns the first failure — matching how users
 *  actually read validation errors (one at a time, top to bottom). */
export function composeRules<T>(
  ...rules: Array<ValidationRule<T>>
): ValidationRule<T> {
  return value => {
    for (const rule of rules) {
      const result = rule(value);
      if (result !== true) {
        return result;
      }
    }
    return true;
  };
}
