/**
 * Health record fixtures.
 *
 * TWO RULES, and they are not stylistic:
 *
 *   1. **Never use a real person's data**, not even anonymised, not even for
 *      one screenshot. Every value below is generated.
 *   2. **Never let mock health data reach production storage.** These are
 *      served only when `config.useMockData` is on, and mocked records must be
 *      written to the cache bucket only — never the app bucket — so a build
 *      flip cannot leave synthetic diagnoses in a real user's history.
 *
 * Record types, sources and vital metrics live in `@models`; only fixture
 * pools live in `../data/pools`.
 */

import {
  RECORD_SOURCES,
  RECORD_TYPES,
  VITAL_METRICS,
  type Attachment,
  type HealthRecord,
  type RecordSource,
  type RecordType,
  type VitalMeasurement,
} from '@models';

import {
  CONSULTATION_NOTE_TOPICS,
  FIRST_NAMES,
  IMAGING_STUDIES,
  LAB_PANELS,
  SURNAMES,
  VACCINES,
} from '../data/pools';
import {
  buildOne,
  FIXTURE_NOW_MS,
  pickOne,
  randomBoolean,
  randomInt,
  sequentialId,
  type MockFactory,
  type Random,
} from '../mockUtils';

export const HEALTH_RECORD_COUNT = 10_000;

/** Records are spread across this window so the timeline UI has real grouping
 *  boundaries (today / this week / this month / older) to exercise. */
export const RECORD_DATE_RANGE_DAYS = 730;

/** A small household, so the family-member filter has something to filter. */
export const PATIENT_COUNT = 4;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** The source is not independent of the type — a lab does not write a
 *  consultation note. Modelling that keeps the data self-consistent. */
function sourceForType(type: RecordType, random: Random): RecordSource {
  switch (type) {
    case 'labReport':
    case 'imaging':
      return 'lab';
    case 'prescription':
    case 'consultationNote':
      return 'doctor';
    case 'vitals':
      return randomBoolean(random, 0.7) ? 'self' : 'doctor';
    default:
      return pickOne(random, RECORD_SOURCES) ?? 'doctor';
  }
}

function titleForType(type: RecordType, random: Random): string {
  switch (type) {
    case 'labReport':
      return pickOne(random, LAB_PANELS) ?? 'Complete Blood Count';
    case 'imaging':
      return pickOne(random, IMAGING_STUDIES) ?? 'Chest X-Ray';
    case 'vaccination':
      return `${pickOne(random, VACCINES) ?? 'Influenza'} vaccination`;
    case 'consultationNote':
      return pickOne(random, CONSULTATION_NOTE_TOPICS) ?? 'Follow-up review';
    case 'prescription':
      return 'Consultation prescription';
    default:
      return 'Vitals reading';
  }
}

/** Plausible value per metric, so charts have a believable shape. */
function buildVital(random: Random, recordedAt: string): VitalMeasurement {
  const metric = VITAL_METRICS[randomInt(random, 0, VITAL_METRICS.length - 1)];
  const definition = metric ?? VITAL_METRICS[0];

  const value = ((): string => {
    switch (definition.key) {
      case 'bloodPressure':
        return `${randomInt(random, 105, 145)}/${randomInt(random, 65, 95)}`;
      case 'heartRate':
        return String(randomInt(random, 55, 105));
      case 'weight':
        return String(randomInt(random, 45, 105));
      case 'bloodSugar':
        return String(randomInt(random, 75, 190));
      default:
        return String(randomInt(random, 93, 100));
    }
  })();

  return {
    metric: definition.key,
    value,
    unit: definition.unit,
    recordedAt,
  };
}

function buildAttachment(
  random: Random,
  index: number,
  attachmentIndex: number,
  uploadedAt: string,
): Attachment {
  const isPdf = randomBoolean(random, 0.7);

  return {
    id: sequentialId(`record-${index}-attachment`, attachmentIndex, 2),
    type: isPdf ? 'pdf' : 'image',
    // Deliberately not a reachable URL: attachments are signed and expiring in
    // production, and a mock that loads real bytes would hide that.
    url: `https://mock.amrutam.invalid/records/${index}/${attachmentIndex}`,
    fileName: isPdf
      ? `report-${attachmentIndex + 1}.pdf`
      : `scan-${attachmentIndex + 1}.jpg`,
    sizeBytes: randomInt(random, 40_000, 6_000_000),
    uploadedAt,
  };
}

export const healthRecordFactory: MockFactory<HealthRecord> = (
  index,
  random,
) => {
  const type = pickOne(random, RECORD_TYPES) ?? 'vitals';
  const source = sourceForType(type, random);

  // Anchored to FIXTURE_NOW_MS, not Date.now() — see that constant for why.
  const recordedAtMs =
    FIXTURE_NOW_MS - randomInt(random, 0, RECORD_DATE_RANGE_DAYS) * MS_PER_DAY;
  const recordedAt = new Date(recordedAtMs).toISOString();
  // Uploaded at or after the event — a back-dated lab report is normal, the
  // reverse is not, and the timeline sorts on `recordedAt` because of it.
  const createdAt = new Date(
    recordedAtMs + randomInt(random, 0, 5) * MS_PER_DAY,
  ).toISOString();

  const attachmentCount =
    type === 'labReport' || type === 'imaging'
      ? randomInt(random, 1, 3)
      : randomInt(random, 0, 1);

  const hasAuthor = source !== 'self';

  return {
    id: sequentialId('record', index),
    createdAt,
    updatedAt: createdAt,

    patientId: sequentialId('patient', index % PATIENT_COUNT, 2),
    type,
    title: titleForType(type, random),
    recordedAt,
    source,
    ...(hasAuthor
      ? {
          author: {
            doctorId: sequentialId('doctor', randomInt(random, 0, 4_999)),
            name: `Dr. ${pickOne(random, FIRST_NAMES) ?? 'Meera'} ${
              pickOne(random, SURNAMES) ?? 'Nair'
            }`,
          },
        }
      : {}),
    ...(randomBoolean(random, 0.45)
      ? { notes: 'Reviewed. Continue current regimen and reassess next visit.' }
      : {}),
    attachments: Array.from({ length: attachmentCount }, (_unused, i) =>
      buildAttachment(random, index, i, createdAt),
    ),
    ...(type === 'vitals'
      ? {
          vitals: Array.from({ length: randomInt(random, 1, 3) }, () =>
            buildVital(random, recordedAt),
          ),
        }
      : {}),
    ...(type === 'prescription'
      ? { bookingId: sequentialId('booking', randomInt(random, 0, 999)) }
      : {}),
  };
};

/** Generates one record by index without materialising the dataset. */
export function buildHealthRecord(index: number, seed?: number): HealthRecord {
  return buildOne(healthRecordFactory, index, seed);
}
