/**
 * Shared placeholder for the three product areas that are intentionally not
 * implemented in the foundation milestone.
 *
 * WHY placeholders rather than empty files: navigation has to actually work
 * from day one. A reviewer should be able to install the app, tap through all
 * four tabs, switch to dark mode and see the design system rendering — that is
 * the acceptance criterion for a foundation. Empty screens prove nothing.
 *
 * Each placeholder deliberately exercises a slice of the foundation (Screen,
 * EmptyState, Card, Typography, theming), so a regression in the shared layers
 * is visible immediately rather than at module-integration time.
 */

import { StyleSheet, View } from 'react-native';

import { Screen } from '@components/Screen';
import { Card, EmptyState, Typography, type IconName } from '@design-system';
import { useTheme, type Theme } from '@theme';

export interface ModulePlaceholderProps {
  moduleName: string;
  icon: IconName;
  description: string;
  /** What this area will contain — kept visible so the plan is legible in-app. */
  plannedCapabilities: string[];
  testID?: string;
}

export function ModulePlaceholder({
  moduleName,
  icon,
  description,
  plannedCapabilities,
  testID,
}: ModulePlaceholderProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Screen scrollable testID={testID}>
      <EmptyState
        icon={icon}
        title={`${moduleName} module`}
        description={description}
        fullscreen={false}
      />

      <Card variant="outlined" padding="lg" style={styles.card}>
        <Typography variant="overline" tone="tertiary">
          Planned
        </Typography>

        <View style={styles.list}>
          {plannedCapabilities.map(capability => (
            <View key={capability} style={styles.listItem}>
              <View style={styles.bullet} />
              <Typography
                variant="body"
                tone="secondary"
                style={styles.listText}
              >
                {capability}
              </Typography>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    bullet: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.circle,
      height: 6,
      marginTop: 7,
      width: 6,
    },
    card: {
      marginTop: theme.spacing.lg,
    },
    list: {
      marginTop: theme.spacing.md,
      rowGap: theme.spacing.sm,
    },
    listItem: {
      columnGap: theme.spacing.sm,
      flexDirection: 'row',
    },
    listText: {
      flex: 1,
    },
  });
