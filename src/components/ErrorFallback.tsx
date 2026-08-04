/**
 * ErrorFallback — what the user sees after a render crash.
 *
 * WHY it is deliberately plain and dependency-light: this component renders
 * *after* something has already gone wrong. If it pulled in navigation, data
 * fetching or a complex layout, a bug in any of those would break the screen
 * whose entire job is to survive bugs. It uses only the theme and two design
 * primitives.
 *
 * The technical detail (`error.message`) is shown only outside production.
 * Users get a plain apology and a working button; engineers get the message
 * without needing a debugger attached.
 */

import { ScrollView, StyleSheet, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isProduction } from '@config';
import { SUPPORT_EMAIL } from '@constants/app.constants';
import { Button, Typography } from '@design-system';
import { useTheme, type Theme } from '@theme';

export interface ErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();

  return (
    <View
      testID="error-fallback"
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + theme.spacing.xxl,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.content}>
        <Typography variant="h2" align="center">
          Something went wrong
        </Typography>

        <Typography variant="body" tone="secondary" align="center">
          The app hit an unexpected problem. Restarting this screen usually
          fixes it.
        </Typography>

        {isProduction ? null : (
          <ScrollView
            style={styles.detail}
            contentContainerStyle={styles.detailContent}
          >
            <Typography variant="caption" tone="danger">
              {error.message}
            </Typography>
            {error.stack === undefined ? null : (
              <Typography variant="caption" tone="tertiary">
                {error.stack}
              </Typography>
            )}
          </ScrollView>
        )}

        <Button
          label="Try again"
          onPress={onReset}
          variant="primary"
          fullWidth
          testID="error-fallback-retry"
        />

        <Typography variant="caption" tone="tertiary" align="center">
          {`Still stuck? Write to ${SUPPORT_EMAIL}`}
        </Typography>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xxl,
    },
    content: {
      rowGap: theme.spacing.lg,
    },
    detail: {
      backgroundColor: theme.colors.surfaceSunken,
      borderRadius: theme.radius.md,
      maxHeight: 200,
    },
    detailContent: {
      padding: theme.spacing.md,
      rowGap: theme.spacing.sm,
    },
  });
