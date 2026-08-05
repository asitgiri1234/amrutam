/**
 * Consultation store — client state for the doctor consultation flow.
 *
 * WHAT LIVES HERE
 *   - the doctor-list filter selection, so navigating away and back restores
 *     what the user had chosen rather than silently resetting it
 *
 * WHAT MUST NOT
 *   - The doctor list itself, availability, or any fetched entity. That is
 *     server state: React Query owns caching, revalidation and eviction.
 *     Copying it into Zustand creates two sources of truth that silently
 *     diverge — the single most common React Native state bug.
 *   - The in-progress booking draft. That arrives with the booking flow, which
 *     is explicitly out of scope for this milestone.
 *
 * The filters are held here rather than in `useState` on the screen precisely
 * because they must outlive the screen. They are NOT persisted to disk: a
 * filter the user set last week should not silently narrow their results on a
 * cold start.
 */

import type { ConsultationMode, Speciality } from '@models';

import { createAppStore } from './createStore';

/** Experience brackets, as the UI presents them. `null` means "any". */
export type ExperienceBracket = '0-5' | '5-10' | '10-20' | '20+';

/** Fee ceilings in paise — see `Money`. `null` means "any". */
export const FEE_CEILINGS_MINOR = [50_000, 100_000, 200_000] as const;
export type FeeCeilingMinor = (typeof FEE_CEILINGS_MINOR)[number];

export interface DoctorListFilters {
  /** Debounced search text. */
  query: string;
  specialities: Speciality[];
  modes: ConsultationMode[];
  experience: ExperienceBracket | null;
  maxFeeMinor: FeeCeilingMinor | null;
  minRating: number | null;
  acceptingPatientsOnly: boolean;
}

export interface ConsultationState {
  filters: DoctorListFilters;

  setQuery: (query: string) => void;
  toggleSpeciality: (speciality: Speciality) => void;
  setExperience: (experience: ExperienceBracket | null) => void;
  setMaxFee: (maxFeeMinor: FeeCeilingMinor | null) => void;
  setAcceptingPatientsOnly: (value: boolean) => void;
  resetFilters: () => void;
}

export const INITIAL_DOCTOR_FILTERS: DoctorListFilters = {
  query: '',
  specialities: [],
  modes: [],
  experience: null,
  maxFeeMinor: null,
  minRating: null,
  acceptingPatientsOnly: false,
};

/** Maps a bracket to a minimum year count. Kept beside the type so adding a
 *  bracket cannot leave the mapping behind. */
export const EXPERIENCE_MIN_YEARS: Record<ExperienceBracket, number> = {
  '0-5': 0,
  '5-10': 5,
  '10-20': 10,
  '20+': 20,
};

export const EXPERIENCE_MAX_YEARS: Record<ExperienceBracket, number | null> = {
  '0-5': 5,
  '5-10': 10,
  '10-20': 20,
  '20+': null,
};

export const useConsultationStore = createAppStore<ConsultationState>(
  set => ({
    filters: { ...INITIAL_DOCTOR_FILTERS },

    setQuery: query => set(state => ({ filters: { ...state.filters, query } })),

    toggleSpeciality: speciality =>
      set(state => ({
        filters: {
          ...state.filters,
          specialities: state.filters.specialities.includes(speciality)
            ? state.filters.specialities.filter(item => item !== speciality)
            : [...state.filters.specialities, speciality],
        },
      })),

    setExperience: experience =>
      set(state => ({ filters: { ...state.filters, experience } })),

    setMaxFee: maxFeeMinor =>
      set(state => ({ filters: { ...state.filters, maxFeeMinor } })),

    setAcceptingPatientsOnly: acceptingPatientsOnly =>
      set(state => ({ filters: { ...state.filters, acceptingPatientsOnly } })),

    resetFilters: () => set({ filters: { ...INITIAL_DOCTOR_FILTERS } }),
  }),
  { name: 'consultation' },
);

/** True when anything is narrowing the list — drives the filter badge. */
export function hasActiveFilters(filters: DoctorListFilters): boolean {
  return (
    filters.specialities.length > 0 ||
    filters.modes.length > 0 ||
    filters.experience !== null ||
    filters.maxFeeMinor !== null ||
    filters.minRating !== null ||
    filters.acceptingPatientsOnly
  );
}
