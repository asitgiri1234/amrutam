/**
 * UI store — global, cross-screen interface state.
 *
 * INTENTIONALLY EMPTY (foundation milestone).
 *
 * WHAT BELONGS HERE
 *   - state that outlives a screen and is read by unrelated parts of the shell:
 *     a global "sync in progress" flag, an offline banner toggle, a
 *     force-update gate, the active bottom-tab badge counts
 *
 * WHAT DOES NOT
 *   - Anything a single screen owns. `useState` is cheaper, more local, and
 *     resets correctly when the screen unmounts. A global store full of
 *     one-screen booleans is how a codebase becomes impossible to reason
 *     about.
 *   - Theme preference. That lives in the ThemeProvider + storage, because it
 *     must be readable synchronously *before* React renders, to avoid a flash
 *     of the wrong theme.
 *   - Toasts. They are a queue with timers, owned by ToastProvider.
 */

import { createAppStore } from './createStore';

export interface UiState {
  /** Set by the sync manager; drives the pull-to-refresh spinner in the shell. */
  isSyncing: boolean;
  /** Shown when connectivity is lost. Separate from `isOnline()` so the banner
   *  can be dismissed without lying about the network. */
  isOfflineBannerVisible: boolean;
}

const initialState: UiState = {
  isSyncing: false,
  isOfflineBannerVisible: false,
};

export const useUiStore = createAppStore<UiState>(() => ({ ...initialState }), {
  name: 'ui',
});
