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

export function buildList<T>(
  factory: MockFactory<T>,
  count: number,
  { seed = DEFAULT_SEED, startIndex = 0 }: BuildOptions = {},
): T[] {
  const random = createRandom(seed);
  const items: T[] = [];

  for (let i = 0; i < count; i += 1) {
    items.push(factory(startIndex + i, random));
  }

  return items;
}

export function* buildLazy<T>(
  factory: MockFactory<T>,
  count: number,
  { seed = DEFAULT_SEED, startIndex = 0 }: BuildOptions = {},
): Generator<T> {
  const random = createRandom(seed);

  for (let i = 0; i < count; i += 1) {
    yield factory(startIndex + i, random);
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
