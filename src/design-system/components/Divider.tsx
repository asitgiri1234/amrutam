/**
 * Divider — a themed 1px rule.
 *
 * WHY this trivial thing is a component: `StyleSheet.hairlineWidth` renders as
 * *nothing* on some Android densities, and the correct colour differs per
 * theme. Every codebase that inlines `<View style={{height: 1,
 * backgroundColor: '#eee'}} />` ends up with invisible dividers in dark mode
 * and an inconsistent rule weight across screens.
 */

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

export function Divider({
  orientation = 'horizontal',
  emphasis = 'default',
  inset = 'none',
  spacing = 'none',
  style,
  testID,
}: DividerProps) {
  const theme = useTheme();

  const color =
    emphasis === 'strong' ? theme.colors.borderStrong : theme.colors.border;
  const thickness = BORDER_WIDTH.thin;
  const insetValue = theme.spacing[inset];
  const spacingValue = theme.spacing[spacing];

  return (
    <View
      testID={testID}
      accessibilityRole="none"
      style={[
        orientation === 'horizontal'
          ? {
              height: thickness,
              marginLeft: insetValue,
              marginVertical: spacingValue,
              width: 'auto',
            }
          : {
              alignSelf: 'stretch',
              marginHorizontal: spacingValue,
              marginTop: insetValue,
              width: thickness,
            },
        { backgroundColor: color },
        style,
      ]}
    />
  );
}

/** Convenience for FlashList/FlatList `ItemSeparatorComponent`. */
export function ListDivider() {
  return <Divider inset="lg" />;
}
