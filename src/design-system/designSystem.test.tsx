/**
 * Smoke coverage for every shared primitive.
 *
 * WHY this test exists at all: "supports light and dark" is easy to claim and
 * easy to break — a component that reads a colour role neither theme defines
 * renders `undefined` and looks fine in exactly one mode. Rendering every
 * primitive under both themes is the cheapest possible guard against that.
 *
 * It deliberately asserts on behaviour and accessibility, not on styles.
 * Snapshotting a themed component would break on every token tweak and teach
 * people to run `-u` without reading the diff.
 */

import { useToast } from '@hooks/useToast';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@tests/renderWithProviders';

import {
  Avatar,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  FilterChip,
  Loader,
  Modal,
  Screen,
  SearchBar,
  Skeleton,
  TextField,
  Typography,
} from './index';

describe.each(['light', 'dark'] as const)(
  'design system in %s theme',
  theme => {
    it('renders Text with its content intact', async () => {
      await renderWithProviders(<Typography>Ayurveda</Typography>, { theme });

      expect(screen.getByText('Ayurveda')).toBeTruthy();
    });

    it('renders Button as an accessible button', async () => {
      await renderWithProviders(
        <Button label="Book now" onPress={jest.fn()} />,
        { theme },
      );

      expect(screen.getByRole('button', { name: 'Book now' })).toBeTruthy();
    });

    it('renders Card and its children', async () => {
      await renderWithProviders(
        <Card testID="card">
          <Typography>Inside</Typography>
        </Card>,
        { theme },
      );

      expect(screen.getByTestId('card')).toBeTruthy();
      expect(screen.getByText('Inside')).toBeTruthy();
    });

    it('renders Loader with a busy progressbar role', async () => {
      await renderWithProviders(<Loader label="Loading slots" />, { theme });

      const loader = screen.getByRole('progressbar', { name: 'Loading slots' });
      expect(loader.props.accessibilityState).toMatchObject({ busy: true });
    });

    it('renders EmptyState with its action', async () => {
      await renderWithProviders(
        <EmptyState
          title="No consultations yet"
          description="Your booked sessions will appear here."
          actionLabel="Find a doctor"
          onAction={jest.fn()}
        />,
        { theme },
      );

      expect(screen.getByText('No consultations yet')).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'Find a doctor' }),
      ).toBeTruthy();
    });

    it('renders Screen children, and swaps them for the loading and error slots', async () => {
      const { rerender } = await renderWithProviders(
        <Screen testID="screen">
          <Typography>Content</Typography>
        </Screen>,
        { theme },
      );

      expect(screen.getByText('Content')).toBeTruthy();

      await rerender(
        <Screen testID="screen" loading>
          <Typography>Content</Typography>
        </Screen>,
      );
      expect(screen.queryByText('Content')).toBeNull();
      expect(screen.getByRole('progressbar')).toBeTruthy();

      await rerender(
        <Screen testID="screen" error={new Error('Network request failed')}>
          <Typography>Content</Typography>
        </Screen>,
      );
      expect(screen.queryByText('Content')).toBeNull();
      expect(screen.getByTestId('screen-error')).toBeTruthy();
    });

    it('renders TextField with its label, helper text and error', async () => {
      const { rerender } = await renderWithProviders(
        <TextField label="Email" helperText="We never share this." />,
        { theme },
      );

      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('We never share this.')).toBeTruthy();

      // The error replaces the helper text rather than stacking with it.
      await rerender(
        <TextField
          label="Email"
          helperText="We never share this."
          error="Enter a valid email address"
        />,
      );

      expect(screen.getByText('Enter a valid email address')).toBeTruthy();
      expect(screen.queryByText('We never share this.')).toBeNull();
    });

    it('renders SearchBar and reveals its clear affordance only once typed', async () => {
      await renderWithProviders(
        <SearchBar onSearch={jest.fn()} placeholder="Search doctors" />,
        { theme },
      );

      const input = screen.getByPlaceholderText('Search doctors');
      expect(screen.queryByTestId('search-clear')).toBeNull();

      await fireEvent.changeText(input, 'panchakarma');

      expect(screen.getByTestId('search-clear')).toBeTruthy();
    });

    it('renders FilterChip and reports its selected state', async () => {
      const onPress = jest.fn();
      await renderWithProviders(
        <FilterChip
          label="Panchakarma"
          count={24}
          selected
          onPress={onPress}
          testID="chip"
        />,
        { theme },
      );

      const chip = screen.getByTestId('chip');
      expect(chip.props.accessibilityState).toMatchObject({ selected: true });

      await fireEvent.press(chip);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('renders Avatar initials when no image is supplied', async () => {
      await renderWithProviders(<Avatar name="Asit Giri" />, { theme });

      expect(screen.getByText('AG')).toBeTruthy();
    });

    it('renders Divider in both orientations', async () => {
      await renderWithProviders(
        <>
          <Divider testID="rule-h" />
          <Divider testID="rule-v" orientation="vertical" emphasis="strong" />
        </>,
        { theme },
      );

      expect(screen.getByTestId('rule-h')).toBeTruthy();
      expect(screen.getByTestId('rule-v')).toBeTruthy();
    });

    it('renders Modal only while visible, and closes on scrim press', async () => {
      const onClose = jest.fn();
      const { rerender } = await renderWithProviders(
        <Modal visible={false} onClose={onClose} title="Sheet">
          <Typography>Sheet body</Typography>
        </Modal>,
        { theme },
      );

      expect(screen.queryByText('Sheet body')).toBeNull();

      await rerender(
        <Modal visible onClose={onClose} title="Sheet">
          <Typography>Sheet body</Typography>
        </Modal>,
      );

      expect(screen.getByText('Sheet body')).toBeTruthy();

      // `includeHiddenElements` is required here, and that is correct
      // behaviour rather than a workaround: the surface sets
      // `accessibilityViewIsModal`, which masks its siblings from the
      // accessibility tree. A screen-reader user dismisses via the close
      // button; the scrim is a pointer affordance only.
      await fireEvent.press(
        screen.getByTestId('modal-scrim', { includeHiddenElements: true }),
      );
      expect(onClose).toHaveBeenCalledTimes(1);

      await fireEvent.press(screen.getByTestId('modal-close'));
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    it('renders Skeleton with and without its shimmer', async () => {
      await renderWithProviders(
        <>
          <Skeleton testID="shimmering" />
          <Skeleton testID="static" animated={false} />
        </>,
        { theme },
      );

      expect(screen.getByTestId('shimmering')).toBeTruthy();
      expect(screen.getByTestId('static')).toBeTruthy();
    });

    it('renders ErrorState per variant, and offers retry only where it helps', async () => {
      const onRetry = jest.fn();
      const { rerender } = await renderWithProviders(
        <ErrorState variant="offline" onRetry={onRetry} />,
        { theme },
      );

      expect(screen.getByText('You are offline')).toBeTruthy();
      await fireEvent.press(screen.getByTestId('error-state-retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);

      // notFound without a retry handler must not render a dead button.
      await rerender(<ErrorState variant="notFound" />);
      expect(screen.getByText('Not found')).toBeTruthy();
      expect(screen.queryByTestId('error-state-retry')).toBeNull();
    });
  },
);

describe('Toast', () => {
  it('shows a queued toast and dismisses it', async () => {
    // Toast is driven through the provider rather than rendered directly —
    // that is its real API, so testing it any other way proves nothing.
    await renderWithProviders(<ToastHarness />);

    expect(screen.queryByTestId('toast-success')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Notify' }));
    expect(screen.getByText('Saved')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('toast-dismiss'));
    expect(screen.queryByText('Saved')).toBeNull();
  });
});

function ToastHarness() {
  const toast = useToast();

  return <Button label="Notify" onPress={() => toast.success('Saved')} />;
}
