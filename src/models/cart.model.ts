/**
 * CartItem / Cart — the Shop module's local-first entity.
 *
 * The cart is the one thing in this app that is genuinely *local intent*
 * reconciled against the server, rather than a mirror of server state. A user
 * adds items on a train with no signal; the mutation queue replays those adds
 * on reconnect. That shapes two decisions here:
 *
 *   1. **A line has its own `id`, separate from `productId`/`variantId`.**
 *      The queue needs a stable handle for a line created offline, before the
 *      server has ever seen it.
 *
 *   2. **`unitPriceSnapshot` is named to be distrusted.** It is the price when
 *      the item was added, kept only so the UI can show a total offline and
 *      detect a change. It is NEVER the price charged. Checkout re-prices
 *      server-side; showing a stale price at payment is a chargeback, and
 *      `store/shop.store.ts` says the same thing from the state side.
 */

import type { IsoDateTime, Money } from './common.model';

export interface CartItem {
  /** Line id — stable across offline creation and server sync. */
  id: string;
  productId: string;
  variantId: string;
  quantity: number;

  /**
   * Price at the moment of adding. Display and change-detection only.
   * @see the note at the top of this file before using it for anything else.
   */
  unitPriceSnapshot: Money;

  addedAt: IsoDateTime;
  /** True until the server has acknowledged this line. Drives the "pending"
   *  affordance and tells the sync manager what still needs pushing. */
  isPendingSync?: boolean;
}

/**
 * Server-computed totals. Deliberately NOT derived on the client: discounts,
 * shipping thresholds and tax are business rules that must not be
 * reimplemented in the app, where they would drift from the backend and
 * disagree at checkout.
 */
export interface CartTotals {
  subtotal: Money;
  discount: Money;
  shipping: Money;
  tax: Money;
  total: Money;
}

export interface Cart {
  id: string;
  items: CartItem[];
  /** Absent while offline — the client cannot compute these itself. */
  totals?: CartTotals;
  appliedCouponCode?: string;
  updatedAt: IsoDateTime;
}
