/**
 * Navigation type contract.
 *
 * WHY every param list is declared here rather than beside its navigator:
 * React Navigation's type safety only works if the *whole graph* is known in
 * one place. Declaring `RootStackParamList` globally (see the module
 * augmentation at the bottom) means `navigation.navigate('Nope')` is a
 * compile error anywhere in the app, and route params are typed inside
 * screens without a single manual annotation.
 *
 * This is the single highest-value 60 lines in the navigation layer — without
 * it, deep links and params are stringly-typed and break silently.
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * The four product areas. Params are empty at the foundation stage — modules
 * add their own nested stacks here (e.g. `Consultation:
 * NavigatorScreenParams<ConsultationStackParamList>`).
 */
export type MainTabParamList = {
  Consultation: undefined;
  Shop: undefined;
  HealthRecords: undefined;
  Settings: undefined;
};

/**
 * The root stack. Everything that must appear *above* the tab bar goes here:
 * modals, full-screen flows (checkout, video call), and the auth stack.
 */
export type RootStackParamList = {
  /** The tab shell. */
  Main: NavigatorScreenParams<MainTabParamList>;
  /**
   * Developer-only preview of the shared design system, opened from Settings.
   * It sits on the root stack rather than inside the Settings tab so it covers
   * the tab bar — full-width component previews are the point.
   */
  DesignSystem: undefined;
  /**
   * Placeholder for the modal group modules will add. Kept so the root stack
   * demonstrably supports more than one screen and the pattern is obvious.
   */
  NotFound: { path?: string } | undefined;
};

/* ---- Screen prop helpers ----------------------------------------------
 * Screens annotate with these instead of hand-rolling navigation/route types:
 *   function ShopScreen({ navigation }: MainTabScreenProps<'Shop'>) { ... }
 */

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

/**
 * Makes `useNavigation()` typed everywhere with no generic argument, which is
 * what stops screens from silently using `any`.
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
