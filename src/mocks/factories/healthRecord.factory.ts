/**
 * Health record mock factory.
 *
 * NO DATA IS GENERATED YET — see `doctor.factory.ts` for the rationale.
 *
 * TO IMPLEMENT (Health Records milestone): build against the module's
 * `HealthRecord` type using the pools below.
 *
 * TWO RULES, and they are not stylistic:
 *
 *   1. **Never use a real person's data**, not even anonymised, not even for
 *      one screenshot. Generated values only.
 *   2. **Never let mock health data reach production storage.** The factory
 *      must be behind `config.useMockData`, and mocked records must be written
 *      to the cache bucket only, never the app bucket, so a build flip cannot
 *      leave synthetic diagnoses in a real user's history.
 */

export const RECORD_TYPES = [
  'prescription',
  'labReport',
  'vitals',
  'consultationNote',
  'imaging',
  'vaccination',
] as const;

export const VITAL_METRICS = [
  { key: 'bloodPressure', label: 'Blood pressure', unit: 'mmHg' },
  { key: 'heartRate', label: 'Heart rate', unit: 'bpm' },
  { key: 'weight', label: 'Weight', unit: 'kg' },
  { key: 'bloodSugar', label: 'Blood sugar', unit: 'mg/dL' },
  { key: 'spo2', label: 'SpO2', unit: '%' },
] as const;

export const ATTACHMENT_TYPES = ['pdf', 'image'] as const;

/** Records are spread across this window so the timeline UI has real grouping
 *  boundaries (today / this week / this month / older) to exercise. */
export const RECORD_DATE_RANGE_DAYS = 730;

export type RecordType = (typeof RECORD_TYPES)[number];
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];
