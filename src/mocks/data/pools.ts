/**
 * Fixture vocabulary.
 *
 * WHY the pools are this specific: a mocked doctor list full of "Test User 1"
 * hides real problems. Names of realistic length reveal text truncation; a
 * genuine spread of Indian first names and surnames reveals that the avatar
 * initials logic works; product names built from real herb + preparation
 * combinations reveal that search ranking is plausible. Lorem ipsum reveals
 * none of it, and every one of those bugs then ships.
 *
 * These are DOMAIN-FREE fixture material. Anything that drives a filter chip
 * or the API contract (specialities, categories, record types) lives in
 * `@models` instead — see the note in each factory.
 */

export const FIRST_NAMES = [
  'Aarav',
  'Aditi',
  'Ananya',
  'Arjun',
  'Asha',
  'Bhavna',
  'Chetan',
  'Deepa',
  'Devendra',
  'Divya',
  'Gaurav',
  'Harsha',
  'Indira',
  'Ishaan',
  'Jyoti',
  'Kavita',
  'Kiran',
  'Lakshmi',
  'Madhav',
  'Meera',
  'Mohan',
  'Nandini',
  'Neeraj',
  'Nikhil',
  'Padma',
  'Pooja',
  'Prakash',
  'Priya',
  'Radha',
  'Rajesh',
  'Rakesh',
  'Ramesh',
  'Rekha',
  'Rohan',
  'Sanjay',
  'Saraswati',
  'Shalini',
  'Shankar',
  'Shreya',
  'Sneha',
  'Sunita',
  'Suresh',
  'Tara',
  'Uma',
  'Vandana',
  'Varun',
  'Vidya',
  'Vikram',
  'Vishal',
  'Yamini',
] as const;

export const SURNAMES = [
  'Agarwal',
  'Bhatt',
  'Chandra',
  'Chauhan',
  'Desai',
  'Deshmukh',
  'Dixit',
  'Gupta',
  'Iyer',
  'Jain',
  'Joshi',
  'Kapoor',
  'Kaur',
  'Khanna',
  'Kulkarni',
  'Menon',
  'Mehta',
  'Mishra',
  'Nair',
  'Nayak',
  'Patel',
  'Pillai',
  'Prasad',
  'Rao',
  'Reddy',
  'Sharma',
  'Shetty',
  'Shukla',
  'Singh',
  'Sinha',
  'Trivedi',
  'Varma',
  'Verma',
  'Yadav',
] as const;

/** Ayurvedic qualifications, in rough order of seniority. */
export const QUALIFICATIONS = [
  'BAMS',
  'MD (Ayurveda)',
  'MS (Ayurveda)',
  'PhD (Ayurveda)',
  'Diploma in Panchakarma',
  'Certificate in Nadi Pariksha',
  'PG Diploma in Yoga',
] as const;

export const CLINIC_SUFFIXES = [
  'Ayurveda Kendra',
  'Wellness Centre',
  'Panchakarma Clinic',
  'Ayurvedic Hospital',
  'Health Sansthan',
  'Arogya Clinic',
] as const;

export const INDIAN_STATES = [
  'Maharashtra',
  'Delhi',
  'Karnataka',
  'Tamil Nadu',
  'Telangana',
  'West Bengal',
  'Gujarat',
  'Rajasthan',
  'Kerala',
  'Uttar Pradesh',
] as const;

/** Phrases used to build believable doctor bios. */
export const BIO_FOCUS = [
  'chronic digestive disorders',
  'stress and sleep management',
  'post-natal recovery',
  'joint and spine care',
  'skin conditions',
  'respiratory wellness',
  'metabolic health',
  'preventive lifestyle medicine',
] as const;

/* ---- Product vocabulary ------------------------------------------------ */

/** Marketing prefixes that make catalogue names feel like a real shelf. */
export const PRODUCT_PREFIXES = [
  'Amrutam',
  'Classic',
  'Pure',
  'Gold',
  'Daily',
  'Advanced',
  'Herbal',
] as const;

export const PRODUCT_BENEFITS = [
  'supports healthy digestion',
  'promotes restful sleep',
  'helps maintain joint comfort',
  'supports natural immunity',
  'nourishes skin and hair',
  'aids respiratory comfort',
  'supports balanced energy',
  'helps manage everyday stress',
] as const;

/** Variant sizes per preparation form — a churna is sold by weight, a tablet
 *  by count. Getting this right is what makes the catalogue read as real. */
export const VARIANT_LABELS: Record<string, readonly string[]> = {
  Churna: ['50 g', '100 g', '200 g'],
  Tablet: ['30 tablets', '60 tablets', '120 tablets'],
  Capsule: ['30 capsules', '60 capsules', '90 capsules'],
  Syrup: ['100 ml', '200 ml', '450 ml'],
  Oil: ['100 ml', '200 ml', '500 ml'],
  Ghrita: ['150 g', '300 g'],
  Kadha: ['100 ml', '200 ml'],
  Lehyam: ['250 g', '500 g'],
};

/* ---- Health record vocabulary ------------------------------------------ */

export const LAB_PANELS = [
  'Complete Blood Count',
  'Lipid Profile',
  'Liver Function Test',
  'Thyroid Profile',
  'HbA1c',
  'Vitamin D',
  'Vitamin B12',
] as const;

export const IMAGING_STUDIES = [
  'Chest X-Ray',
  'Abdominal Ultrasound',
  'Knee MRI',
  'Spine X-Ray',
] as const;

export const VACCINES = [
  'Influenza',
  'Hepatitis B',
  'Tetanus booster',
  'Typhoid',
] as const;

export const CONSULTATION_NOTE_TOPICS = [
  'Follow-up review',
  'Initial assessment',
  'Diet and lifestyle plan',
  'Panchakarma progress review',
  'Seasonal regimen guidance',
] as const;
