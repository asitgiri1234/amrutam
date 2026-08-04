/**
 * Consultation tab.
 *
 * INTENTIONALLY a placeholder — the Consultation module is out of scope for
 * the foundation milestone. When it lands it replaces this file with its own
 * nested stack (`ConsultationNavigator`) registered in `MainTabParamList`.
 */

import { ModulePlaceholder } from './ModulePlaceholder';

export function ConsultationScreen() {
  return (
    <ModulePlaceholder
      testID="consultation-screen"
      moduleName="Consultation"
      icon="consultation"
      description="Doctor discovery, availability and booking will live here."
      plannedCapabilities={[
        'Doctor search with speciality, language and price filters',
        'Availability calendar and slot booking',
        'Chat and video consultation session',
        'Prescription delivery into Health Records',
      ]}
    />
  );
}
