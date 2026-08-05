/**
 * Smoke coverage for the six shared primitives.
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

import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '@tests/renderWithProviders';

import { Button, Card, EmptyState, Loader, Screen, Typography } from './index';

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
  },
);
