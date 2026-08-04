/**
 * Display formatting.
 *
 * WHY it is separate from `date.ts` and from components: formatting is
 * *presentation logic* that several unrelated screens share. Inlining
 * `₹${price / 100}` in a product card guarantees three subtly different money
 * renderings by the time three engineers have shipped three screens.
 *
 * Money is handled in **minor units** (paise) throughout. Floating-point rupees
 * are a correctness bug waiting to happen in a commerce flow.
 */

const DEFAULT_LOCALE = 'en-IN';
const DEFAULT_CURRENCY = 'INR';

/** @param minorUnits e.g. 149900 -> "₹1,499.00" */
export function formatCurrency(
  minorUnits: number,
  options: {
    currency?: string;
    locale?: string;
    /** Drop ".00" when the amount is whole — common in listing grids. */
    compactDecimals?: boolean;
  } = {},
): string {
  const {
    currency = DEFAULT_CURRENCY,
    locale = DEFAULT_LOCALE,
    compactDecimals = false,
  } = options;

  const major = minorUnits / 100;
  const isWhole = Number.isInteger(major);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: compactDecimals && isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
}

export function formatNumber(
  value: number,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** 12500 -> "12.5K". For review counts, follower counts, etc. */
export function formatCompactNumber(
  value: number,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(
  fraction: number,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(fraction);
}

export function truncate(
  value: string,
  maxLength: number,
  ellipsis = '…',
): string {
  if (value.length <= maxLength) {
    return value;
  }
  return (
    value.slice(0, Math.max(0, maxLength - ellipsis.length)).trimEnd() +
    ellipsis
  );
}

export function capitalize(value: string): string {
  if (value.length === 0) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function titleCase(value: string): string {
  return value.toLowerCase().split(/\s+/).map(capitalize).join(' ');
}

/** "Asit Giri" -> "AG". Used by Avatar's fallback. */
export function initials(name: string, maxChars = 2): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(part => part.length > 0);

  if (parts.length === 0) {
    return '';
  }

  return parts
    .slice(0, maxChars)
    .map(part => (part[0] ?? '').toUpperCase())
    .join('');
}

/** Masks all but the last 4 digits: "+91 98765 43210" -> "+91 •••••  43210". */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) {
    return value;
  }
  return `${'•'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export function maskEmail(value: string): string {
  const atIndex = value.indexOf('@');
  if (atIndex <= 1) {
    return value;
  }
  const local = value.slice(0, atIndex);
  const domain = value.slice(atIndex);
  return `${local.slice(0, 2)}${'•'.repeat(
    Math.max(1, local.length - 2),
  )}${domain}`;
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  return count === 1 ? singular : plural ?? `${singular}s`;
}

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/** For health-record attachments. */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) {
    return '0 B';
  }
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    FILE_SIZE_UNITS.length - 1,
  );
  const unit = FILE_SIZE_UNITS[exponent] ?? 'B';
  const size = bytes / Math.pow(1024, exponent);
  return `${size.toFixed(exponent === 0 ? 0 : 1)} ${unit}`;
}
