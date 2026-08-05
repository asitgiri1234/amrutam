/**
 * Design system showcase — a living preview of every shared component.
 *
 * WHY this ships in the app rather than in Storybook:
 *   - It renders on a *real device*, which is the only place safe areas, font
 *     scaling, ripple behaviour and shadow rendering are truthful. Storybook
 *     on web would show none of those honestly.
 *   - It costs one screen and no extra tooling, so it cannot rot the way an
 *     unmaintained Storybook config does.
 *   - The theme toggle at the top makes light/dark parity checkable in two
 *     taps, which is what turns "supports dark mode" from a claim into
 *     something a reviewer can verify.
 *
 * This is a developer surface, not a product feature. It contains no business
 * logic and reads no data — every prop below is a literal.
 */

import { useCallback, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import {
  Avatar,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  FilterChip,
  Icon,
  Loader,
  Modal,
  Screen,
  SearchBar,
  Skeleton,
  SkeletonListItem,
  TextField,
  Typography,
  type ButtonVariant,
} from '@design-system';
import { useToast } from '@hooks/useToast';
import {
  useTheme,
  useThemedStyles,
  useThemePreference,
  type TextVariant,
  type Theme,
} from '@theme';

const BUTTON_VARIANTS: ButtonVariant[] = [
  'primary',
  'secondary',
  'outline',
  'ghost',
  'danger',
];

const TEXT_VARIANTS: TextVariant[] = [
  'display',
  'h1',
  'h2',
  'h3',
  'h4',
  'bodyLarge',
  'body',
  'bodySmall',
  'label',
  'button',
  'caption',
  'overline',
];

const FILTER_OPTIONS = ['Panchakarma', 'Kayachikitsa', 'Dravyaguna'];

export function DesignSystemScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { preference, toggleTheme } = useThemePreference();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([
    'Panchakarma',
  ]);
  const [fieldValue, setFieldValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const toggleFilter = useCallback((option: string) => {
    setSelectedFilters(current =>
      current.includes(option)
        ? current.filter(item => item !== option)
        : [...current, option],
    );
  }, []);

  // Stable handlers: without these, `memo` on Button and Card would never hit.
  const showToast = useCallback(() => {
    toast.success('Toasts render above navigation', 'Design system');
  }, [toast]);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);
  const noop = useCallback(() => undefined, []);

  return (
    <Screen scrollable testID="design-system-screen">
      <Section
        title="Theme"
        caption={`Preference: ${preference} · Resolved: ${theme.mode}`}
      >
        <Button
          label={`Switch to ${theme.mode === 'dark' ? 'light' : 'dark'}`}
          onPress={toggleTheme}
          variant="outline"
          leftIcon="refresh"
          fullWidth
          testID="showcase-toggle-theme"
        />
      </Section>

      {/* ---- Text ------------------------------------------------------ */}
      <Section title="Text" caption="One primitive, twelve semantic variants.">
        {TEXT_VARIANTS.map(variant => (
          <View key={variant} style={styles.typeRow}>
            <Typography
              variant="caption"
              tone="tertiary"
              style={styles.typeName}
            >
              {variant}
            </Typography>
            <Typography
              variant={variant}
              numberOfLines={1}
              style={styles.typeSample}
            >
              Ayurveda
            </Typography>
          </View>
        ))}

        <Divider spacing="md" />

        <View style={styles.stack}>
          <Typography tone="secondary">Secondary tone</Typography>
          <Typography tone="tertiary">Tertiary tone</Typography>
          <Typography tone="disabled">Disabled tone</Typography>
          <Typography tone="link">Link tone</Typography>
          <Typography tone="success">Success tone</Typography>
          <Typography tone="warning">Warning tone</Typography>
          <Typography tone="danger">Danger tone</Typography>
        </View>
      </Section>

      {/* ---- Button ---------------------------------------------------- */}
      <Section title="Button" caption="Five variants, three sizes, two states.">
        <View style={styles.wrap}>
          {BUTTON_VARIANTS.map(variant => (
            <Button
              key={variant}
              label={variant}
              variant={variant}
              onPress={showToast}
              testID={`showcase-button-${variant}`}
            />
          ))}
        </View>

        <Divider spacing="md" />

        <View style={styles.wrap}>
          <Button label="Small" size="sm" onPress={showToast} />
          <Button label="Medium" size="md" onPress={showToast} />
          <Button label="Large" size="lg" onPress={showToast} />
        </View>

        <Divider spacing="md" />

        <View style={styles.wrap}>
          <Button label="With icon" leftIcon="plus" onPress={showToast} />
          <Button label="Loading" loading onPress={noop} />
          <Button label="Disabled" disabled onPress={noop} />
        </View>

        <Divider spacing="md" />

        <Button label="Full width" fullWidth onPress={showToast} />
      </Section>

      {/* ---- Card ------------------------------------------------------ */}
      <Section title="Card" caption="Three variants; tap the elevated one.">
        <View style={styles.stack}>
          <Card variant="elevated" onPress={showToast}>
            <Typography variant="label">Elevated (pressable)</Typography>
            <Typography variant="bodySmall" tone="secondary">
              Floats above the background. Default for list items.
            </Typography>
          </Card>

          <Card variant="outlined">
            <Typography variant="label">Outlined</Typography>
            <Typography variant="bodySmall" tone="secondary">
              Flat with a border. For dense lists where shadows create noise.
            </Typography>
          </Card>

          <Card variant="filled">
            <Typography variant="label">Filled</Typography>
            <Typography variant="bodySmall" tone="secondary">
              Recessed. For secondary or inline content.
            </Typography>
          </Card>
        </View>
      </Section>

      {/* ---- Loader ---------------------------------------------------- */}
      <Section title="Loader" caption="Themed spinner; label is announced.">
        <View style={styles.loaderRow}>
          <Loader />
          <Loader size="large" />
          <Loader label="Loading slots" />
        </View>
      </Section>

      {/* ---- EmptyState ------------------------------------------------ */}
      <Section
        title="EmptyState"
        caption="Success with no results — never an error."
      >
        <Card variant="filled" padding="none">
          <EmptyState
            title="No consultations yet"
            description="Your booked sessions will appear here."
            icon="inbox"
            actionLabel="Find a doctor"
            onAction={showToast}
            secondaryActionLabel="Clear filters"
            onSecondaryAction={noop}
            fullscreen={false}
          />
        </Card>
      </Section>

      {/* ---- Screen ---------------------------------------------------- */}
      <Section
        title="Screen"
        caption="You are inside one. It owns safe areas, the themed background, keyboard avoidance, and the loading/error slots."
      >
        <Card variant="filled">
          <Typography variant="bodySmall" tone="secondary">
            {'<Screen scrollable loading />  → centred Loader\n' +
              '<Screen error={err} onRetry />  → ErrorState\n' +
              '<Screen footer={<Button />} /> → pinned action bar'}
          </Typography>
        </Card>
      </Section>

      {/* ---- Supporting primitives ------------------------------------- */}
      <Section
        title="Also in the system"
        caption="Built with the foundation; shown here so the preview stays complete."
      >
        <SearchBar
          onSearch={setQuery}
          placeholder="Search doctors"
          onFilterPress={noop}
          filterActive={selectedFilters.length > 0}
        />
        {query.length === 0 ? null : (
          <Typography
            variant="caption"
            tone="tertiary"
            style={styles.queryEcho}
          >
            {`Debounced query: "${query}"`}
          </Typography>
        )}

        <View style={styles.wrap}>
          {FILTER_OPTIONS.map(option => (
            <FilterChip
              key={option}
              label={option}
              selected={selectedFilters.includes(option)}
              onPress={() => toggleFilter(option)}
            />
          ))}
        </View>

        <TextField
          label="Full name"
          placeholder="Asit Giri"
          value={fieldValue}
          onChangeText={setFieldValue}
          leftIcon="user"
          helperText="Helper text sits below the field."
          required
        />

        <TextField
          label="Email"
          placeholder="you@example.com"
          value=""
          error="Enter a valid email address"
          keyboardType="email-address"
        />

        <View style={styles.avatarRow}>
          <Avatar name="Asit Giri" size="sm" />
          <Avatar name="Vaidya Kumar" size="md" status="online" />
          <Avatar name="Priya Nair" size="lg" status="busy" />
          <Avatar size="lg" />
        </View>

        <View style={styles.wrap}>
          <Icon name="search" />
          <Icon name="check" color={theme.colors.success} />
          <Icon name="alertCircle" color={theme.colors.danger} />
          <Icon name="health" color={theme.colors.primary} />
        </View>

        <Card variant="outlined" padding="none">
          <SkeletonListItem />
          <Divider inset="lg" />
          <View style={styles.skeletonBlock}>
            <Skeleton width="70%" height={18} />
            <Skeleton width="45%" />
          </View>
        </Card>

        <Button label="Open modal" onPress={openModal} variant="secondary" />

        <Card variant="filled" padding="none">
          <ErrorState
            variant="offline"
            onRetry={noop}
            supportCode="req_9f2c41"
            fullscreen={false}
          />
        </Card>
      </Section>

      <Modal
        visible={modalVisible}
        onClose={closeModal}
        title="Sheet presentation"
        footer={<Button label="Close" onPress={closeModal} fullWidth />}
      >
        <Typography tone="secondary">
          Scrim taps dismiss, the Android back button dismisses, and the safe
          area is respected. Set `dismissible={false}` for destructive
          confirmations.
        </Typography>
      </Modal>
    </Screen>
  );
}

/** Local layout helper — deliberately not exported; it is not a design-system
 *  concern, only a way to keep this preview readable. */
function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <Typography variant="h3">{title}</Typography>
      {caption === undefined ? null : (
        <Typography variant="bodySmall" tone="tertiary" style={styles.caption}>
          {caption}
        </Typography>
      )}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    avatarRow: {
      alignItems: 'center',
      columnGap: theme.spacing.md,
      flexDirection: 'row',
    },
    caption: {
      marginTop: theme.spacing.xxs,
    },
    loaderRow: {
      alignItems: 'center',
      columnGap: theme.spacing.xxl,
      flexDirection: 'row',
    },
    queryEcho: {
      marginTop: theme.spacing.xs,
    },
    section: {
      marginBottom: theme.spacing.xxxl,
    },
    sectionBody: {
      marginTop: theme.spacing.lg,
      rowGap: theme.spacing.md,
    },
    skeletonBlock: {
      padding: theme.spacing.lg,
      rowGap: theme.spacing.sm,
    },
    stack: {
      rowGap: theme.spacing.md,
    },
    typeName: {
      width: 76,
    },
    typeRow: {
      alignItems: 'baseline',
      columnGap: theme.spacing.md,
      flexDirection: 'row',
      paddingVertical: theme.spacing.xxs,
    },
    typeSample: {
      flex: 1,
    },
    wrap: {
      alignItems: 'center',
      columnGap: theme.spacing.sm,
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: theme.spacing.sm,
    },
  });
