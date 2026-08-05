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
 * Every component gets its own section showing its real variants and states —
 * including the failure states (a broken avatar image, an invalid field, an
 * offline error), because those are the ones that actually get shipped broken.
 *
 * This is a developer surface, not a product feature. It contains no business
 * logic and reads no data — every prop below is a literal.
 */

import { useCallback, useState, type ReactNode } from 'react';

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
  type ErrorStateVariant,
  type ModalPresentation,
  type ToastVariant,
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

const TOAST_VARIANTS: ToastVariant[] = ['success', 'error', 'warning', 'info'];

const ERROR_VARIANTS: ErrorStateVariant[] = ['generic', 'offline', 'notFound'];

const FILTER_OPTIONS = [
  { label: 'Panchakarma', count: 24 },
  { label: 'Kayachikitsa', count: 11 },
  { label: 'Dravyaguna', count: 6 },
];

/** Deliberately unreachable — it demonstrates Avatar's fallback chain without
 *  depending on the network. */
const BROKEN_IMAGE_URI = 'https://invalid.amrutam.test/missing.png';

export function DesignSystemScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { preference, toggleTheme } = useThemePreference();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([
    'Panchakarma',
  ]);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [modal, setModal] = useState<ModalPresentation | null>(null);
  const [errorVariant, setErrorVariant] =
    useState<ErrorStateVariant>('offline');
  const [shimmer, setShimmer] = useState(true);

  const toggleFilter = useCallback((label: string) => {
    setSelectedFilters(current =>
      current.includes(label)
        ? current.filter(item => item !== label)
        : [...current, label],
    );
  }, []);

  // Stable handlers: without these, `memo` on Button and Card never hits.
  const showToast = useCallback(() => {
    toast.success('Toasts render above navigation', 'Design system');
  }, [toast]);

  const showToastVariant = useCallback(
    (variant: ToastVariant) => {
      toast.show({
        variant,
        title: variant,
        message: `This is a ${variant} toast.`,
        ...(variant === 'error'
          ? { action: { label: 'Retry', onPress: () => undefined } }
          : {}),
      });
    },
    [toast],
  );

  const openSheet = useCallback(() => setModal('sheet'), []);
  const openDialog = useCallback(() => setModal('dialog'), []);
  const closeModal = useCallback(() => setModal(null), []);
  const toggleShimmer = useCallback(() => setShimmer(current => !current), []);
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
          <Button
            label="Trailing"
            rightIcon="chevronRight"
            onPress={showToast}
          />
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

      {/* ---- TextField -------------------------------------------------- */}
      <Section
        title="TextField"
        caption="Forwards its ref, so React Hook Form can register it directly."
      >
        <TextField
          label="Full name"
          placeholder="Asit Giri"
          value={name}
          onChangeText={setName}
          leftIcon="user"
          helperText="Helper text sits below the field."
          required
          testID="showcase-field-name"
        />

        <TextField
          label="Email"
          placeholder="you@example.com"
          value="not-an-email"
          error="Enter a valid email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextField
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          rightIcon="close"
          onRightIconPress={noop}
        />

        <TextField
          label="Notes"
          placeholder="Anything the practitioner should know"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TextField
          label="Locked"
          value="Read-only value"
          disabled
          helperText="Disabled fields use the sunken surface."
        />
      </Section>

      {/* ---- SearchBar --------------------------------------------------- */}
      <Section
        title="SearchBar"
        caption="Debounced by default — onSearch fires after typing stops, not per keystroke."
      >
        <SearchBar
          onSearch={setQuery}
          placeholder="Search doctors"
          onFilterPress={noop}
          filterActive={selectedFilters.length > 0}
          testID="showcase-search"
        />

        <Typography variant="caption" tone="tertiary">
          {query.length === 0
            ? 'Debounced query: (empty)'
            : `Debounced query: "${query}"`}
        </Typography>

        <SearchBar onSearch={noop} placeholder="Without filter affordance" />
      </Section>

      {/* ---- FilterChip -------------------------------------------------- */}
      <Section
        title="FilterChip"
        caption="Controlled by design — selection lives in the caller, so it survives navigation."
      >
        <View style={styles.wrap}>
          {FILTER_OPTIONS.map(option => (
            <FilterChip
              key={option.label}
              label={option.label}
              count={option.count}
              selected={selectedFilters.includes(option.label)}
              onPress={() => toggleFilter(option.label)}
              testID={`showcase-chip-${option.label}`}
            />
          ))}
        </View>

        <Divider spacing="md" />

        <View style={styles.wrap}>
          <FilterChip label="With icon" icon="health" selected onPress={noop} />
          <FilterChip label="Dismissible" selected dismissible onPress={noop} />
          <FilterChip
            label="Disabled"
            selected={false}
            disabled
            onPress={noop}
          />
        </View>
      </Section>

      {/* ---- Avatar ------------------------------------------------------ */}
      <Section
        title="Avatar"
        caption="Fallback chain: image → initials → icon. The first one below points at a dead URL on purpose."
      >
        <View style={styles.row}>
          <Avatar uri={BROKEN_IMAGE_URI} name="Asit Giri" size="lg" />
          <Avatar name="Vaidya Kumar" size="lg" />
          <Avatar size="lg" />
        </View>

        <Divider spacing="md" />

        <View style={styles.row}>
          <Avatar name="Asit Giri" size="xs" />
          <Avatar name="Asit Giri" size="sm" />
          <Avatar name="Asit Giri" size="md" />
          <Avatar name="Asit Giri" size="lg" />
          <Avatar name="Asit Giri" size="xl" />
        </View>

        <Divider spacing="md" />

        <View style={styles.row}>
          <Avatar name="Online Doctor" status="online" />
          <Avatar name="Busy Doctor" status="busy" />
          <Avatar name="Offline Doctor" status="offline" />
          <Avatar name="Square Shape" shape="rounded" />
        </View>
      </Section>

      {/* ---- Divider ------------------------------------------------------ */}
      <Section
        title="Divider"
        caption="Renders on every density — hairlines do not."
      >
        <Card variant="outlined" padding="none">
          <View style={styles.dividerRow}>
            <Typography variant="bodySmall">Default</Typography>
          </View>
          <Divider />
          <View style={styles.dividerRow}>
            <Typography variant="bodySmall">Strong emphasis</Typography>
          </View>
          <Divider emphasis="strong" />
          <View style={styles.dividerRow}>
            <Typography variant="bodySmall">Inset, as used in lists</Typography>
          </View>
          <Divider inset="giant" />
          <View style={styles.dividerRow}>
            <Typography variant="bodySmall">End</Typography>
          </View>
        </Card>

        <View style={styles.verticalDividerRow}>
          <Typography variant="bodySmall" tone="secondary">
            Vertical
          </Typography>
          <Divider orientation="vertical" spacing="md" />
          <Typography variant="bodySmall" tone="secondary">
            Divider
          </Typography>
          <Divider orientation="vertical" spacing="md" emphasis="strong" />
          <Typography variant="bodySmall" tone="secondary">
            Strong
          </Typography>
        </View>
      </Section>

      {/* ---- Loader -------------------------------------------------------- */}
      <Section
        title="Loader"
        caption="Themed spinner; the label is announced as one element."
      >
        <View style={styles.row}>
          <Loader />
          <Loader size="large" />
          <Loader label="Loading slots" />
        </View>
      </Section>

      {/* ---- Skeleton ------------------------------------------------------ */}
      <Section
        title="Skeleton"
        caption="Shimmer runs on the UI thread — it stays smooth while JS is busy, which is exactly when it is on screen."
      >
        <Card variant="outlined" padding="none">
          <SkeletonListItem />
          <Divider inset="lg" />
          <SkeletonListItem />
          <Divider inset="lg" />
          <View style={styles.skeletonBlock}>
            <Skeleton width="70%" height={18} animated={shimmer} />
            <Skeleton width="45%" animated={shimmer} />
            <Skeleton width={64} height={64} radius="lg" animated={shimmer} />
          </View>
        </Card>

        <Button
          label={shimmer ? 'Pause shimmer' : 'Resume shimmer'}
          variant="ghost"
          size="sm"
          onPress={toggleShimmer}
        />
      </Section>

      {/* ---- EmptyState ---------------------------------------------------- */}
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

      {/* ---- ErrorState ----------------------------------------------------- */}
      <Section
        title="ErrorState"
        caption="Three variants, because users treat them differently. Retry is useless for notFound, so it is omitted there."
      >
        <View style={styles.wrap}>
          {ERROR_VARIANTS.map(variant => (
            <FilterChip
              key={variant}
              label={variant}
              selected={errorVariant === variant}
              onPress={() => setErrorVariant(variant)}
              testID={`showcase-error-${variant}`}
            />
          ))}
        </View>

        <Card variant="filled" padding="none">
          <ErrorState
            variant={errorVariant}
            fullscreen={false}
            supportCode="req_9f2c41"
            {...(errorVariant === 'notFound' ? {} : { onRetry: noop })}
          />
        </Card>
      </Section>

      {/* ---- Modal ----------------------------------------------------------- */}
      <Section
        title="Modal"
        caption="Sheet slides from the bottom, dialog fades in centred. Both dismiss on scrim tap and Android back."
      >
        <View style={styles.wrap}>
          <Button
            label="Open sheet"
            variant="secondary"
            onPress={openSheet}
            testID="showcase-open-sheet"
          />
          <Button label="Open dialog" variant="outline" onPress={openDialog} />
        </View>
      </Section>

      {/* ---- Toast ------------------------------------------------------------ */}
      <Section
        title="Toast"
        caption="Queued by ToastProvider, capped at three. The error variant below carries an action."
      >
        <View style={styles.wrap}>
          {TOAST_VARIANTS.map(variant => (
            <Button
              key={variant}
              label={variant}
              size="sm"
              variant="outline"
              onPress={() => showToastVariant(variant)}
              testID={`showcase-toast-${variant}`}
            />
          ))}
        </View>

        <Typography variant="caption" tone="tertiary">
          Tap several quickly — the oldest is dropped rather than the newest
          refused.
        </Typography>
      </Section>

      {/* ---- Icon -------------------------------------------------------------- */}
      <Section
        title="Icon"
        caption="Typed registry — a wrong name is a compile error."
      >
        <View style={styles.wrap}>
          <Icon name="search" />
          <Icon name="check" color={theme.colors.success} />
          <Icon name="alertCircle" color={theme.colors.danger} />
          <Icon name="alertTriangle" color={theme.colors.warning} />
          <Icon name="health" color={theme.colors.primary} />
          <Icon name="shop" color={theme.colors.primary} />
          <Icon name="consultation" color={theme.colors.primary} />
          <Icon name="wifiOff" color={theme.colors.textTertiary} />
        </View>
      </Section>

      {/* ---- Screen ------------------------------------------------------------- */}
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

      <Modal
        visible={modal !== null}
        onClose={closeModal}
        presentation={modal ?? 'sheet'}
        title={
          modal === 'dialog' ? 'Dialog presentation' : 'Sheet presentation'
        }
        footer={<Button label="Close" onPress={closeModal} fullWidth />}
      >
        <Typography tone="secondary">
          Scrim taps dismiss, the Android back button dismisses, and the safe
          area is respected. Pass `dismissible={false}` for destructive
          confirmations where an accidental tap must not cancel the flow.
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
  children: ReactNode;
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
    caption: {
      marginTop: theme.spacing.xxs,
    },
    dividerRow: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    row: {
      alignItems: 'center',
      columnGap: theme.spacing.lg,
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: theme.spacing.md,
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
    verticalDividerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      height: 40,
    },
    wrap: {
      alignItems: 'center',
      columnGap: theme.spacing.sm,
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: theme.spacing.sm,
    },
  });
