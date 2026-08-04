/**
 * MOTION TOKENS.
 *
 * WHY here and not inside individual components: consistent timing is what
 * makes an app feel like one product. Reanimated worklets read these values, so
 * they are plain numbers/objects with no closures — anything else would fail to
 * serialise onto the UI thread.
 */

export const duration = {
  instant: 0,
  fast: 120,
  normal: 200,
  slow: 320,
  slower: 480,
  /** Skeleton shimmer / indeterminate loops. */
  loop: 1200,
} as const;

/**
 * Cubic-bezier control points, ready to hand to Reanimated's `Easing.bezier`.
 * Stored as tuples rather than Easing functions so they stay worklet-safe.
 */
export const easing = {
  standard: [0.2, 0, 0, 1],
  decelerate: [0, 0, 0.2, 1],
  accelerate: [0.4, 0, 1, 1],
  emphasized: [0.2, 0, 0, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const spring = {
  /** Default for anything the user directly manipulates. */
  responsive: { damping: 18, stiffness: 220, mass: 1 },
  /** Softer, for entrance animations. */
  gentle: { damping: 22, stiffness: 140, mass: 1 },
} as const;

export const motion = { duration, easing, spring } as const;

export type Motion = typeof motion;
