/**
 * Debounce: run `fn` only after `waitMs` of quiet.
 *
 * WHY hand-rolled instead of lodash: we need `cancel` and `flush` (a screen
 * unmounting mid-debounce must not fire a search request into a dead
 * component), and pulling lodash into a mobile bundle for one function is a
 * poor trade.
 *
 * Typical use: search-as-you-type, where every keystroke would otherwise be a
 * network request.
 */

export interface Debounced<TArgs extends unknown[]> {
  (...args: TArgs): void;
  /** Drop the pending call. Always do this on unmount. */
  cancel(): void;
  /** Run the pending call immediately, if any. */
  flush(): void;
  pending(): boolean;
}

export interface DebounceOptions {
  /** Fire on the first call as well as after the quiet period. */
  leading?: boolean;
  /** Fire after the quiet period. Defaults to true. */
  trailing?: boolean;
}

export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  waitMs: number,
  options: DebounceOptions = {},
): Debounced<TArgs> {
  const { leading = false, trailing = true } = options;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: TArgs | null = null;

  const invoke = (): void => {
    if (lastArgs === null) {
      return;
    }
    const args = lastArgs;
    lastArgs = null;
    fn(...args);
  };

  const debounced = ((...args: TArgs): void => {
    const isFirstInWindow = timer === null;
    lastArgs = args;

    if (timer !== null) {
      clearTimeout(timer);
    }

    if (leading && isFirstInWindow) {
      lastArgs = null;
      fn(...args);
    }

    timer = setTimeout(() => {
      timer = null;
      if (trailing) {
        invoke();
      }
    }, waitMs);
  }) as Debounced<TArgs>;

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    invoke();
  };

  debounced.pending = () => timer !== null;

  return debounced;
}
