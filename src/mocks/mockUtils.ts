/* eslint-disable no-bitwise -- the PRNG below is bit arithmetic by definition;
 * rewriting Mulberry32 without bitwise operators would make it both slower and
 * unrecognisable against the reference implementation. */
/**
 * Deterministic mock-data primitives.
 *
 * WHY seeded randomness is non-negotiable: mock data that changes every run
 * makes screenshot tests useless, makes "it looked fine yesterday" impossible
 * to verify, and makes performance benchmarks incomparable. Every helper here
 * takes an explicit seed so the same seed always produces the same 10,000
 * doctors.
 *
 * WHY we generate rather than fixture: the app must be provably smooth with
 * 10k-row lists (FlashList recycling, image loading, filter performance). You
 * cannot hand-write a fixture that large, and a small fixture hides exactly
 * the problems large lists cause.
 */

/**
 * Mulberry32 — small, fast, and good enough statistically for UI fixtures.
 * Chosen over `Math.random` because it is seedable, and over a crypto PRNG
 * because we explicitly want reproducibility, not unpredictability.
 */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Random = () => number;

/**
 * Mixes a base seed with an item index into a well-distributed seed.
 *
 * WHY this exists, and why it is the most important function in this file:
 * every item gets its OWN random stream derived from `(seed, index)` rather
 * than sharing one sequential stream across the whole dataset. Three
 * properties fall out, and we need all three:
 *
 *   1. **Random access.** Item 4,321 can be generated without generating the
 *      4,320 before it, so `findById` is O(1) and never materialises an array.
 *      With a shared stream, item N's value depends on every draw before it.
 *   2. **Stable identity.** Doctor 42 is the same doctor whether you asked for
 *      one doctor or for five thousand. A shared stream makes that false, which
 *      quietly breaks any test that generates a subset.
 *   3. **Order independence.** Pages can be generated out of order, or in
 *      parallel, and still agree.
 *
 * The mixing is a splitmix32 finalizer. Adjacent seeds (`n`, `n+1`) must not
 * produce correlated streams — the avalanche here is what guarantees doctor 41
 * and doctor 42 do not end up near-identical.
 */
export function deriveSeed(seed: number, index: number): number {
  let z = (seed + Math.imul(index, 0x9e3779b9)) >>> 0;
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
  return (z ^ (z >>> 15)) >>> 0;
}

export function randomInt(random: Random, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function randomFloat(
  random: Random,
  min: number,
  max: number,
  decimals = 2,
): number {
  const value = random() * (max - min) + min;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function randomBoolean(random: Random, trueProbability = 0.5): boolean {
  return random() < trueProbability;
}

/** Picks one item. Returns `undefined` only for an empty array. */
export function pickOne<T>(random: Random, items: readonly T[]): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  return items[randomInt(random, 0, items.length - 1)];
}

/** Picks `count` distinct items (or all of them, whichever is smaller). */
export function pickMany<T>(
  random: Random,
  items: readonly T[],
  count: number,
): T[] {
  const pool = [...items];
  const result: T[] = [];
  const target = Math.min(count, pool.length);

  for (let i = 0; i < target; i += 1) {
    const index = randomInt(random, 0, pool.length - 1);
    const [picked] = pool.splice(index, 1);
    if (picked !== undefined) {
      result.push(picked);
    }
  }

  return result;
}

/** Stable, readable id: `doctor-00042`. Sortable and greppable in logs. */
export function sequentialId(prefix: string, index: number, width = 5): string {
  return `${prefix}-${String(index).padStart(width, '0')}`;
}

/**
 * The inverse of `sequentialId`. Returns `null` for anything that is not a
 * well-formed id with the expected prefix.
 *
 * This is what makes a mock `findById` O(1): the id *encodes* the index, so we
 * recover the index, re-derive that item's seed and generate exactly one
 * entity — no dataset materialisation, no scan.
 */
export function parseSequentialId(prefix: string, id: string): number | null {
  if (!id.startsWith(`${prefix}-`)) {
    return null;
  }

  const raw = id.slice(prefix.length + 1);
  if (!/^\d+$/.test(raw)) {
    return null;
  }

  const index = Number.parseInt(raw, 10);
  return Number.isSafeInteger(index) ? index : null;
}

export function randomDateBetween(
  random: Random,
  startMs: number,
  endMs: number,
): string {
  return new Date(randomInt(random, startMs, endMs)).toISOString();
}

/**
 * The core builder. A factory describes ONE item as a function of its index
 * and a seeded RNG; this turns it into as many as you need.
 *
 * Generating lazily via a generator (`buildLazy`) matters for the 10k case —
 * materialising a large array in one tick blocks the JS thread long enough to
 * drop frames, which would make the very benchmark it exists for misleading.
 */
export type MockFactory<T> = (index: number, random: Random) => T;

export interface BuildOptions {
  /** Same seed -> same data. Defaults to a fixed value for reproducibility. */
  seed?: number;
  /** Ids start here — useful for building disjoint pages. */
  startIndex?: number;
}

export const DEFAULT_SEED = 20260804;

/**
 * The fixed "now" every factory dates its fixtures against.
 *
 * WHY NOT `Date.now()`: it would make the data non-deterministic, which is the
 * one property this whole layer promises. Two generations a millisecond apart
 * would produce different timestamps, breaking snapshot tests and making
 * "same seed → same data" false. That is not hypothetical — the first version
 * of these factories used `Date.now()` and the determinism test caught it.
 *
 * The trade-off is that fixtures age: relative dates drift further into the
 * past as real time moves on. That is the correct trade — reproducibility
 * matters more than freshness for fixtures, and this constant can be bumped
 * deliberately when the dataset starts looking stale.
 */
export const FIXTURE_NOW_MS = Date.UTC(2026, 7, 5, 9, 0, 0);

/**
 * Generates exactly ONE item. The building block for everything else, and the
 * reason `findById` costs nothing — see `deriveSeed`.
 */
export function buildOne<T>(
  factory: MockFactory<T>,
  index: number,
  seed: number = DEFAULT_SEED,
): T {
  return factory(index, createRandom(deriveSeed(seed, index)));
}

export function buildList<T>(
  factory: MockFactory<T>,
  count: number,
  { seed = DEFAULT_SEED, startIndex = 0 }: BuildOptions = {},
): T[] {
  const items: T[] = new Array<T>(count);

  for (let i = 0; i < count; i += 1) {
    items[i] = buildOne(factory, startIndex + i, seed);
  }

  return items;
}

/**
 * Generator form. Use this above ~1,000 items when you intend to consume them
 * incrementally — materialising 20,000 products in one tick blocks the JS
 * thread long enough to drop frames, which would make the very benchmark this
 * data exists for misleading.
 */
export function* buildLazy<T>(
  factory: MockFactory<T>,
  count: number,
  { seed = DEFAULT_SEED, startIndex = 0 }: BuildOptions = {},
): Generator<T> {
  for (let i = 0; i < count; i += 1) {
    yield buildOne(factory, startIndex + i, seed);
  }
}

/** Slices a generated collection into an API-shaped page. */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
} {
  const start = (Math.max(1, page) - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

/** Simulates network latency so mock-backed screens still show real loading
 *  states — otherwise every skeleton is dead code until the API is live. */
export function withLatency<T>(value: T, ms = 400): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), ms);
  });
}
