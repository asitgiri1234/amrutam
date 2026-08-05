/**
 * WHY `mocks/` exists — and why it ships in `src/`, not in test helpers:
 *
 *   1. **Parallel development.** Screens get built before the API is ready.
 *      Without a sanctioned mock layer, every engineer invents their own
 *      throwaway fixture and none of them survive to become tests.
 *   2. **Performance work needs volume.** The app's hardest UI problems —
 *      FlashList recycling, filter latency, image loading — only appear at
 *      tens of thousands of rows. Generated data is the only practical way to
 *      get there, and it must be *seeded* so benchmarks are comparable run to
 *      run.
 *   3. **Demos and offline QA.** `config.useMockData` flips the repository
 *      layer over to mocks, which makes a reliable demo build possible with no
 *      network at all.
 *
 * THE COST MODEL, which is the thing to understand before using this:
 *
 *   `dataset.at(i)` / `.byId(id)`  O(1), one entity, no materialisation.
 *   `dataset.stream()`            lazy; pay per item consumed.
 *   `dataset.all()`               materialises once, then memoised. Only
 *                                 list/search/filter needs it.
 *
 * Importing this module generates NOTHING. 35,000 fixtures exist only as a
 * description until something asks a question that requires them.
 */

/* ---- Generation primitives -------------------------------------------- */
export {
  buildLazy,
  buildList,
  buildOne,
  createRandom,
  DEFAULT_SEED,
  deriveSeed,
  paginate,
  parseSequentialId,
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

/* ---- Datasets ---------------------------------------------------------- */
export { LazyDataset } from './datasets';
export type { LazyDatasetOptions } from './datasets';
export {
  doctorDataset,
  healthRecordDataset,
  productDataset,
  resetAllDatasets,
} from './data';

/* ---- Factories --------------------------------------------------------- */
export {
  buildDoctor,
  buildSlotsForDay,
  doctorFactory,
  CITIES,
  DOCTOR_COUNT,
} from './factories/doctor.factory';
export {
  buildProduct,
  productFactory,
  INGREDIENTS,
  PRICE_RANGE_MINOR_UNITS,
  PRODUCT_COUNT,
} from './factories/product.factory';
export {
  buildHealthRecord,
  healthRecordFactory,
  HEALTH_RECORD_COUNT,
  PATIENT_COUNT,
  RECORD_DATE_RANGE_DAYS,
} from './factories/healthRecord.factory';

/* ---- Query engine ------------------------------------------------------ */
export {
  applyFilters,
  matchesQuery,
  paginateResult,
  runQuery,
  search,
  sortItems,
} from './query';
export type {
  PagedResult,
  QueryPipelineOptions,
  SearchableFields,
} from './query';

/* ---- Repository implementations ---------------------------------------- */
export {
  MockDoctorRepository,
  mockDoctorRepository,
} from './repositories/doctor.repository.mock';
export {
  MockProductRepository,
  mockProductRepository,
} from './repositories/product.repository.mock';
export {
  MockHealthRecordRepository,
  mockHealthRecordRepository,
  resetMockHealthRecords,
} from './repositories/healthRecord.repository.mock';
