/**
 * Settings tab — the one screen with real behaviour in the foundation.
 *
 * WHY it is not a placeholder: theme switching is foundation functionality,
 * not a product feature, and it needs somewhere to be exercised. It doubles as
 * a live smoke test — if the theme, storage, toast, design system or
 * connectivity layers regress, it shows here first.
 */

import { StyleSheet, View } from 'react-native';

import { APP_ENV, config } from '@config';
import { APP_NAME } from '@constants/app.constants';
import {
  Card,
  Divider,
  FilterChip,
  Icon,
  Screen,
  Typography,
} from '@design-system';
import { useIsOnline } from '@hooks/useNetworkStatus';
import { useToast } from '@hooks/useToast';
import { useNavigation } from '@react-navigation/native';
import {
  useTheme,
  useThemedStyles,
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
  const styles = useThemedStyles(createStyles);
  const { preference, setPreference } = useThemePreference();
  const isOnline = useIsOnline();
  const toast = useToast();
  const navigation = useNavigation();

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

      <Card
        variant="outlined"
        padding="lg"
        style={styles.card}
        onPress={() => navigation.navigate('DesignSystem')}
        accessibilityLabel="Open the design system showcase"
        testID="open-design-system"
      >
        <View style={styles.linkRow}>
          <View style={styles.linkText}>
            <Typography variant="overline" tone="tertiary">
              Developer
            </Typography>
            <Typography variant="h4" style={styles.linkTitle}>
              Design system
            </Typography>
            <Typography variant="bodySmall" tone="secondary">
              Preview every shared component in the current theme.
            </Typography>
          </View>

          <Icon
            name="chevronRight"
            size="lg"
            color={theme.colors.textTertiary}
          />
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
  const styles = useThemedStyles(createStyles);

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
    linkRow: {
      alignItems: 'center',
      columnGap: theme.spacing.md,
      flexDirection: 'row',
    },
    linkText: {
      flex: 1,
    },
    linkTitle: {
      marginBottom: theme.spacing.xxs,
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
