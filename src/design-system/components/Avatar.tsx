/**
 * Avatar — user/doctor/product imagery with a guaranteed fallback.
 *
 * WHY the fallback chain matters: doctor photos come from a CMS and *will* be
 * missing or 404 for some records. Without a deterministic fallback, a
 * consultation list renders as a row of grey squares. The chain here is
 * image -> initials -> generic icon, and the initials background is derived
 * from the name so the same person always gets the same colour — recognisable
 * at a glance, and stable across sessions without storing anything.
 */

import { memo, useState } from 'react';

import {
  Image,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AVATAR_SIZE, BORDER_WIDTH } from '@constants/layout.constants';
import { useTheme, useThemedStyles, type Theme } from '@theme';
import { initials as toInitials } from '@utils/formatter';

import { Icon } from './Icon';
import { Typography } from './Typography';

export type AvatarSize = keyof typeof AVATAR_SIZE;

export interface AvatarProps {
  /** Remote or local image URI. */
  uri?: string | null;
  /** Used for the initials fallback and the accessibility label. */
  name?: string;
  size?: AvatarSize | number;
  shape?: 'circle' | 'rounded';
  /** Small dot for online/available state — used by the doctor list. */
  status?: 'online' | 'offline' | 'busy';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Deterministic tint per name. Six buckets is enough to feel varied without
 *  needing a colour for every possible user. */
const TINT_KEYS = [
  'primaryMuted',
  'secondaryMuted',
  'infoMuted',
  'successMuted',
  'warningMuted',
  'surfaceSunken',
] as const;

function hashToIndex(value: string, buckets: number): number {
  // Classic djb2-style rolling hash. The modulo keeps it inside safe-integer
  // range without needing bitwise truncation.
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2_147_483_647;
  }
  return hash % buckets;
}

function resolveSize(size: AvatarProps['size']): number {
  if (typeof size === 'number') {
    return size;
  }
  return AVATAR_SIZE[size ?? 'md'];
}

function AvatarComponent({
  uri,
  name,
  size = 'md',
  shape = 'circle',
  status,
  style,
  testID,
}: AvatarProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const [failed, setFailed] = useState(false);

  const dimension = resolveSize(size);
  const radius = shape === 'circle' ? dimension / 2 : theme.radius.md;
  const showImage = typeof uri === 'string' && uri.length > 0 && !failed;
  const label = name === undefined ? '' : toInitials(name);

  const tintKey =
    TINT_KEYS[hashToIndex(name ?? '', TINT_KEYS.length)] ?? 'surfaceSunken';

  const statusColor =
    status === 'online'
      ? theme.colors.success
      : status === 'busy'
      ? theme.colors.warning
      : theme.colors.borderStrong;

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name === undefined ? 'Avatar' : `${name} avatar`}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors[tintKey],
          borderRadius: radius,
          height: dimension,
          width: dimension,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          onError={() => setFailed(true)}
          resizeMode="cover"
          style={{ borderRadius: radius, height: dimension, width: dimension }}
        />
      ) : label.length > 0 ? (
        <Typography
          variant={dimension >= AVATAR_SIZE.lg ? 'h3' : 'label'}
          tone="secondary"
        >
          {label}
        </Typography>
      ) : (
        <Icon
          name="user"
          size={Math.round(dimension * 0.5)}
          color={theme.colors.textTertiary}
        />
      )}

      {status === undefined ? null : (
        <View
          testID="avatar-status"
          style={[
            styles.status,
            {
              backgroundColor: statusColor,
              borderColor: theme.colors.surface,
              borderRadius: theme.radius.circle,
              height: Math.max(8, dimension * 0.25),
              width: Math.max(8, dimension * 0.25),
            },
          ]}
        />
      )}
    </View>
  );
}

/**
 * Memoised: avatars appear once per row in every list in the app, and the
 * image-failure state lives in local state — a parent re-render must not
 * discard it and retry a 404 on every scroll frame.
 */
export const Avatar = memo(AvatarComponent);
Avatar.displayName = 'Avatar';

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    },
    status: {
      borderWidth: BORDER_WIDTH.thick,
      bottom: 0,
      position: 'absolute',
      right: 0,
    },
  });
