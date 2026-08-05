/**
 * Product — the Shop module's core entity.
 *
 * The variant split is the important modelling decision. An Ayurvedic product
 * is sold in several sizes ("60 tablets", "200g churna") at different prices
 * and stock levels. Flattening that into the product would force a fake
 * "default price" that goes stale the moment a size sells out, and would make
 * the cart line ambiguous about what was actually bought.
 */

import type { Entity, Timestamped } from '@app-types/common.types';

import type { Money, Rating } from './common.model';

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

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Classical Ayurvedic preparations. */
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

export type ProductForm = (typeof PRODUCT_FORMS)[number];

export const STOCK_STATUSES = [
  'inStock',
  'lowStock',
  'outOfStock',
  'discontinued',
] as const;

export type StockStatus = (typeof STOCK_STATUSES)[number];

export interface ProductVariant extends Entity {
  /** Stock-keeping unit — the identifier fulfilment actually uses. */
  sku: string;
  /** Human label for the size, e.g. "60 tablets". */
  label: string;
  price: Money;
  /** Struck-through "was" price. Absent when not discounted — an absent field
   *  is unambiguous where `0` would be a bug waiting to render as "₹0.00". */
  compareAtPrice?: Money;
  stockStatus: StockStatus;
  /** Only populated when the server chooses to expose exact counts. */
  unitsAvailable?: number;
}

export interface Product extends Entity, Timestamped {
  name: string;
  slug: string;
  category: ProductCategory;
  form: ProductForm;
  shortDescription: string;
  description?: string;
  /** Sanskrit/common herb names — drives search and the ingredient filter. */
  ingredients: string[];
  images: string[];
  /** Never empty; a product with no purchasable variant is not listed. */
  variants: ProductVariant[];
  rating: Rating;
  /** Gates checkout behind an uploaded prescription. */
  isPrescriptionRequired: boolean;
  tags: string[];
}
