/**
 * Auth store — session identity and lifecycle.
 *
 * INTENTIONALLY EMPTY (foundation milestone). The shape below documents what
 * belongs here so the Auth module has nowhere to drift to.
 *
 * WHAT BELONGS HERE
 *   - `status`: 'unknown' | 'authenticated' | 'anonymous' — drives the root
 *     navigator's stack switch
 *   - the current user's id and display fields needed by the shell
 *
 * WHAT DOES NOT
 *   - **Tokens.** They go in the `secure` storage bucket, read by the auth
 *     interceptor. A token in a Zustand store gets serialised into devtools,
 *     crash reports and any accidental `console.log(state)`.
 *   - The full user profile. That is server state — React Query owns it, keyed
 *     by user id, so it revalidates and evicts like everything else.
 */

import { createAppStore } from './createStore';

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

export interface AuthState {
  /** `unknown` until the bootstrap check completes — the root navigator shows
   *  the splash screen for exactly this value. */
  status: AuthStatus;
  userId: string | null;
}

const initialState: AuthState = {
  status: 'unknown',
  userId: null,
};

export const useAuthStore = createAppStore<AuthState>(
  () => ({ ...initialState }),
  {
    name: 'auth',
    // `status` is persisted so a returning user does not see the splash /
    // login flash before the token check resolves.
    persist: {
      partialize: state => ({ status: state.status, userId: state.userId }),
    },
  },
);
