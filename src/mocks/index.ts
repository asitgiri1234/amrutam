/**
 * WHY `mocks/` exists — and why it ships in `src/`, not in test helpers:
 *
 *   1. **Parallel development.** Screens get built before the API is ready.
 *      Without a sanctioned mock layer, every engineer invents their own
 *      throwaway fixture and none of them survive to become tests.
 *   2. **Performance work needs volume.** The app's hardest UI problems —
 *      FlashList recycling, filter latency, image loading — only appear at
 *      10,000 rows. Generated data is the only practical way to get there, and
 *      it must be *seeded* so benchmarks are comparable run to run.
 *   3. **Demos and offline QA.** `config.useMockData` flips the repository
 *      layer over to mocks, which makes a reliable demo build possible without
 *      a network.
 *
 * NO DATASETS ARE GENERATED YET. The entity shapes now exist in `@models`, so
 * the factories have a real target — each carries a documented TODO with the
 * rules that apply (seeded, lazy above ~1000 rows, money in minor units).
 * Generating fixtures before a screen consumes them produces data shaped for
 * nothing in particular, so that step waits for the first module.
 */

export {
  buildLazy,
  buildList,
  createRandom,
  DEFAULT_SEED,
  paginate,
  pickMany,
  pickOne,
  randomBoolean,
  randomDateBetween,
  randomFloat,
  randomInt,
  sequentialId,
  withLatency,
} from './mockUtils';
export type { BuildOptions, MockFactory, Random } from './mockUtils';

/* Fixture pools only. Domain vocabulary (specialities, categories, record
 * types) is exported from `@models` and deliberately not mirrored here — the
 * mock layer must never become a second place to learn what a Speciality is. */

export { CITIES } from './factories/doctor.factory';
export {
  INGREDIENTS,
  PRICE_RANGE_MINOR_UNITS,
} from './factories/product.factory';
export { RECORD_DATE_RANGE_DAYS } from './factories/healthRecord.factory';
