/**
 * Modal — themed sheet / dialog.
 *
 * WHY we wrap RN's Modal rather than using it directly:
 *   - RN's Modal has no theme, no safe-area handling and no scrim styling, so
 *     every raw usage reinvents all three (usually with a hard-coded colour).
 *   - Android's hardware back button must dismiss; forgetting `onRequestClose`
 *     is a Play Store review finding, not just a bug.
 *   - `presentation="sheet"` vs `"dialog"` is the only choice a caller should
 *     have to make; everything else follows from it.
 *
 * Scrim taps close by default because that is what users expect, but
 * `dismissible={false}` exists for destructive confirmations where an
 * accidental tap must not cancel the flow.
 */

import type { ReactNode } from 'react';

import {
  Modal as RNModal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@theme';

import { Divider } from './Divider';
import { Icon } from './Icon';
import { Typography } from './Typography';

export type ModalPresentation = 'sheet' | 'dialog';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  presentation?: ModalPresentation;
  /** When false, neither the scrim nor the close button dismisses. */
  dismissible?: boolean;
  /** Hides the header row entirely for fully custom content. */
  showHeader?: boolean;
  /** Pinned to the bottom, outside the scrollable body. */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Modal({
  visible,
  onClose,
  children,
  title,
  presentation = 'sheet',
  dismissible = true,
  showHeader = true,
  footer,
  contentStyle,
  testID = 'modal',
}: ModalProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();

  const handleScrimPress = dismissible ? onClose : undefined;
  const isSheet = presentation === 'sheet';

  return (
    <RNModal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType={isSheet ? 'slide' : 'fade'}
      // Android hardware back. Non-negotiable.
      onRequestClose={dismissible ? onClose : undefined}
      testID={testID}
    >
      <View
        style={[styles.root, isSheet ? styles.rootSheet : styles.rootDialog]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          accessible={dismissible}
          onPress={handleScrimPress}
          style={styles.scrim}
          testID="modal-scrim"
        />

        <View
          accessibilityViewIsModal
          style={[
            styles.surface,
            isSheet
              ? {
                  borderTopLeftRadius: theme.radius.xxl,
                  borderTopRightRadius: theme.radius.xxl,
                  paddingBottom: insets.bottom + theme.spacing.lg,
                }
              : {
                  borderRadius: theme.radius.xl,
                  marginHorizontal: theme.spacing.xxl,
                },
            theme.elevation.xl,
            contentStyle,
          ]}
        >
          {isSheet ? <View style={styles.grabber} /> : null}

          {showHeader ? (
            <>
              <View style={styles.header}>
                <Typography
                  variant="h4"
                  numberOfLines={1}
                  style={styles.headerTitle}
                >
                  {title ?? ''}
                </Typography>

                {dismissible ? (
                  <Pressable
                    onPress={onClose}
                    hitSlop={theme.spacing.md}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    testID="modal-close"
                  >
                    <Icon
                      name="close"
                      size="lg"
                      color={theme.colors.textSecondary}
                    />
                  </Pressable>
                ) : null}
              </View>
              <Divider />
            </>
          ) : null}

          <View style={styles.body}>{children}</View>

          {footer === undefined ? null : (
            <>
              <Divider />
              <View style={styles.footer}>{footer}</View>
            </>
          )}
        </View>
      </View>
    </RNModal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    body: {
      padding: theme.spacing.lg,
    },
    footer: {
      padding: theme.spacing.lg,
    },
    grabber: {
      alignSelf: 'center',
      backgroundColor: theme.colors.borderStrong,
      borderRadius: theme.radius.pill,
      height: 4,
      marginTop: theme.spacing.sm,
      width: 36,
    },
    header: {
      alignItems: 'center',
      columnGap: theme.spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
    },
    headerTitle: {
      flex: 1,
    },
    root: {
      flex: 1,
    },
    rootDialog: {
      justifyContent: 'center',
    },
    rootSheet: {
      justifyContent: 'flex-end',
    },
    scrim: {
      backgroundColor: theme.colors.scrim,
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    surface: {
      backgroundColor: theme.colors.surfaceElevated,
      maxHeight: '90%',
      overflow: 'hidden',
    },
  });
