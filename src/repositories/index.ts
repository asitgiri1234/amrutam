/**
 * WHY `repositories/` exists:
 *
 * This is the *domain data* boundary. `api/` knows HTTP; `repositories/` knows
 * what a Doctor is and where one comes from. Screens and hooks talk only to
 * repositories.
 *
 * The concrete value of the split, in practice:
 *
 *   - When we add offline read-through caching, exactly one layer changes.
 *   - When a module needs mock data for a demo, we swap the repository, not
 *     the screens.
 *   - When the backend renames a field, the blast radius is one file, because
 *     the repository is also where wire-shape maps to domain-shape.
 *   - Business logic becomes testable without a network stack.
 *
 * INTENTIONALLY has no concrete repositories yet — those arrive with their
 * modules. What is here is the contract they must satisfy.
 */

export { BaseRepository } from './base.repository';

export type {
  CacheableRepository,
  Creatable,
  CursorListable,
  Deletable,
  Listable,
  Readable,
  Updatable,
} from './types';

/* Entity contracts — interfaces only. Implementations arrive with modules. */
export type {
  AddCartItemInput,
  BaseFilters,
  BookingFilters,
  BookingRepository,
  CartRepository,
  CreateBookingInput,
  CreateHealthRecordInput,
  DoctorFilters,
  DoctorRepository,
  HealthRecordFilters,
  HealthRecordRepository,
  ProductFilters,
  ProductRepository,
  RescheduleBookingInput,
  SlotQuery,
  UpdateCartItemInput,
} from './contracts';
