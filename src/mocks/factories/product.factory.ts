/**
 * Product fixtures — the largest dataset at 20,000 rows.
 *
 * This is the one that stresses the catalogue: FlashList recycling, image
 * loading, filter latency and search ranking all show their real behaviour
 * here and nowhere else.
 *
 * Prices are generated in **paise** (minor units), never rupees. A float here
 * would hide exactly the rounding bugs that a mocked cart exists to surface.
 * See `Money` in `@models`.
 *
 * Categories, forms and stock statuses live in `@models` — only fixture pools
 * live in `../data/pools`.
 */

import {
  PRODUCT_CATEGORIES,
  PRODUCT_FORMS,
  type Money,
  type Product,
  type ProductForm,
  type ProductVariant,
  type StockStatus,
} from '@models';

import {
  PRODUCT_BENEFITS,
  PRODUCT_PREFIXES,
  VARIANT_LABELS,
} from '../data/pools';
import {
  buildOne,
  pickMany,
  pickOne,
  randomBoolean,
  randomFloat,
  randomInt,
  sequentialId,
  type MockFactory,
  type Random,
} from '../mockUtils';

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
  'Arjuna',
  'Shankhpushpi',
  'Punarnava',
  'Manjistha',
  'Vacha',
] as const;

/** Realistic price band in paise: ₹99 – ₹4,999. */
export const PRICE_RANGE_MINOR_UNITS = { min: 9_900, max: 499_900 } as const;

export const PRODUCT_COUNT = 20_000;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Weighted so most things are buyable — a catalogue that is 25% out of stock
 *  would make the "in stock only" filter look broken. */
function pickStockStatus(random: Random): StockStatus {
  const roll = random();
  if (roll < 0.72) {
    return 'inStock';
  }
  if (roll < 0.9) {
    return 'lowStock';
  }
  if (roll < 0.98) {
    return 'outOfStock';
  }
  return 'discontinued';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildVariants(
  random: Random,
  index: number,
  form: ProductForm,
  basePriceMinor: number,
): ProductVariant[] {
  const labels = VARIANT_LABELS[form] ?? ['Standard'];
  const variantCount = randomInt(random, 1, labels.length);

  return Array.from({ length: variantCount }, (_unused, variantIndex) => {
    const label = labels[variantIndex] ?? 'Standard';
    // Larger sizes cost more but less per unit — the usual retail shape.
    const multiplier = 1 + variantIndex * randomFloat(random, 0.6, 0.9, 2);
    const amountMinor = Math.round((basePriceMinor * multiplier) / 100) * 100;

    const stockStatus = pickStockStatus(random);
    const isDiscounted = randomBoolean(random, 0.28);

    const price: Money = { amountMinor, currency: 'INR' };
    const compareAtPrice: Money = {
      amountMinor:
        Math.round((amountMinor * randomFloat(random, 1.1, 1.5, 2)) / 100) *
        100,
      currency: 'INR',
    };

    return {
      id: sequentialId(`product-${index}-variant`, variantIndex, 2),
      sku: `AMR-${String(index).padStart(5, '0')}-${variantIndex}`,
      label,
      price,
      ...(isDiscounted ? { compareAtPrice } : {}),
      stockStatus,
      ...(stockStatus === 'inStock' || stockStatus === 'lowStock'
        ? {
            unitsAvailable:
              stockStatus === 'lowStock'
                ? randomInt(random, 1, 9)
                : randomInt(random, 10, 800),
          }
        : {}),
    };
  });
}

export const productFactory: MockFactory<Product> = (index, random) => {
  const hero = pickOne(random, INGREDIENTS) ?? 'Ashwagandha';
  const form = pickOne(random, PRODUCT_FORMS) ?? 'Churna';
  const prefix = pickOne(random, PRODUCT_PREFIXES) ?? 'Amrutam';
  const category = pickOne(random, PRODUCT_CATEGORIES) ?? 'Immunity';

  const name = `${prefix} ${hero} ${form}`;
  const basePriceMinor = randomInt(
    random,
    PRICE_RANGE_MINOR_UNITS.min,
    PRICE_RANGE_MINOR_UNITS.max,
  );

  // Supporting herbs always include the hero, so ingredient search finds the
  // product its name advertises.
  const supporting = pickMany(random, INGREDIENTS, randomInt(random, 1, 4));
  const ingredients = Array.from(new Set([hero, ...supporting]));

  const createdAtMs =
    Date.UTC(2021, 0, 1) + randomInt(random, 0, 1_500) * MS_PER_DAY;

  const isPrescriptionRequired = randomBoolean(random, 0.12);

  return {
    id: sequentialId('product', index),
    createdAt: new Date(createdAtMs).toISOString(),
    updatedAt: new Date(
      createdAtMs + randomInt(random, 0, 300) * MS_PER_DAY,
    ).toISOString(),

    name,
    // Index-suffixed so slugs stay unique across 20,000 rows despite the
    // name pool being far smaller.
    slug: `${slugify(name)}-${index}`,
    category,
    form,
    shortDescription: `${hero} ${form.toLowerCase()} that ${
      pickOne(random, PRODUCT_BENEFITS) ?? 'supports everyday wellness'
    }.`,
    description: `A classical ${form.toLowerCase()} preparation centred on ${hero}. Traditionally used to support ${category.toLowerCase()}. Take as directed by your practitioner.`,
    ingredients,
    images: [],
    variants: buildVariants(random, index, form, basePriceMinor),
    rating: {
      average: randomFloat(random, 3.2, 5, 1),
      count: randomInt(random, 0, 4_000),
    },
    isPrescriptionRequired,
    tags: [
      category,
      form,
      ...(randomBoolean(random, 0.18) ? ['bestseller'] : []),
      ...(isPrescriptionRequired ? ['prescription'] : []),
    ],
  };
};

/** Generates one product by index without materialising the dataset. */
export function buildProduct(index: number, seed?: number): Product {
  return buildOne(productFactory, index, seed);
}
