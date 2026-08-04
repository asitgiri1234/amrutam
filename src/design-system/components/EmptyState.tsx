/**
 * EmptyState — "there is nothing here, and that is fine".
 *
 * WHY it is a first-class primitive: empty is a *normal* state, not an edge
 * case. An empty cart, a first-time user with no health records, a filter that
 * matched nothing — each of those is a moment where the product either guides
 * the user or looks broken. Standardising it means every list gets the same
 * quality of treatment without anyone remembering to design it.
 *
 * Note this is distinct from ErrorState: empty means the request *succeeded*
 * and returned nothing. Conflating the two produces "Something went wrong"
 * messages for users who simply have no orders yet.
 */

import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type Theme } from '@theme';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Typography } from './Typography';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  /** Primary call to action, e.g. "Browse doctors". */
  actionLabel?: string;
  onAction?: () => void;
  /** Low-emphasis secondary action, e.g. "Clear filters". */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** Fills the screen and centres. Off for inline/section empties. */
  fullscreen?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EmptyState({
  title,
  description,
  icon = 'inbox',
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  fullscreen = true,
  style,
  testID = 'empty-state',
}: EmptyStateProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={
        description === undefined ? title : `${title}. ${description}`
      }
      style={[styles.container, fullscreen ? styles.fullscreen : null, style]}
    >
      <View style={styles.iconWell}>
        <Icon name={icon} size={32} color={theme.colors.textTertiary} />
      </View>

      <Typography variant="h4" align="center" style={styles.title}>
        {title}
      </Typography>

      {description === undefined ? null : (
        <Typography variant="body" tone="secondary" align="center">
          {description}
        </Typography>
      )}

      {actionLabel !== undefined && onAction !== undefined ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.action}
        />
      ) : null}

      {secondaryActionLabel !== undefined && onSecondaryAction !== undefined ? (
        <Button
          label={secondaryActionLabel}
          onPress={onSecondaryAction}
          variant="ghost"
          size="sm"
        />
      ) : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    action: {
      marginTop: theme.spacing.sm,
    },
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xxl,
      paddingVertical: theme.spacing.xxxl,
      rowGap: theme.spacing.sm,
    },
    fullscreen: {
      flex: 1,
    },
    iconWell: {
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceSunken,
      borderRadius: theme.radius.circle,
      height: 72,
      justifyContent: 'center',
      marginBottom: theme.spacing.sm,
      width: 72,
    },
    title: {
      marginTop: theme.spacing.xs,
    },
  });
