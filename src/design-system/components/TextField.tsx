/**
 * TextField — labelled text input with validation affordances.
 *
 * WHY it is uncontrolled-friendly and ref-forwarding: React Hook Form drives
 * our forms, and RHF wants to register a ref and push values imperatively. A
 * design-system input that hides its ref forces every form to wrap it in a
 * `Controller`, which re-renders the whole field on every keystroke — very
 * visible on low-end Android during OTP entry.
 *
 * Accessibility details that are easy to miss and are handled here:
 *   - the error message is linked via `accessibilityLabel`, so a screen reader
 *     announces *why* the field is invalid, not just that it is
 *   - `accessibilityState.disabled` mirrors `editable`
 *   - the touch target wraps the label + input, not just the input box
 */

import {
  forwardRef,
  memo,
  useCallback,
  useState,
  type ComponentRef,
} from 'react';

import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { BORDER_WIDTH, MIN_TOUCH_TARGET } from '@constants/layout.constants';
import { useTheme, useThemedStyles, type Theme } from '@theme';

import { Icon, type IconName } from './Icon';
import { Typography } from './Typography';

export interface TextFieldProps
  extends Omit<TextInputProps, 'style' | 'editable'> {
  label?: string;
  /** Renders in danger tone and switches the border colour. */
  error?: string;
  /** Shown when there is no error — hints, formats, character counts. */
  helperText?: string;
  leftIcon?: IconName;
  rightIcon?: IconName;
  onRightIconPress?: () => void;
  required?: boolean;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

type TextInputRef = ComponentRef<typeof TextInput>;

/* Derived from TextInputProps rather than importing the event types directly:
 * React Native renamed these between 0.7x and 0.8x, and deriving keeps this
 * file compiling across upgrades. */
type FocusEventArg = Parameters<NonNullable<TextInputProps['onFocus']>>[0];
type BlurEventArg = Parameters<NonNullable<TextInputProps['onBlur']>>[0];

const TextFieldComponent = forwardRef<TextInputRef, TextFieldProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconPress,
      required = false,
      disabled = false,
      containerStyle,
      onFocus,
      onBlur,
      multiline = false,
      testID,
      ...inputProps
    },
    ref,
  ) => {
    const theme = useTheme();
    const styles = useThemedStyles(createStyles);
    const [focused, setFocused] = useState(false);

    const hasError = typeof error === 'string' && error.length > 0;

    const handleFocus = useCallback(
      (event: FocusEventArg) => {
        setFocused(true);
        onFocus?.(event);
      },
      [onFocus],
    );

    const handleBlur = useCallback(
      (event: BlurEventArg) => {
        setFocused(false);
        onBlur?.(event);
      },
      [onBlur],
    );

    const borderColor = hasError
      ? theme.colors.danger
      : focused
      ? theme.colors.borderFocus
      : theme.colors.border;

    return (
      <View style={[styles.container, containerStyle]} testID={testID}>
        {label === undefined ? null : (
          <View style={styles.labelRow}>
            <Typography
              variant="label"
              tone={disabled ? 'disabled' : 'secondary'}
            >
              {label}
            </Typography>
            {required ? (
              <Typography variant="label" tone="danger">
                {' *'}
              </Typography>
            ) : null}
          </View>
        )}

        <View
          style={[
            styles.field,
            multiline ? styles.fieldMultiline : styles.fieldSingle,
            {
              backgroundColor: disabled
                ? theme.colors.surfaceSunken
                : theme.colors.surface,
              borderColor,
              borderWidth:
                focused || hasError ? BORDER_WIDTH.thick : BORDER_WIDTH.thin,
            },
          ]}
        >
          {leftIcon === undefined ? null : (
            <Icon name={leftIcon} size="md" color={theme.colors.textTertiary} />
          )}

          <TextInput
            ref={ref}
            editable={!disabled}
            multiline={multiline}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={theme.colors.textTertiary}
            selectionColor={theme.colors.primary}
            accessibilityState={{ disabled }}
            accessibilityLabel={
              hasError && label !== undefined
                ? `${label}. Error: ${error}`
                : label
            }
            style={[
              styles.input,
              {
                color: disabled ? theme.colors.textDisabled : theme.colors.text,
              },
            ]}
            {...inputProps}
          />

          {rightIcon === undefined ? null : (
            <Pressable
              onPress={onRightIconPress}
              disabled={onRightIconPress === undefined}
              accessibilityRole="button"
              hitSlop={theme.spacing.sm}
            >
              <Icon
                name={rightIcon}
                size="md"
                color={theme.colors.textTertiary}
              />
            </Pressable>
          )}
        </View>

        {hasError ? (
          <Typography variant="caption" tone="danger" style={styles.message}>
            {error}
          </Typography>
        ) : helperText === undefined ? null : (
          <Typography variant="caption" tone="tertiary" style={styles.message}>
            {helperText}
          </Typography>
        )}
      </View>
    );
  },
);

TextFieldComponent.displayName = 'TextField';

/**
 * `memo(forwardRef(...))` — the order matters. Wrapping the other way round
 * loses the ref, which would break React Hook Form's `register`.
 *
 * Worth memoising because a form re-renders on every keystroke in any field;
 * without this, typing in one input re-renders all of them.
 */
export const TextField = memo(TextFieldComponent);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    field: {
      alignItems: 'center',
      borderRadius: theme.radius.md,
      columnGap: theme.spacing.sm,
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.md,
    },
    fieldMultiline: {
      alignItems: 'flex-start',
      minHeight: 96,
      paddingVertical: theme.spacing.md,
    },
    fieldSingle: {
      minHeight: MIN_TOUCH_TARGET,
    },
    input: {
      ...theme.typography.variants.bodyLarge,
      flex: 1,
      paddingVertical: theme.spacing.sm,
    },
    labelRow: {
      flexDirection: 'row',
      marginBottom: theme.spacing.xs,
    },
    message: {
      marginTop: theme.spacing.xs,
    },
  });
