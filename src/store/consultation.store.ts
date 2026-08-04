/**
 * Consultation store — client state for the doctor consultation flow.
 *
 * INTENTIONALLY EMPTY (foundation milestone). Do not implement the module here.
 *
 * WHAT BELONGS HERE
 *   - the in-progress booking draft (selected doctor, slot, mode) that must
 *     survive navigating between the picker, the summary and the payment
 *     screens
 *   - active filter/sort selections for the doctor list, so returning to the
 *     list restores what the user had chosen
 *
 * WHAT DOES NOT
 *   - The doctor list itself, availability, or any fetched entity. That is
 *     server state: React Query owns caching, revalidation and eviction.
 *     Copying it into Zustand creates two sources of truth that silently
 *     diverge — the single most common React Native state bug.
 *
 * When the module lands, replace `ConsultationState` with a real interface and
 * add actions alongside the state fields (Zustand convention: actions live in
 * the store, not in hooks that wrap it).
 */

import { createAppStore } from './createStore';

/** Empty by design — see the note above. */
export type ConsultationState = Record<string, never>;

export const useConsultationStore = createAppStore<ConsultationState>(
  () => ({}),
  { name: 'consultation' },
);
