/**
 * Doctor mock factory.
 *
 * NO DATA IS GENERATED YET — by design. The Doctor type is owned by the
 * Consultation module, which does not exist, and inventing a shape here would
 * guarantee it diverges from the real one.
 *
 * WHAT IS HERE: the vocabulary this factory will draw from, which *is* a
 * foundation concern — realistic Ayurvedic specialities and Indian city names
 * are what make a mocked list look like the product rather than like
 * `lorem ipsum`, and they should not be re-invented per developer.
 *
 * TO IMPLEMENT (Consultation milestone):
 *   1. import the module's `Doctor` type
 *   2. write `const doctorFactory: MockFactory<Doctor> = (index, random) => …`
 *      using the pools below and the helpers in `../mockUtils`
 *   3. expose `buildDoctors(count, options)` wrapping `buildList`
 *
 * Keep it seeded. Keep it lazy for counts above ~1000 (`buildLazy`).
 */

/** Ayurvedic specialities, used for both filters and doctor profiles. */
export const SPECIALITIES = [
  'Panchakarma',
  'Kayachikitsa',
  'Shalya Tantra',
  'Shalakya Tantra',
  'Prasuti Tantra',
  'Kaumarbhritya',
  'Rasashastra',
  'Dravyaguna',
  'Swasthavritta',
  'Manas Roga',
] as const;

export const CONSULTATION_MODES = [
  'video',
  'audio',
  'chat',
  'inPerson',
] as const;

export const LANGUAGES = [
  'Hindi',
  'English',
  'Marathi',
  'Gujarati',
  'Tamil',
  'Telugu',
  'Kannada',
  'Bengali',
  'Malayalam',
  'Punjabi',
] as const;

export const CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Kochi',
] as const;

export type Speciality = (typeof SPECIALITIES)[number];
export type ConsultationMode = (typeof CONSULTATION_MODES)[number];
