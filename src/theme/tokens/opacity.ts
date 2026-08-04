/**
 * OPACITY TOKENS.
 *
 * WHY: "disabled" and "pressed" are product-wide states, not per-component
 * opinions. Centralising them keeps every touchable in the app feeling the
 * same, and makes an accessibility tweak (e.g. raising disabled contrast) a
 * single edit.
 */

export const opacity = {
  none: 0,
  disabled: 0.4,
  pressed: 0.7,
  muted: 0.6,
  overlay: 0.5,
  full: 1,
} as const;

export type Opacity = typeof opacity;
