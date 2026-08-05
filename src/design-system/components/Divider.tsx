/**
 * Divider — a themed 1px rule.
 *
 * WHY this trivial thing is a component: `StyleSheet.hairlineWidth` renders as
 * *nothing* on some Android densities, and the correct colour differs per
 * theme. Every codebase that inlines `<View style={{height: 1,
 * backgroundColor: '#eee'}} />` ends up with invisible dividers in dark mode
 * and an inconsistent rule weight across screens.
 */

import { memo, useMemo } from 'react';

import { View, type StyleProp, type ViewStyle } from 'react-native';

import { BORDER_WIDTH } from '@constants/layout.constants';
import { useTheme, type SpacingKey } from '@theme';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  /** `strong` for section breaks, default for list separators. */
  emphasis?: 'default' | 'strong';
  /** Insets the rule from the leading edge — the standard list treatment
   *  where a divider should align with the text, not the avatar. */
  inset?: SpacingKey;
  spacing?: SpacingKey;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function DividerComponent({
  orientation = 'horizontal',
  emphasis = 'default',
  inset = 'none',
  spacing = 'none',
  style,
  testID,
}: DividerProps) {
  const theme = useTheme();

  // Built inline rather than via StyleSheet.create because every value here is
  // prop-dependent — a stylesheet would need a cross product of four props.
  const ruleStyle = useMemo<ViewStyle>(() => {
    const color =
      emphasis === 'strong' ? theme.colors.borderStrong : theme.colors.border;
    const thickness = BORDER_WIDTH.thin;
    const insetValue = theme.spacing[inset];
    const spacingValue = theme.spacing[spacing];

    return orientation === 'horizontal'
      ? {
          backgroundColor: color,
          height: thickness,
          marginLeft: insetValue,
          marginVertical: spacingValue,
          width: 'auto',
        }
      : {
          alignSelf: 'stretch',
          backgroundColor: color,
          marginHorizontal: spacingValue,
          marginTop: insetValue,
          width: thickness,
        };
  }, [emphasis, inset, orientation, spacing, theme]);

  return (
    <View testID={testID} accessibilityRole="none" style={[ruleStyle, style]} />
  );
}

/**
 * Memoised: a divider between every row of a long list is the single most
 * duplicated element in the app, and its props never change once rendered.
 */
export const Divider = memo(DividerComponent);
Divider.displayName = 'Divider';

function ListDividerComponent() {
  return <Divider inset="lg" />;
}

/** Convenience for FlashList/FlatList `ItemSeparatorComponent`. */
export const ListDivider = memo(ListDividerComponent);
ListDivider.displayName = 'ListDivider';
