/**
 * Debounce a *value* rather than a callback.
 *
 * WHY both this and `utils/debounce` exist: they solve different problems.
 * The util debounces an action ("send this request"). This hook debounces a
 * value you want to *derive from* ("compute the filtered list only after they
 * stop typing"). Using the callback version for the latter forces awkward
 * state juggling in the component.
 */

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [delayMs, value]);

  return debounced;
}
