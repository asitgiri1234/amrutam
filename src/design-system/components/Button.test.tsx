import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@tests/renderWithProviders';

import { Button } from './Button';

describe('Button', () => {
  it('calls onPress when enabled', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Book now" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Book now' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <Button label="Book now" onPress={onPress} disabled />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Book now' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('blocks presses while loading — a double-submitted booking is a money bug', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Pay" onPress={onPress} loading />);

    await fireEvent.press(screen.getByRole('button', { name: 'Pay' }));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('button-loading')).toBeTruthy();
  });

  it('exposes busy and disabled state to assistive technology', async () => {
    await renderWithProviders(
      <Button label="Pay" onPress={jest.fn()} loading />,
    );

    expect(
      screen.getByRole('button', { name: 'Pay' }).props.accessibilityState,
    ).toMatchObject({ busy: true, disabled: true });
  });

  it('renders in dark mode without throwing', async () => {
    await renderWithProviders(<Button label="Book now" onPress={jest.fn()} />, {
      theme: 'dark',
    });

    expect(screen.getByRole('button', { name: 'Book now' })).toBeTruthy();
  });
});
