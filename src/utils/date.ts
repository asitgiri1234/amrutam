/**
 * Date helpers.
 *
 * WHY no date library: `Intl` ships with Hermes and covers formatting and
 * relative time correctly for every locale we care about, including Indian
 * ones. day.js/date-fns would add bundle weight and a second source of truth
 * for timezone behaviour. The one thing `Intl` does not give us is arithmetic,
 * so the small amount we need lives here.
 *
 * Everything is timezone-naive on purpose except `formatDateTime`, which takes
 * an explicit timeZone — consultation slots must render in the *doctor's*
 * timezone, and that has to be a conscious decision at every call site.
 */

export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

export type DateInput = Date | string | number;

const DEFAULT_LOCALE = 'en-IN';

export function toDate(input: DateInput): Date {
  return input instanceof Date ? new Date(input.getTime()) : new Date(input);
}

export function isValidDate(input: DateInput): boolean {
  return !Number.isNaN(toDate(input).getTime());
}

/** `YYYY-MM-DD` in local time — the format our API uses for calendar days. */
export function toISODate(input: DateInput): string {
  const date = toDate(input);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfDay(input: DateInput): Date {
  const date = toDate(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(input: DateInput): Date {
  const date = toDate(input);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function addDays(input: DateInput, days: number): Date {
  const date = toDate(input);
  date.setDate(date.getDate() + days);
  return date;
}

export function addMinutes(input: DateInput, minutes: number): Date {
  return new Date(toDate(input).getTime() + minutes * MS_PER_MINUTE);
}

export function isSameDay(a: DateInput, b: DateInput): boolean {
  return toISODate(a) === toISODate(b);
}

export function isToday(input: DateInput): boolean {
  return isSameDay(input, new Date());
}

export function isPast(input: DateInput): boolean {
  return toDate(input).getTime() < Date.now();
}

/** Whole days between two dates, ignoring time of day. */
export function diffInDays(a: DateInput, b: DateInput): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / MS_PER_DAY);
}

export function formatDate(
  input: DateInput,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
  locale: string = DEFAULT_LOCALE,
): string {
  if (!isValidDate(input)) {
    return '';
  }
  return new Intl.DateTimeFormat(locale, options).format(toDate(input));
}

export function formatTime(
  input: DateInput,
  locale: string = DEFAULT_LOCALE,
): string {
  return formatDate(input, { hour: 'numeric', minute: '2-digit' }, locale);
}

export function formatDateTime(
  input: DateInput,
  timeZone?: string,
  locale: string = DEFAULT_LOCALE,
): string {
  return formatDate(
    input,
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      ...(timeZone === undefined ? {} : { timeZone }),
    },
    locale,
  );
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * MS_PER_DAY],
  ['month', 30 * MS_PER_DAY],
  ['week', 7 * MS_PER_DAY],
  ['day', MS_PER_DAY],
  ['hour', MS_PER_HOUR],
  ['minute', MS_PER_MINUTE],
];

/** "3 days ago", "in 2 hours". Falls back to "just now" under a minute. */
export function formatRelativeTime(
  input: DateInput,
  from: DateInput = new Date(),
  locale: string = DEFAULT_LOCALE,
): string {
  if (!isValidDate(input)) {
    return '';
  }

  const deltaMs = toDate(input).getTime() - toDate(from).getTime();
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const entry of RELATIVE_UNITS) {
    const [unit, unitMs] = entry;
    if (Math.abs(deltaMs) >= unitMs) {
      return formatter.format(Math.round(deltaMs / unitMs), unit);
    }
  }

  return formatter.format(0, 'second');
}

/** "1h 25m" — for consultation durations and video call timers. */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / MS_PER_MINUTE));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}
