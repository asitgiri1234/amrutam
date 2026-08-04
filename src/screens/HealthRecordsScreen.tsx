/**
 * Health Records tab.
 *
 * INTENTIONALLY a placeholder — see `ConsultationScreen.tsx`.
 *
 * Note for whoever builds this: this module carries the strictest data
 * handling rules in the app. See `store/health.store.ts` for what must never
 * be persisted, and `utils/logger.ts` for the redaction list.
 */

import { ModulePlaceholder } from './ModulePlaceholder';

export function HealthRecordsScreen() {
  return (
    <ModulePlaceholder
      testID="health-records-screen"
      moduleName="Health Records"
      icon="health"
      description="Prescriptions, lab reports and vitals will live here."
      plannedCapabilities={[
        'Timeline of prescriptions, reports and vitals',
        'Family member profiles',
        'Document upload with queued, resumable sync',
        'Encrypted offline access with an explicit retention policy',
      ]}
    />
  );
}
