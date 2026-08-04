/**
 * Health store — client state for health records.
 *
 * INTENTIONALLY EMPTY (foundation milestone).
 *
 * WHAT BELONGS HERE
 *   - which family member's records are currently selected
 *   - the active record-type filter and date range
 *   - upload drafts (a scanned report waiting to be sent)
 *
 * WHAT DOES NOT — and this one is a compliance matter, not a style preference
 *   - **Any actual health record content.** Diagnoses, prescriptions, lab
 *     values and attachments must not be persisted into a Zustand store, which
 *     writes plaintext JSON to disk. Records are read through React Query and,
 *     if they need to be available offline, cached deliberately through the
 *     encrypted storage bucket with an explicit retention policy.
 *   - Anything that would end up in a devtools snapshot or a crash report.
 *     `utils/logger` already redacts these keys; do not create new paths that
 *     bypass it.
 */

import { createAppStore } from './createStore';

/** Empty by design — see the note above. */
export type HealthState = Record<string, never>;

export const useHealthStore = createAppStore<HealthState>(() => ({}), {
  name: 'health',
});
