/**
 * Product mock factory.
 *
 * NO DATA IS GENERATED YET — see `doctor.factory.ts` for the rationale.
 *
 * TO IMPLEMENT (Shop milestone): build against the module's `Product` type
 * using the pools below plus `buildList` / `buildLazy`.
 *
 * One rule for whoever writes it: prices must be generated in **paise**
 * (minor units), never rupees. `utils/formatter.formatCurrency` expects minor
 * units, and a mock that emits floats will hide the rounding bugs that mocks
 * exist to surface.
 */

export const PRODUCT_CATEGORIES = [
  'Immunity',
  'Digestion',
  'Skin & Hair',
  'Joint Care',
  'Sleep & Stress',
  'Womens Health',
  'Mens Health',
  'Respiratory',
  'Diabetes Care',
  'Weight Management',
] as const;

export const PRODUCT_FORMS = [
  'Churna',
  'Tablet',
  'Capsule',
  'Syrup',
  'Oil',
  'Ghrita',
  'Kadha',
  'Lehyam',
] as const;

/** Common ingredient names — used for search and filter fixtures. */
export const INGREDIENTS = [
  'Ashwagandha',
  'Brahmi',
  'Triphala',
  'Shatavari',
  'Guduchi',
  'Neem',
  'Tulsi',
  'Amla',
  'Haldi',
  'Yashtimadhu',
] as const;

/** Realistic price band in paise: ₹99 – ₹4,999. */
export const PRICE_RANGE_MINOR_UNITS = { min: 9_900, max: 499_900 } as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductForm = (typeof PRODUCT_FORMS)[number];
