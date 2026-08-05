/**
 * Doctor mock factory.
 *
 * NO DATA IS GENERATED YET — by design. Generating fixtures before any screen
 * consumes them produces data shaped for nothing in particular.
 *
 * The `Doctor` type now exists in `@models`, so the factory has a real target:
 *
 *   import type { Doctor } from '@models';
 *   const doctorFactory: MockFactory<Doctor> = (index, random) => ({ … });
 *   export const buildDoctors = (count, options) =>
 *     buildList(doctorFactory, count, options);
 *
 * Rules for whoever writes it:
 *   - Keep it seeded, so screenshots and benchmarks are comparable run to run.
 *   - Use `buildLazy` above ~1000 rows; materialising 10k in one tick drops
 *     frames and would poison the very benchmark this exists for.
 *   - Fees are `Money` in **minor units**. A float here hides rounding bugs.
 *
 * The domain vocabulary (specialities, modes, languages) deliberately lives in
 * `@models` and is NOT re-exported from here. Import it from `@models` —
 * a second import path for the same symbol is how two copies eventually
 * appear. Only pools that are *purely* fixture material live below.
 */

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
