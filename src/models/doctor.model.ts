/**
 * Doctor — the Consultation module's core entity.
 *
 * The vocabulary constants below (specialities, consultation modes) live here
 * rather than in `mocks/` because they are *domain* facts, not test fixtures:
 * they drive filter chips, validation and the API contract. The mock factories
 * import them so there is exactly one list to keep current.
 */

import type { Entity, Timestamped } from '@app-types/common.types';

import type {
  IsoDateTime,
  Language,
  Money,
  Rating,
  TimeZone,
} from './common.model';

/** The eight classical branches of Ayurveda plus the two modern additions the
 *  practice directory uses. */
export const SPECIALITIES = [
  'Panchakarma',
  'Kayachikitsa',
  'Shalya Tantra',
  'Shalakya Tantra',
  'Prasuti Tantra',
  'Kaumarbhritya',
  'Rasashastra',
  'Dravyaguna',
  'Swasthavritta',
  'Manas Roga',
] as const;

export type Speciality = (typeof SPECIALITIES)[number];

export const CONSULTATION_MODES = [
  'video',
  'audio',
  'chat',
  'inPerson',
] as const;

export type ConsultationMode = (typeof CONSULTATION_MODES)[number];

export interface ClinicSummary {
  id: string;
  name: string;
  city: string;
}

export interface Doctor extends Entity, Timestamped {
  fullName: string;
  /** AYUSH practitioner registration number — shown for trust, and the field
   *  regulators ask about. */
  registrationNumber: string;
  specialities: Speciality[];
  qualifications: string[];
  experienceYears: number;
  languages: Language[];
  bio?: string;
  photoUrl?: string;
  clinic?: ClinicSummary;

  consultationModes: ConsultationMode[];
  /**
   * Fee per mode. Partial because a doctor may offer video but not in-person,
   * and the type should make "no fee for a mode you don't offer" natural
   * rather than force a sentinel value.
   */
  fees: Partial<Record<ConsultationMode, Money>>;

  rating: Rating;
  /** False when the doctor has paused new bookings — distinct from simply
   *  having no free slots this week. */
  isAcceptingPatients: boolean;
  nextAvailableAt?: IsoDateTime;
}

/**
 * A bookable window. Slots are server-authoritative and short-lived: never
 * cache one and assume it is still free. `isAvailable` is a snapshot, which is
 * why booking is idempotency-keyed and can still fail with
 * `SLOT_ALREADY_BOOKED`.
 */
export interface TimeSlot extends Entity {
  doctorId: string;
  startsAt: IsoDateTime;
  endsAt: IsoDateTime;
  /** Rendered in the doctor's zone, not the device's. */
  timeZone: TimeZone;
  mode: ConsultationMode;
  isAvailable: boolean;
  fee: Money;
}
