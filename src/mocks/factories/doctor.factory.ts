/**
 * Doctor fixtures.
 *
 * Deterministic: `doctorFactory(42, rng)` with the same seed always produces
 * the same doctor, and — because each index gets its own derived stream (see
 * `deriveSeed`) — doctor 42 is identical whether generated alone or as part of
 * all 5,000.
 *
 * The domain vocabulary (specialities, modes, languages) comes from `@models`,
 * not from here. Only fixture-only pools live in `../data/pools`.
 */

import {
  CONSULTATION_MODES,
  LANGUAGES,
  SPECIALITIES,
  type ConsultationMode,
  type Doctor,
  type Money,
  type TimeSlot,
} from '@models';

import {
  BIO_FOCUS,
  CLINIC_SUFFIXES,
  FIRST_NAMES,
  QUALIFICATIONS,
  SURNAMES,
} from '../data/pools';
import {
  buildOne,
  createRandom,
  deriveSeed,
  FIXTURE_NOW_MS,
  parseSequentialId,
  pickMany,
  pickOne,
  randomBoolean,
  randomFloat,
  randomInt,
  sequentialId,
  type MockFactory,
  type Random,
} from '../mockUtils';

/** Cities used to populate mock clinics. Fixture material — the real city list
 *  comes from the API, so this is not a domain type. */
export const CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Kochi',
] as const;

export const DOCTOR_COUNT = 5_000;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Consultation fees in paise: ₹300 – ₹2,500. */
const FEE_RANGE_MINOR = { min: 30_000, max: 250_000 } as const;

/** In-person costs more than chat; the multipliers keep pricing believable
 *  rather than random per mode. */
const MODE_FEE_MULTIPLIER: Record<ConsultationMode, number> = {
  chat: 0.6,
  audio: 0.8,
  video: 1,
  inPerson: 1.4,
};

function buildFees(
  random: Random,
  modes: ConsultationMode[],
  baseMinor: number,
): Partial<Record<ConsultationMode, Money>> {
  const fees: Partial<Record<ConsultationMode, Money>> = {};

  for (const mode of modes) {
    // Rounded to the nearest ₹10 — real price lists do not end in ₹417.63.
    const amountMinor =
      Math.round((baseMinor * MODE_FEE_MULTIPLIER[mode]) / 1_000) * 1_000;
    fees[mode] = { amountMinor, currency: 'INR' };
  }

  // Nudge the random stream so two doctors with identical modes still differ
  // in later fields.
  random();
  return fees;
}

export const doctorFactory: MockFactory<Doctor> = (index, random) => {
  const firstName = pickOne(random, FIRST_NAMES) ?? 'Aarav';
  const surname = pickOne(random, SURNAMES) ?? 'Sharma';
  const city = pickOne(random, CITIES) ?? 'Mumbai';

  const modes = pickMany(random, CONSULTATION_MODES, randomInt(random, 1, 3));
  const resolvedModes: ConsultationMode[] =
    modes.length > 0 ? modes : ['video'];

  const baseFeeMinor = randomInt(
    random,
    FEE_RANGE_MINOR.min,
    FEE_RANGE_MINOR.max,
  );
  const experienceYears = randomInt(random, 1, 38);

  // Experienced doctors carry more reviews — a flat distribution would make
  // the "most reviewed" sort meaningless.
  const reviewCount = randomInt(random, 5, 80) * Math.max(1, experienceYears);

  const createdAtMs =
    Date.UTC(2020, 0, 1) + randomInt(random, 0, 1_800) * MS_PER_DAY;

  const isAcceptingPatients = randomBoolean(random, 0.82);

  return {
    id: sequentialId('doctor', index),
    createdAt: new Date(createdAtMs).toISOString(),
    updatedAt: new Date(
      createdAtMs + randomInt(random, 0, 400) * MS_PER_DAY,
    ).toISOString(),

    fullName: `Dr. ${firstName} ${surname}`,
    registrationNumber: `AYUSH-${String(100_000 + index).padStart(6, '0')}`,
    specialities: pickMany(random, SPECIALITIES, randomInt(random, 1, 3)),
    qualifications: pickMany(random, QUALIFICATIONS, randomInt(random, 1, 3)),
    experienceYears,
    languages: pickMany(random, LANGUAGES, randomInt(random, 1, 4)),
    bio: `Practises with a focus on ${
      pickOne(random, BIO_FOCUS) ?? 'preventive lifestyle medicine'
    }. ${experienceYears} years of clinical experience in ${city}.`,
    clinic: {
      id: sequentialId('clinic', index),
      name: `${surname} ${
        pickOne(random, CLINIC_SUFFIXES) ?? 'Wellness Centre'
      }`,
      city,
    },

    consultationModes: resolvedModes,
    fees: buildFees(random, resolvedModes, baseFeeMinor),

    rating: {
      // Skewed high, as real marketplace ratings are — a uniform 0–5 spread
      // would make the rating filter behave nothing like production.
      average: randomFloat(random, 3.4, 5, 1),
      count: reviewCount,
    },
    isAcceptingPatients,
    ...(isAcceptingPatients
      ? {
          // Anchored to FIXTURE_NOW_MS, not Date.now() — see that constant.
          nextAvailableAt: new Date(
            FIXTURE_NOW_MS + randomInt(random, 1, 14 * 24) * 60 * 60 * 1000,
          ).toISOString(),
        }
      : {}),
  };
};

/** Generates one doctor by index without materialising the dataset. */
export function buildDoctor(index: number, seed?: number): Doctor {
  return buildOne(doctorFactory, index, seed);
}

/**
 * Slots are generated on demand from the doctor's id + day, rather than stored:
 * there would be 5,000 doctors × 14 days × ~16 slots ≈ 1.1 million of them, and
 * materialising that to answer one screen's question would be absurd.
 */
export function buildSlotsForDay(
  doctor: Doctor,
  dayIndex: number,
  dayStartMs: number,
): TimeSlot[] {
  // Seeded from (doctor, day) so the same doctor's Tuesday is always the same
  // Tuesday, without storing anything.
  const doctorIndex = parseSequentialId('doctor', doctor.id) ?? 0;
  const random = createRandom(deriveSeed(doctorIndex, dayIndex));

  const slots: TimeSlot[] = [];
  const slotCount = randomInt(random, 0, 12);
  const mode = doctor.consultationModes[0] ?? 'video';
  const fee = doctor.fees[mode] ?? { amountMinor: 50_000, currency: 'INR' };

  for (let i = 0; i < slotCount; i += 1) {
    // Clinic hours: 09:00–18:00 in 30-minute steps.
    const startsAtMs = dayStartMs + (9 * 60 + i * 30) * 60 * 1000;

    slots.push({
      id: `${doctor.id}-slot-${dayIndex}-${i}`,
      doctorId: doctor.id,
      startsAt: new Date(startsAtMs).toISOString(),
      endsAt: new Date(startsAtMs + 30 * 60 * 1000).toISOString(),
      timeZone: 'Asia/Kolkata',
      mode,
      isAvailable: randomBoolean(random, 0.65),
      fee,
    });
  }

  return slots;
}
