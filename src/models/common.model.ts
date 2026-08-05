/**
 * Value objects shared by more than one entity.
 *
 * WHY these are types and not classes: they cross the network boundary. A
 * class would need reviving on every deserialisation, and any method on it
 * would be lost the moment the object went through `JSON.parse` — which is
 * exactly what the cache and the offline queue do. Behaviour lives in
 * `utils/`, shape lives here.
 */

/* ---- Time -------------------------------------------------------------
 * Aliases rather than `string` everywhere, so a signature says which format
 * it expects. They are not branded types: branding would force casts at every
 * API boundary for a guarantee the server does not actually give us. The name
 * documents the contract; runtime validation belongs at the transport edge. */

/** Full ISO-8601 instant with timezone, e.g. `2026-08-05T09:30:00.000Z`. */
export type IsoDateTime = string;

/** Calendar day with no time component, e.g. `2026-08-05`. */
export type IsoDate = string;

/** IANA zone, e.g. `Asia/Kolkata`. Consultation slots carry one because a
 *  doctor's availability is meaningless without it. */
export type TimeZone = string;

/* ---- Money ------------------------------------------------------------ */

export type CurrencyCode = 'INR';

/**
 * Money is ALWAYS in minor units (paise), never rupees.
 *
 * This is the single most important convention in the data layer. Floating
 * point rupees accumulate rounding error across a cart, and `0.1 + 0.2` is a
 * real bug in a checkout total. `utils/formatter.formatCurrency` expects minor
 * units, and every mock factory must emit them.
 */
export interface Money {
  /** Paise for INR. 149900 === ₹1,499.00 */
  amountMinor: number;
  currency: CurrencyCode;
}

/* ---- Ratings ---------------------------------------------------------- */

export interface Rating {
  /** 0–5, typically to one decimal place. */
  average: number;
  count: number;
}

/* ---- Media ------------------------------------------------------------ */

export const ATTACHMENT_TYPES = ['pdf', 'image'] as const;
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

export interface Attachment {
  id: string;
  type: AttachmentType;
  /** Signed, expiring URL. Never persist this — re-fetch it. */
  url: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: IsoDateTime;
}

/* ---- Geography -------------------------------------------------------- */

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  /** Six digits, first digit 1–9. See `utils/validation.Patterns.pincode`. */
  pincode: string;
  country: 'IN';
}

/* ---- Language --------------------------------------------------------- */

export const LANGUAGES = [
  'Hindi',
  'English',
  'Marathi',
  'Gujarati',
  'Tamil',
  'Telugu',
  'Kannada',
  'Bengali',
  'Malayalam',
  'Punjabi',
] as const;

export type Language = (typeof LANGUAGES)[number];
