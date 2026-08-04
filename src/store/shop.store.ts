/**
 * Shop store — client state for the commerce flow.
 *
 * INTENTIONALLY EMPTY (foundation milestone).
 *
 * WHAT BELONGS HERE
 *   - the local cart: an offline-editable list of `{ productId, quantity }`
 *     plus a dirty flag, so the user can add items on a train and have them
 *     replayed by the mutation queue on reconnect
 *   - catalogue filter/sort selections and the last-viewed category
 *
 * WHAT DOES NOT
 *   - Product data, prices or stock levels. Prices especially must never be
 *     cached in client state — a stale price shown at checkout is a support
 *     ticket at best and a chargeback at worst. Read them fresh from React
 *     Query.
 *   - Order history. Server state.
 *
 * NOTE for whoever builds this: the cart is the one piece of state in the app
 * that genuinely needs both persistence AND queued writes. Model it as local
 * intent, reconciled against the server cart on sync — not as a mirror of it.
 */

import { createAppStore } from './createStore';

/** Empty by design — see the note above. */
export type ShopState = Record<string, never>;

export const useShopStore = createAppStore<ShopState>(() => ({}), {
  name: 'shop',
});
