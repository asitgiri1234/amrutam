/**
 * Icon — a single vector primitive backed by react-native-svg.
 *
 * WHY a path registry instead of an icon font: fonts cannot be tree-shaken,
 * ship every glyph to every user, and render at the mercy of the platform text
 * engine (which breaks alignment). SVG paths are typed (`IconName` is a union,
 * so a typo is a compile error), colourable from the theme, and only the icons
 * we reference end up in the bundle.
 *
 * Paths are 24x24, stroke-based, matching the Feather geometry so new icons
 * can be dropped in without redrawing.
 */

import { memo } from 'react';

import Svg, { Path } from 'react-native-svg';

import { ICON_SIZE } from '@constants/layout.constants';
import { useTheme } from '@theme';

const ICON_PATHS = {
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  close: 'M18 6L6 18M6 6l12 12',
  chevronRight: 'M9 18l6-6-6-6',
  chevronDown: 'M6 9l6 6 6-6',
  check: 'M20 6L9 17l-5-5',
  plus: 'M12 5v14M5 12h14',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  refresh:
    'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  alertCircle: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v4M12 16h.01',
  alertTriangle:
    'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
  inbox:
    'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
  wifiOff:
    'M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  /* ---- Tab bar -------------------------------------------------------- */
  consultation:
    'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
  shop: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
  health: 'M22 12h-4l-3 9L9 3l-3 9H2',
  settings:
    'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
} as const;

export type IconName = keyof typeof ICON_PATHS;

export interface IconProps {
  name: IconName;
  /** Number, or a key from the shared icon size scale. */
  size?: number | keyof typeof ICON_SIZE;
  /** Defaults to the current text colour so icons inherit context. */
  color?: string;
  strokeWidth?: number;
  testID?: string;
}

function resolveSize(size: IconProps['size']): number {
  if (typeof size === 'number') {
    return size;
  }
  return ICON_SIZE[size ?? 'md'];
}

function IconComponent({
  name,
  size = 'md',
  color,
  strokeWidth = 2,
  testID,
}: IconProps) {
  const theme = useTheme();
  const dimension = resolveSize(size);

  return (
    <Svg
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      testID={testID}
      accessibilityRole="image"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d={ICON_PATHS[name]}
        stroke={color ?? theme.colors.text}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Icons re-render on every parent render otherwise, and lists are full of
 *  them — memo is meaningful here, not cargo cult. */
export const Icon = memo(IconComponent);
Icon.displayName = 'Icon';
