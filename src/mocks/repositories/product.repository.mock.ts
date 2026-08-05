/**
 * Mock ProductRepository — the 20,000-row one.
 *
 * `findBySlug` deliberately does NOT get the O(1) treatment that `findById`
 * does: a slug carries no index, so resolving one is a genuine scan. That
 * asymmetry is real and worth preserving — it mirrors the database, where an
 * id lookup hits the primary key and a slug lookup needs its own index.
 */

import { ApiError } from '@api/errors';
import type { RequestOptions } from '@app-types/api.types';
import type { Product } from '@models';
import type {
  ProductFilters,
  ProductRepository,
} from '@repositories/contracts';

import { productDataset } from '../data';
import { withLatency } from '../mockUtils';
import { paginateResult, runQuery } from '../query';

const RELATED_LIMIT = 8;

/** Products match on name, ingredients, category and tags — an ingredient
 *  search is the one users actually rely on in an Ayurvedic catalogue. */
const searchableFields = (product: Product): Array<string | undefined> => [
  product.name,
  product.shortDescription,
  product.category,
  product.form,
  ...product.ingredients,
  ...product.tags,
];

/** Cheapest variant, used for price filtering. A product is "under ₹500" if
 *  any size is, which is how a shopper reads it. */
function lowestPriceMinor(product: Product): number {
  return product.variants.reduce(
    (lowest, variant) => Math.min(lowest, variant.price.amountMinor),
    Number.POSITIVE_INFINITY,
  );
}

function isPurchasable(product: Product): boolean {
  return product.variants.some(
    variant =>
      variant.stockStatus === 'inStock' || variant.stockStatus === 'lowStock',
  );
}

export class MockProductRepository implements ProductRepository {
  async findById(id: string, _options?: RequestOptions): Promise<Product> {
    const product = productDataset.byId(id);

    if (product === undefined) {
      throw new ApiError({
        kind: 'notFound',
        message: `Product ${id} was not found`,
        status: 404,
      });
    }

    return withLatency(product, 120);
  }

  async findBySlug(slug: string, _options?: RequestOptions): Promise<Product> {
    const product = productDataset.all().find(item => item.slug === slug);

    if (product === undefined) {
      throw new ApiError({
        kind: 'notFound',
        message: `Product "${slug}" was not found`,
        status: 404,
      });
    }

    return withLatency(product, 160);
  }

  async list(filters: ProductFilters, _options?: RequestOptions) {
    const result = runQuery<Product, ProductFilters>({
      items: productDataset.all(),
      filters,
      searchableFields,
      predicates: [
        filters.categories === undefined || filters.categories.length === 0
          ? undefined
          : product => filters.categories!.includes(product.category),

        filters.forms === undefined || filters.forms.length === 0
          ? undefined
          : product => filters.forms!.includes(product.form),

        filters.ingredients === undefined || filters.ingredients.length === 0
          ? undefined
          : product =>
              filters.ingredients!.some(ingredient =>
                product.ingredients.includes(ingredient),
              ),

        filters.minPriceMinor === undefined
          ? undefined
          : product => lowestPriceMinor(product) >= filters.minPriceMinor!,

        filters.maxPriceMinor === undefined
          ? undefined
          : product => lowestPriceMinor(product) <= filters.maxPriceMinor!,

        filters.minRating === undefined
          ? undefined
          : product => product.rating.average >= filters.minRating!,

        filters.inStockOnly === true ? isPurchasable : undefined,

        filters.prescriptionRequired === undefined
          ? undefined
          : product =>
              product.isPrescriptionRequired === filters.prescriptionRequired,
      ],
    });

    return withLatency(result, 260);
  }

  async listRelated(productId: string, _options?: RequestOptions) {
    const product = await this.findById(productId);

    // "Related" = same category, excluding itself. Enough to make the
    // cross-sell rail look real without pretending to be a recommender.
    const related = productDataset
      .all()
      .filter(
        candidate =>
          candidate.category === product.category &&
          candidate.id !== product.id,
      )
      .slice(0, RELATED_LIMIT);

    return withLatency(paginateResult(related, 1, RELATED_LIMIT), 180);
  }
}

export const mockProductRepository = new MockProductRepository();
