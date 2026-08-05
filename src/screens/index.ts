/**
 * WHY `screens/` exists separately from `modules/`:
 *
 * `screens/` holds the *shell* screens — the ones that belong to the app
 * itself rather than to a product area: Settings, NotFound, the design-system
 * preview, and (later) Splash and Onboarding. They are shallow by definition,
 * and they are what the navigator wires up before any module exists.
 *
 * Product-area screens live inside their module
 * (`modules/consultation/screens/…`) next to that module's repository, hooks
 * and store slice. Keeping a feature's screens with its logic is what lets one
 * team own one folder — and what lets a module be deleted, or lazily loaded,
 * in one move.
 *
 * Consultation has now moved out to `@modules/consultation`. Shop and Health
 * Records remain placeholders until their modules land.
 */

export { DesignSystemScreen } from './DesignSystemScreen';
export { HealthRecordsScreen } from './HealthRecordsScreen';
export { ModulePlaceholder } from './ModulePlaceholder';
export { NotFoundScreen } from './NotFoundScreen';
export { SettingsScreen } from './SettingsScreen';
export { ShopScreen } from './ShopScreen';
