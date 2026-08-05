/**
 * Consultation module — PUBLIC surface.
 *
 * Per `modules/README.md`, anything not exported here is private to the
 * module. Other modules and the app shell import from `@modules/consultation`,
 * never from a path inside it.
 *
 * Scope of this milestone: doctor *listing* only. No booking flow, no doctor
 * detail. Both arrive later and will extend this barrel rather than replace it.
 */

export { DoctorListScreen } from './screens/DoctorListScreen';

export { useDoctorList, DOCTOR_PAGE_SIZE } from './hooks/useDoctorList';
export type { UseDoctorListResult } from './hooks/useDoctorList';

export { DoctorCard, DOCTOR_CARD_HEIGHT } from './components/DoctorCard';
export type { DoctorCardProps } from './components/DoctorCard';

export {
  getDoctorRepository,
  setDoctorRepository,
  HttpDoctorRepository,
} from './repositories';
