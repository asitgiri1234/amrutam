/**
 * WHY `navigation/` exists as its own layer:
 *
 * Navigation is the app's *skeleton*, and it is the one thing every feature
 * touches. If each module registered its own routes wherever it liked, three
 * things break as the team grows:
 *
 *   1. Deep links stop being reviewable — no one file describes the URL space.
 *   2. Type safety evaporates. React Navigation's param typing needs the whole
 *      graph declared in one place (`types.ts`), which is what makes
 *      `navigate('Typo')` a compile error.
 *   3. Screen-view analytics and auth gating end up duplicated per navigator.
 *
 * So the shape of the graph lives here; the *content* of each tab lives in its
 * module. Modules extend `MainTabParamList` with their own nested stack rather
 * than creating a parallel navigation root.
 */

export { RootNavigator } from './RootNavigator';
export { MainTabNavigator } from './MainTabNavigator';
export { linking } from './linking';
export {
  getCurrentRouteName,
  goBack,
  navigate,
  navigationRef,
} from './navigationRef';
export type {
  MainTabParamList,
  MainTabScreenProps,
  RootStackParamList,
  RootStackScreenProps,
} from './types';
