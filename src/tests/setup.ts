/**
 * Jest setup — runs before every test file.
 *
 * WHY these mocks are centralised rather than per-test: they are all native
 * modules with no JS implementation (JSI storage, the gesture native view,
 * the netinfo bridge). Every one of them would otherwise have to be mocked in
 * every test file that transitively imports a component. Doing it once here is
 * what keeps writing a test cheap — and a cheap test is a test that gets
 * written.
 */

/* eslint-env jest */

/* ---- MMKV -------------------------------------------------------------
 * MMKV is JSI-only and cannot load in Node. The in-memory adapter already
 * exists in `src/storage/memoryStorage.ts` as a real implementation of the
 * storage port, so the mock only has to satisfy MMKV's own surface. */
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => {
    const store = new Map<string, string | number | boolean>();

    return {
      set: (key: string, value: string | number | boolean) => {
        store.set(key, value);
      },
      getString: (key: string) => {
        const value = store.get(key);
        return typeof value === 'string' ? value : undefined;
      },
      getNumber: (key: string) => {
        const value = store.get(key);
        return typeof value === 'number' ? value : undefined;
      },
      getBoolean: (key: string) => {
        const value = store.get(key);
        return typeof value === 'boolean' ? value : undefined;
      },
      contains: (key: string) => store.has(key),
      remove: (key: string) => store.delete(key),
      getAllKeys: () => Array.from(store.keys()),
      clearAll: () => {
        store.clear();
      },
    };
  },
}));

/* ---- NetInfo ---------------------------------------------------------- */
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(() =>
      Promise.resolve({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: null,
      }),
    ),
    refresh: jest.fn(() =>
      Promise.resolve({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: null,
      }),
    ),
  },
}));

/* ---- Reanimated -------------------------------------------------------
 * Reanimated 4 moved its worklet runtime into `react-native-worklets`, and the
 * mock it ships (`react-native-reanimated/mock`) still pulls in that native
 * module — so it cannot load under Node.
 *
 * We therefore supply our own. It collapses every animation to its final value
 * synchronously, which is exactly what a test wants: assertions run against the
 * settled UI, with no timers to flush and no frame-timing flakiness. Only the
 * surface the app actually uses is implemented; anything new will fail loudly
 * here rather than silently no-op. */
jest.mock('react-native-reanimated', () => {
  const { View, Text, ScrollView, Image } = require('react-native');
  const linear = (value: number) => value;

  return {
    __esModule: true,
    default: {
      View,
      Text,
      ScrollView,
      Image,
      createAnimatedComponent: (component: unknown) => component,
    },
    // A plain mutable box behaves like a shared value for assertion purposes.
    useSharedValue: <T>(initial: T) => ({ value: initial }),
    // Run the worklet immediately and use whatever style it produces.
    useAnimatedStyle: (factory: () => unknown) => factory(),
    useDerivedValue: (factory: () => unknown) => ({ value: factory() }),
    // Animations resolve instantly to their target.
    withTiming: <T>(toValue: T) => toValue,
    withSpring: <T>(toValue: T) => toValue,
    withDelay: <T>(_delay: number, animation: T) => animation,
    withRepeat: <T>(animation: T) => animation,
    withSequence: <T>(...animations: T[]) => animations[animations.length - 1],
    cancelAnimation: () => undefined,
    // Interpolation settles at the start of the range.
    interpolate: (_value: number, _input: number[], output: number[]) =>
      output[0],
    interpolateColor: (_value: number, _input: number[], output: string[]) =>
      output[0],
    runOnJS:
      (fn: (...args: unknown[]) => unknown) =>
      (...args: unknown[]) =>
        fn(...args),
    runOnUI:
      (fn: (...args: unknown[]) => unknown) =>
      (...args: unknown[]) =>
        fn(...args),
    Easing: {
      linear,
      ease: linear,
      quad: linear,
      in: () => linear,
      out: () => linear,
      inOut: () => linear,
      bezier: () => linear,
    },
  };
});

/* ---- Gesture handler --------------------------------------------------- */
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    Directions: {},
    State: {},
    gestureHandlerRootHOC: (component: unknown) => component,
  };
});

/* ---- Safe area ---------------------------------------------------------
 * Fixed, non-zero insets so layout assertions are stable across platforms. */
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 44, right: 0, bottom: 34, left: 0 };
  const RN = require('react-native');

  return {
    SafeAreaProvider: RN.View,
    SafeAreaView: RN.View,
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

/* Timers used by the toast queue and debounce helpers leak between tests
 * otherwise, producing "state update on unmounted component" noise. */
afterEach(() => {
  jest.clearAllTimers();
});
