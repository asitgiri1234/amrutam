/**
 * Settings tab — the one screen with real behaviour in the foundation.
 *
 * WHY it is not a placeholder: theme switching is foundation functionality,
 * not a product feature, and it needs somewhere to be exercised. It doubles as
 * a live smoke test — if the theme, storage, toast, design system or
 * connectivity layers regress, it shows here first.
 */

import { StyleSheet, View } from 'react-native';

import { Screen } from '@components/Screen';
import { APP_ENV, config } from '@config';
import { APP_NAME } from '@constants/app.constants';
import { Card, Divider, FilterChip, Typography } from '@design-system';
import { useIsOnline } from '@hooks/useConnectivity';
import { useToast } from '@hooks/useToast';
import {
  useTheme,
  useThemePreference,
  type Theme,
  type ThemePreference,
} from '@theme';

const PREFERENCES: Array<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export function SettingsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { preference, setPreference } = useThemePreference();
  const isOnline = useIsOnline();
  const toast = useToast();

  const handlePreferenceChange = (next: ThemePreference) => {
    setPreference(next);
    toast.success(`Appearance set to ${next}`);
  };

  return (
    <Screen scrollable testID="settings-screen">
      <Card variant="outlined" padding="lg">
        <Typography variant="overline" tone="tertiary">
          Appearance
        </Typography>

        <Typography variant="bodySmall" tone="secondary" style={styles.hint}>
          Choose a theme, or follow your device setting.
        </Typography>

        <View style={styles.chips}>
          {PREFERENCES.map(option => (
            <FilterChip
              key={option.value}
              label={option.label}
              selected={preference === option.value}
              onPress={() => handlePreferenceChange(option.value)}
              testID={`theme-${option.value}`}
            />
          ))}
        </View>
      </Card>

      <Card variant="outlined" padding="lg" style={styles.card}>
        <Typography variant="overline" tone="tertiary">
          Diagnostics
        </Typography>

        <View style={styles.rows}>
          <Row label="Application" value={APP_NAME} />
          <Divider />
          <Row label="Environment" value={APP_ENV} />
          <Divider />
          <Row label="API" value={config.apiBaseUrl} />
          <Divider />
          <Row label="Resolved theme" value={theme.mode} />
          <Divider />
          <Row label="Connectivity" value={isOnline ? 'Online' : 'Offline'} />
          <Divider />
          <Row
            label="Offline cache"
            value={config.enableOfflineCache ? 'Enabled' : 'Disabled'}
          />
        </View>
      </Card>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.row}>
      <Typography variant="body" tone="secondary">
        {label}
      </Typography>
      <Typography variant="body" numberOfLines={1} style={styles.rowValue}>
        {value}
      </Typography>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      marginTop: theme.spacing.lg,
    },
    chips: {
      columnGap: theme.spacing.sm,
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.md,
      rowGap: theme.spacing.sm,
    },
    hint: {
      marginTop: theme.spacing.xs,
    },
    row: {
      alignItems: 'center',
      columnGap: theme.spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.md,
    },
    rowValue: {
      flexShrink: 1,
      textAlign: 'right',
    },
    rows: {
      marginTop: theme.spacing.sm,
    },
  });
