/**
 * Product-level constants that are not environment-dependent.
 * Anything that differs per environment belongs in `config/`, not here.
 */

export const APP_NAME = 'Amrutam';
export const SUPPORT_EMAIL = 'support@amrutam.com';
export const PRIVACY_URL = 'https://amrutam.com/privacy';
export const TERMS_URL = 'https://amrutam.com/terms';

/** Debounce window for search-as-you-type. Tuned so a fast typist produces
 *  one request per word rather than one per keystroke. */
export const SEARCH_DEBOUNCE_MS = 350;

/** Throttle window for scroll-driven work (analytics, prefetch triggers). */
export const SCROLL_THROTTLE_MS = 100;

/** Minimum time a loading state stays visible. Prevents the "flash of
 *  spinner" that makes a fast response feel glitchy. */
export const MIN_LOADING_MS = 300;

export const TOAST_DURATION_MS = {
  short: 2_500,
  long: 4_500,
} as const;
