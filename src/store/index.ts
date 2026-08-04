/**
 * WHY `store/` exists — and why it is deliberately small:
 *
 * The most valuable decision in this architecture is the split between
 * **server state** and **client state**.
 *
 *   Server state (React Query): anything that lives on the backend. Doctors,
 *   products, orders, records. It needs caching, deduplication, background
 *   revalidation, retry and garbage collection — all of which React Query
 *   does and none of which a state store does.
 *
 *   Client state (Zustand): anything the server does not know about. Session
 *   status, an in-progress booking draft, a local cart, UI flags.
 *
 * Teams that ignore this line end up copying fetched data into their store,
 * and from then on every bug is "which copy is right?". Every store here
 * documents what must NOT go into it, for exactly that reason.
 *
 * All five stores are intentionally empty at the foundation stage.
 */

export { createAppStore, resetAllStores } from './createStore';
export type { AppStore, PersistConfig, StoreOptions } from './createStore';

export { useAuthStore } from './auth.store';
export type { AuthState, AuthStatus } from './auth.store';

export { useConsultationStore } from './consultation.store';
export type { ConsultationState } from './consultation.store';

export { useHealthStore } from './health.store';
export type { HealthState } from './health.store';

export { useShopStore } from './shop.store';
export type { ShopState } from './shop.store';

export { useUiStore } from './ui.store';
export type { UiState } from './ui.store';
