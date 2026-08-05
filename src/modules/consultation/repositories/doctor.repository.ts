/**
 * HTTP implementation of `DoctorRepository`.
 *
 * WHY this exists even though there is no backend yet: it is what makes the
 * mock a *substitute* rather than the only reality. Both implementations
 * satisfy the same interface, so the screen is written once and the swap is a
 * config flag — and writing the real one now surfaces the questions the API
 * has to answer (how are array filters serialised? does the list return
 * `{ data, meta }`?) while they are still cheap to change.
 *
 * No business logic lives here. It maps filters onto query params and hands
 * the envelope back. Anything that decides *what* to fetch belongs in a hook.
 */

import { Endpoints } from '@api/endpoints';
import { http, type HttpClient, type ListResult } from '@api/httpClient';
import type { RequestOptions } from '@app-types/api.types';
import type { Doctor, TimeSlot } from '@models';
import type {
  DoctorFilters,
  DoctorRepository,
  SlotQuery,
} from '@repositories/contracts';

/**
 * Flattens filters into query params.
 *
 * Arrays are passed through as arrays — `utils/network.buildQueryString`
 * expands them to repeated keys (`?speciality=a&speciality=b`), which is the
 * convention the backend expects. Undefined entries are dropped there too, so
 * this stays a straight mapping with no conditionals.
 */
function toQueryParams(filters: DoctorFilters): Record<string, unknown> {
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    q: filters.query,
    speciality: filters.specialities,
    mode: filters.modes,
    language: filters.languages,
    city: filters.city,
    minRating: filters.minRating,
    maxFee: filters.maxFeeMinor,
    minExperience: filters.minExperienceYears,
    maxExperience: filters.maxExperienceYears,
    availableOn: filters.availableOn,
    acceptingPatients: filters.acceptingPatientsOnly,
    sortField: filters.sort?.field,
    sortDirection: filters.sort?.direction,
  };
}

export class HttpDoctorRepository implements DoctorRepository {
  constructor(private readonly client: HttpClient = http) {}

  findById(id: string, options?: RequestOptions): Promise<Doctor> {
    return this.client.get<Doctor>(
      Endpoints.consultation.doctor(id),
      undefined,
      options,
    );
  }

  list(
    filters: DoctorFilters,
    options?: RequestOptions,
  ): Promise<ListResult<Doctor>> {
    return this.client.getList<Doctor>(
      Endpoints.consultation.doctors(),
      toQueryParams(filters),
      options,
    );
  }

  listSlots(
    doctorId: string,
    query: SlotQuery,
    options?: RequestOptions,
  ): Promise<TimeSlot[]> {
    return this.client.get<TimeSlot[]>(
      Endpoints.consultation.doctorSlots(doctorId),
      { from: query.from, to: query.to, mode: query.mode },
      options,
    );
  }
}

export const httpDoctorRepository = new HttpDoctorRepository();
