/**
 * The three dataset singletons.
 *
 * These are cheap to import — constructing a `LazyDataset` allocates nothing
 * but the descriptor. The first `all()` call is where the cost lands, and only
 * for the dataset actually queried.
 */

import type { Doctor, HealthRecord, Product } from '@models';

import { LazyDataset } from '../datasets';
import { DOCTOR_COUNT, doctorFactory } from '../factories/doctor.factory';
import {
  HEALTH_RECORD_COUNT,
  healthRecordFactory,
} from '../factories/healthRecord.factory';
import { PRODUCT_COUNT, productFactory } from '../factories/product.factory';

export const doctorDataset = new LazyDataset<Doctor>({
  idPrefix: 'doctor',
  factory: doctorFactory,
  count: DOCTOR_COUNT,
});

export const productDataset = new LazyDataset<Product>({
  idPrefix: 'product',
  factory: productFactory,
  count: PRODUCT_COUNT,
});

export const healthRecordDataset = new LazyDataset<HealthRecord>({
  idPrefix: 'record',
  factory: healthRecordFactory,
  count: HEALTH_RECORD_COUNT,
});

/** Clears every memoised dataset. Test-only. */
export function resetAllDatasets(): void {
  doctorDataset.reset();
  productDataset.reset();
  healthRecordDataset.reset();
}
