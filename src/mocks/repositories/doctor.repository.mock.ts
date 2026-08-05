/**
 * Mock DoctorRepository.
 *
 * Implements the same `DoctorRepository` contract the real one will, so a
 * module built against the interface needs no change when the API lands —
 * flipping `config.useMockData` is the whole migration.
 *
 * Note what it does NOT do: no network, no `axios`, no business rules. It
 * reads generated fixtures and applies the same search → filter → sort →
 * paginate pipeline the server will.
 */

import { ApiError } from '@api/errors';
import type { RequestOptions } from '@app-types/api.types';
import type { Doctor, TimeSlot } from '@models';
import type {
  DoctorFilters,
  DoctorRepository,
  SlotQuery,
} from '@repositories/contracts';

import { doctorDataset } from '../data';
import { buildSlotsForDay } from '../factories/doctor.factory';
import { withLatency } from '../mockUtils';
import { runQuery } from '../query';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_SLOT_DAYS = 30;

/** A doctor matches on name, speciality, city and language — the four things
 *  a user actually types into the search box. */
const searchableFields = (doctor: Doctor): Array<string | undefined> => [
  doctor.fullName,
  doctor.clinic?.name,
  doctor.clinic?.city,
  ...doctor.specialities,
  ...doctor.languages,
];

export class MockDoctorRepository implements DoctorRepository {
  async findById(id: string, _options?: RequestOptions): Promise<Doctor> {
    // O(1): the id encodes the index, so this never materialises the dataset.
    const doctor = doctorDataset.byId(id);

    if (doctor === undefined) {
      throw new ApiError({
        kind: 'notFound',
        message: `Doctor ${id} was not found`,
        status: 404,
      });
    }

    return withLatency(doctor, 120);
  }

  async list(filters: DoctorFilters, _options?: RequestOptions) {
    const result = runQuery<Doctor, DoctorFilters>({
      items: doctorDataset.all(),
      filters,
      searchableFields,
      predicates: [
        filters.specialities === undefined || filters.specialities.length === 0
          ? undefined
          : doctor =>
              filters.specialities!.some(speciality =>
                doctor.specialities.includes(speciality),
              ),

        filters.modes === undefined || filters.modes.length === 0
          ? undefined
          : doctor =>
              filters.modes!.some(mode =>
                doctor.consultationModes.includes(mode),
              ),

        filters.languages === undefined || filters.languages.length === 0
          ? undefined
          : doctor =>
              filters.languages!.some(language =>
                doctor.languages.includes(language),
              ),

        filters.city === undefined
          ? undefined
          : doctor => doctor.clinic?.city === filters.city,

        filters.minRating === undefined
          ? undefined
          : doctor => doctor.rating.average >= filters.minRating!,

        filters.maxFeeMinor === undefined
          ? undefined
          : doctor =>
              Object.values(doctor.fees).some(
                fee => fee.amountMinor <= filters.maxFeeMinor!,
              ),

        filters.acceptingPatientsOnly === true
          ? doctor => doctor.isAcceptingPatients
          : undefined,
      ],
    });

    return withLatency(result, 220);
  }

  async listSlots(
    doctorId: string,
    query: SlotQuery,
    _options?: RequestOptions,
  ): Promise<TimeSlot[]> {
    const doctor = await this.findById(doctorId);

    const fromMs = Date.parse(query.from);
    const toMs = Date.parse(query.to);

    if (Number.isNaN(fromMs) || Number.isNaN(toMs) || toMs < fromMs) {
      throw new ApiError({
        kind: 'validation',
        message: 'Invalid slot date range',
        status: 422,
      });
    }

    // Bounded so a careless year-long range cannot generate ~6,000 slots.
    const dayCount = Math.min(
      Math.floor((toMs - fromMs) / MS_PER_DAY) + 1,
      MAX_SLOT_DAYS,
    );

    const slots: TimeSlot[] = [];

    for (let day = 0; day < dayCount; day += 1) {
      const dayStartMs = fromMs + day * MS_PER_DAY;
      const daySlots = buildSlotsForDay(doctor, day, dayStartMs);

      slots.push(
        ...(query.mode === undefined
          ? daySlots
          : daySlots.filter(slot => slot.mode === query.mode)),
      );
    }

    return withLatency(slots, 150);
  }
}

export const mockDoctorRepository = new MockDoctorRepository();
