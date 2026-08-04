/**
 * WHY `hooks/` exists:
 *
 * Reusable *stateful* logic that is not tied to one feature. The dividing line
 * against `utils/`: utils are pure functions, hooks touch React's lifecycle.
 *
 * Feature-specific hooks (`useDoctorList`, `useCart`) do NOT belong here —
 * they live in their module, next to the repository and screens they serve.
 * A global hooks folder that accumulates feature logic becomes a second,
 * competing place to look for a module's behaviour.
 */

export { useAppState, useOnForeground } from './useAppState';
export { useConnectivity, useIsOnline } from './useConnectivity';
export { useDebouncedValue } from './useDebouncedValue';
export { useToast } from './useToast';

/** Re-exported from `theme/` so screens have one import site for hooks. */
export { useTheme, useThemePreference, useThemedStyles } from '@theme/useTheme';
