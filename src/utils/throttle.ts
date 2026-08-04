/**
 * Throttle: run `fn` at most once per `intervalMs`.
 *
 * WHY it is distinct from debounce (they are constantly confused):
 *   - debounce  -> "tell me when they stop typing"
 *   - throttle  -> "tell me at most 10x per second while they scroll"
 *
 * Scroll and gesture handlers want throttle; a debounced scroll handler feels
 * broken because nothing happens until the finger stops.
 */

export interface Throttled<TArgs extends unknown[]> {
  (...args: TArgs): void;
  cancel(): void;
  flush(): void;
}

export interface ThrottleOptions {
  /** Fire immediately on the first call. Defaults to true. */
  leading?: boolean;
  /** Fire once more at the end of the window if calls were dropped. */
  trailing?: boolean;
}

export function throttle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  intervalMs: number,
  options: ThrottleOptions = {},
): Throttled<TArgs> {
  const { leading = true, trailing = true } = options;

  let lastInvokedAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: TArgs | null = null;

  const invoke = (args: TArgs): void => {
    lastInvokedAt = Date.now();
    pendingArgs = null;
    fn(...args);
  };

  const throttled = ((...args: TArgs): void => {
    const now = Date.now();

    // `lastInvokedAt === 0` with leading disabled starts the window now rather
    // than treating "never invoked" as "invoked at the epoch".
    if (lastInvokedAt === 0 && !leading) {
      lastInvokedAt = now;
    }

    const remaining = intervalMs - (now - lastInvokedAt);

    if (remaining <= 0) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      invoke(args);
      return;
    }

    pendingArgs = args;

    if (trailing && timer === null) {
      timer = setTimeout(() => {
        timer = null;
        if (pendingArgs !== null) {
          invoke(pendingArgs);
        }
      }, remaining);
    }
  }) as Throttled<TArgs>;

  throttled.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    pendingArgs = null;
    lastInvokedAt = 0;
  };

  throttled.flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (pendingArgs !== null) {
      invoke(pendingArgs);
    }
  };

  return throttled;
}
