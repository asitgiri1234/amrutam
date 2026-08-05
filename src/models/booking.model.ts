/**
 * Booking — a consultation appointment.
 *
 * Status is modelled as a closed union rather than a boolean pair
 * (`isConfirmed` / `isCancelled`) because those permit impossible states —
 * confirmed *and* cancelled — that the UI then has to guess at. A single
 * union makes the state machine reviewable and exhaustive `switch`es possible.
 *
 * Payment status is tracked separately and deliberately: a booking can be
 * confirmed while payment is still authorising, and a cancelled booking can
 * have a refund in flight. Collapsing them loses both cases.
 */

import type { Entity, Timestamped } from '@app-types/common.types';

import type { IsoDateTime, Money, TimeZone } from './common.model';
import type { ConsultationMode } from './doctor.model';

export const BOOKING_STATUSES = [
  /** Created, awaiting doctor or payment confirmation. */
  'pending',
  'confirmed',
  'inProgress',
  'completed',
  'cancelled',
  /** Patient did not join. Distinct from `cancelled` — it affects refunds. */
  'noShow',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'unpaid',
  'authorising',
  'paid',
  'failed',
  'refundPending',
  'refunded',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface BookingParticipantSummary {
  doctorId: string;
  doctorName: string;
  photoUrl?: string;
}

export interface Booking extends Entity, Timestamped {
  patientId: string;
  /** Denormalised so a booking list renders without N doctor fetches. The
   *  full Doctor is still fetched on the detail screen. */
  doctor: BookingParticipantSummary;

  slotId: string;
  startsAt: IsoDateTime;
  endsAt: IsoDateTime;
  timeZone: TimeZone;
  mode: ConsultationMode;

  status: BookingStatus;
  paymentStatus: PaymentStatus;
  fee: Money;

  /** Populated shortly before the session for video/audio modes. Short-lived;
   *  do not cache. */
  joinUrl?: string;
  patientNotes?: string;
  cancellationReason?: string;
  cancelledAt?: IsoDateTime;
  /** Links to the prescription this consultation produced, once issued. */
  prescriptionRecordId?: string;
}
