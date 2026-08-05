/**
 * HealthRecord — the Health Records module's core entity.
 *
 * ⚠ THIS IS THE MOST SENSITIVE TYPE IN THE CODEBASE. Everything shaped like
 * `HealthRecord` is protected health information. The rules that apply to it
 * are enforced in three other places, and they only work if this stays true:
 *
 *   - `utils/logger.ts` redacts `diagnosis`, `prescription` and `healthRecord`
 *     keys. New PHI-bearing field names must be added to that list.
 *   - `store/health.store.ts` forbids persisting record content into Zustand,
 *     which writes plaintext JSON to disk.
 *   - `mocks/factories/healthRecord.factory.ts` forbids real patient data even
 *     anonymised.
 *
 * Prefer adding a field here over widening `notes` into a free-text dumping
 * ground — structured fields can be redacted and access-controlled, prose
 * cannot.
 */

import type { Entity, Timestamped } from '@app-types/common.types';

import type { Attachment, IsoDateTime } from './common.model';

export const RECORD_TYPES = [
  'prescription',
  'labReport',
  'vitals',
  'consultationNote',
  'imaging',
  'vaccination',
] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

/** Who produced the record. Drives trust badges and edit permissions —
 *  a patient may correct a self-reported weight, never a lab result. */
export const RECORD_SOURCES = ['doctor', 'lab', 'self'] as const;
export type RecordSource = (typeof RECORD_SOURCES)[number];

/**
 * The vitals we can chart. Kept as a closed set with explicit units because a
 * free-text unit field produces "kg" and "Kg" and "kilograms" in the same
 * column within a week, and no chart can plot that.
 */
export const VITAL_METRICS = [
  { key: 'bloodPressure', label: 'Blood pressure', unit: 'mmHg' },
  { key: 'heartRate', label: 'Heart rate', unit: 'bpm' },
  { key: 'weight', label: 'Weight', unit: 'kg' },
  { key: 'bloodSugar', label: 'Blood sugar', unit: 'mg/dL' },
  { key: 'spo2', label: 'SpO2', unit: '%' },
] as const;

export type VitalMetricKey = (typeof VITAL_METRICS)[number]['key'];

export interface VitalMeasurement {
  metric: VitalMetricKey;
  /** Systolic/diastolic is the one metric that needs two numbers, so the
   *  value is a string rather than forcing every other metric into a pair. */
  value: string;
  unit: string;
  recordedAt: IsoDateTime;
}

export interface RecordAuthor {
  /** Present when the author is a doctor in our directory. */
  doctorId?: string;
  name: string;
}

export interface HealthRecord extends Entity, Timestamped {
  /** The family member this belongs to — not necessarily the account holder. */
  patientId: string;
  type: RecordType;
  title: string;
  /** When the event happened, which is not when it was uploaded. Timelines
   *  must sort on this or a back-dated lab report lands at the top. */
  recordedAt: IsoDateTime;
  source: RecordSource;
  author?: RecordAuthor;
  notes?: string;
  attachments: Attachment[];
  vitals?: VitalMeasurement[];
  /** Set when the record was produced by a consultation, so the UI can link
   *  a prescription back to the session that created it. */
  bookingId?: string;
}
