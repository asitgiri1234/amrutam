/**
 * Repository resolution.
 *
 * WHY a resolver function rather than a module-level constant: reading
 * `config.useMockData` at import time would bake the choice into the module
 * graph, which makes it untestable — a test could never render the screen
 * against a stub. A function keeps the decision at call time and gives tests a
 * single seam (`setDoctorRepository`) instead of `jest.mock` on a deep path.
 *
 * This is the ONLY place in the module that knows the mock exists. Everything
 * above it depends on the `DoctorRepository` interface.
 */

import { config } from '@config';
import { mockDoctorRepository } from '@mocks';
import type { DoctorRepository } from '@repositories/contracts';

import { httpDoctorRepository } from './doctor.repository';

let override: DoctorRepository | null = null;

/** Test seam. Pass `null` to restore the configured implementation. */
export function setDoctorRepository(repository: DoctorRepository | null): void {
  override = repository;
}

export function getDoctorRepository(): DoctorRepository {
  if (override !== null) {
    return override;
  }
  return config.useMockData ? mockDoctorRepository : httpDoctorRepository;
}

export {
  HttpDoctorRepository,
  httpDoctorRepository,
} from './doctor.repository';
