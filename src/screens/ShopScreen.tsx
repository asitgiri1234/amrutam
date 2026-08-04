/**
 * Shop tab.
 *
 * INTENTIONALLY a placeholder — see `ConsultationScreen.tsx`.
 */

import { ModulePlaceholder } from './ModulePlaceholder';

export function ShopScreen() {
  return (
    <ModulePlaceholder
      testID="shop-screen"
      moduleName="Shop"
      icon="shop"
      description="The Ayurvedic product catalogue, cart and checkout will live here."
      plannedCapabilities={[
        'Catalogue browsing with FlashList-backed infinite scroll',
        'Product detail, reviews and dosage guidance',
        'Offline-capable cart backed by the mutation queue',
        'Checkout, payments and order tracking',
      ]}
    />
  );
}
