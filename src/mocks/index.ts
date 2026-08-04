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
 * NO DATASETS ARE GENERATED YET. The factories deliberately contain only the
 * vocabulary (specialities, categories, record types) plus a documented TODO —
 * the entity shapes belong to modules that do not exist, and guessing them
 * would guarantee divergence.
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

export {
  CITIES,
  CONSULTATION_MODES,
  LANGUAGES,
  SPECIALITIES,
} from './factories/doctor.factory';
export type { ConsultationMode, Speciality } from './factories/doctor.factory';

export {
  INGREDIENTS,
  PRICE_RANGE_MINOR_UNITS,
  PRODUCT_CATEGORIES,
  PRODUCT_FORMS,
} from './factories/product.factory';
export type { ProductCategory, ProductForm } from './factories/product.factory';

export {
  ATTACHMENT_TYPES,
  RECORD_DATE_RANGE_DAYS,
  RECORD_TYPES,
  VITAL_METRICS,
} from './factories/healthRecord.factory';
export type {
  AttachmentType,
  RecordType,
} from './factories/healthRecord.factory';
