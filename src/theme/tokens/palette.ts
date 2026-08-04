/**
 * RAW PALETTE — the only file in the codebase allowed to contain hex values
 * besides the two theme definitions that consume it.
 *
 * WHY a separate palette layer: raw colors are *not* meaningful on their own.
 * `green500` tells you nothing about where it may be used. The themes in
 * `theme/themes/` map these into semantic roles (`primary`, `danger`,
 * `textSecondary`) and screens only ever consume the semantic layer. That
 * indirection is what makes a rebrand a one-file change instead of a
 * codebase-wide find-and-replace.
 *
 * Hue choices are drawn from the Ayurvedic visual language:
 *   tulsi  — the brand green (holy basil)
 *   haldi  — the accent gold (turmeric)
 *   clay   — warm-tinted neutrals rather than pure grey
 */

export const palette = {
  /* ---- Tulsi (brand green) ------------------------------------------- */
  tulsi50: '#EEF6EF',
  tulsi100: '#D6EAD9',
  tulsi200: '#ADD5B4',
  tulsi300: '#7FBB8B',
  tulsi400: '#559F66',
  tulsi500: '#2F7D45',
  tulsi600: '#266739',
  tulsi700: '#1E522D',
  tulsi800: '#163D22',
  tulsi900: '#0F2916',

  /* ---- Haldi (accent gold) ------------------------------------------- */
  haldi50: '#FEF6E7',
  haldi100: '#FCE8BF',
  haldi200: '#F8D07F',
  haldi300: '#F3B845',
  haldi400: '#E9A21C',
  haldi500: '#C98510',
  haldi600: '#A16A0C',
  haldi700: '#7A5009',
  haldi800: '#543705',
  haldi900: '#2E1E03',

  /* ---- Clay (warm neutrals) ------------------------------------------ */
  clay0: '#FFFFFF',
  clay25: '#FBFBFA',
  clay50: '#F6F6F4',
  clay100: '#EDEDE9',
  clay200: '#DEDEDA',
  clay300: '#C6C6C0',
  clay400: '#A3A39C',
  clay500: '#7C7C75',
  clay600: '#5C5C56',
  clay700: '#444440',
  clay800: '#2C2C29',
  clay850: '#232320',
  clay900: '#1A1A18',
  clay950: '#121211',
  clay1000: '#000000',

  /* ---- Status hues ---------------------------------------------------- */
  red50: '#FDECEC',
  red100: '#FAD1D1',
  red400: '#E05252',
  red500: '#C93B3B',
  red600: '#A62F2F',
  red900: '#3D1414',

  amber50: '#FFF6E5',
  amber100: '#FDE7BC',
  amber400: '#E39A19',
  amber500: '#B87A0A',
  amber900: '#3A2604',

  blue50: '#E9F1FB',
  blue100: '#C9DDF6',
  blue400: '#4A86D8',
  blue500: '#2E6BC0',
  blue900: '#10233F',

  /* ---- Alpha values ---------------------------------------------------
   * Kept here so no component ever hand-rolls an rgba() string. */
  transparent: 'transparent',
  blackA08: 'rgba(0, 0, 0, 0.08)',
  blackA16: 'rgba(0, 0, 0, 0.16)',
  blackA40: 'rgba(0, 0, 0, 0.40)',
  blackA60: 'rgba(0, 0, 0, 0.60)',
  blackA72: 'rgba(0, 0, 0, 0.72)',
  whiteA08: 'rgba(255, 255, 255, 0.08)',
  whiteA12: 'rgba(255, 255, 255, 0.12)',
  whiteA16: 'rgba(255, 255, 255, 0.16)',
  whiteA60: 'rgba(255, 255, 255, 0.60)',
} as const;

export type Palette = typeof palette;
export type PaletteKey = keyof Palette;
