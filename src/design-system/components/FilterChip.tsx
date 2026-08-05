/**
 * FilterChip — a toggleable filter token.
 *
 * WHY `selected` is required rather than internal state: filters are almost
 * always driven by a store or URL-ish state that survives navigation. A chip
 * that owns its own selection looks fine in isolation and then desynchronises
 * the moment the user pops back to the screen. Making it controlled forces the
 * correct architecture at every call site.
 *
 * `accessibilityRole="button"` with `checked` state is deliberate: iOS
 * VoiceOver announces "selected" for a checkbox-like control, which is what a
 * filter chip actually is to a user.
 */

import { memo } from 'react';

import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BORDER_WIDTH } from '@constants/layout.constants';
import { useTheme, useThemedStyles, type Theme } from '@theme';

import { Icon, type IconName } from './Icon';
import { Typography } from './Typography';

export interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  /** Trailing count, e.g. "Ayurveda (12)". Kept separate so it can be styled
   *  with lower emphasis than the label. */
  count?: number;
  /** Renders a dismiss affordance instead of a checkmark — for "active
   *  filters" summary rows. */
  dismissible?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function FilterChipComponent({
  label,
  selected,
  onPress,
  icon,
  count,
  dismissible = false,
  disabled = false,
  style,
  testID,
}: FilterChipProps) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);

  const contentColor = disabled
    ? theme.colors.textDisabled
    : selected
    ? theme.colors.primary
    : theme.colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={
        count === undefined ? label : `${label}, ${count} items`
      }
      android_ripple={{ color: theme.colors.ripple, borderless: false }}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? theme.colors.primaryMuted
            : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          opacity: disabled ? theme.opacity.disabled : theme.opacity.full,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {icon === undefined ? null : (
          <Icon name={icon} size="sm" color={contentColor} />
        )}

        <Typography
          variant="label"
          style={{ color: contentColor }}
          numberOfLines={1}
        >
          {label}
        </Typography>

        {count === undefined ? null : (
          <Typography
            variant="caption"
            tone={selected ? 'primary' : 'tertiary'}
          >
            {count}
          </Typography>
        )}

        {selected && dismissible ? (
          <Icon name="close" size="sm" color={contentColor} />
        ) : selected && !dismissible ? (
          <Icon name="check" size="sm" color={contentColor} />
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Memoised: filter rows are rendered as a group, and toggling one chip
 * re-renders the parent. Only the chip whose `selected` actually flipped
 * should re-render.
 */
export const FilterChip = memo(FilterChipComponent);
FilterChip.displayName = 'FilterChip';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    chip: {
      borderRadius: theme.radius.pill,
      borderWidth: BORDER_WIDTH.thin,
      overflow: 'hidden',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    content: {
      alignItems: 'center',
      columnGap: theme.spacing.xs,
      flexDirection: 'row',
    },
  });
