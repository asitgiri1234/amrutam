/**
 * Skeleton — content-shaped loading placeholder.
 *
 * WHY skeletons and not spinners for list/detail loads: a spinner tells the
 * user "something is happening"; a skeleton tells them "*this* is coming, and
 * here is its shape". The perceived wait is measurably shorter and the layout
 * does not jump when data arrives — which matters most on the catalogue and
 * doctor-list screens where we render dozens of rows.
 *
 * The shimmer runs entirely on the UI thread via Reanimated. That is the whole
 * point: a skeleton is on screen precisely when the JS thread is busy, so a
 * JS-driven animation would freeze exactly when it needs to be smooth.
 */

import { useEffect } from 'react';

import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme, type RadiusKey, type Theme } from '@theme';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: RadiusKey;
  /** Disable the shimmer — respects "reduce motion" at the call site, and
   *  avoids N concurrent animations in very long lists. */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 'sm',
  animated = true,
  style,
  testID = 'skeleton',
}: SkeletonProps) {
  const theme = useTheme();
  const progress = useSharedValue(0);
  const loopDuration = theme.motion.duration.loop;

  useEffect(() => {
    if (!animated) {
      return;
    }
    progress.value = withRepeat(
      withTiming(1, {
        duration: loopDuration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [animated, loopDuration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [1, 0.45]),
  }));

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
      style={[
        {
          backgroundColor: theme.colors.skeletonBase,
          borderRadius: theme.radius[radius],
          height,
          width,
        },
        animated ? animatedStyle : undefined,
        style,
      ]}
    />
  );
}

/**
 * A ready-made row placeholder: avatar + two lines. Covers the shape of the
 * doctor list, order list and health-record list, which is most of the app.
 */
export function SkeletonListItem({ testID }: { testID?: string }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.row} testID={testID}>
      <Skeleton width={40} height={40} radius="circle" />
      <View style={styles.rowContent}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="85%" height={12} />
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      alignItems: 'center',
      columnGap: theme.spacing.md,
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    rowContent: {
      flex: 1,
      rowGap: theme.spacing.sm,
    },
  });
