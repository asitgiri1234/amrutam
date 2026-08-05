/**
 * The data layer is types-only, so there is almost nothing to unit-test — and
 * a test that just re-asserts a type is noise.
 *
 * What IS worth pinning is the handful of runtime `as const` vocabularies the
 * UI and the API contract both depend on, plus the two conventions that are
 * easy to violate silently:
 *
 *   - money in minor units, never floats
 *   - every entity round-trips through JSON unchanged, because these cross the
 *     network, the disk cache and the offline queue
 *
 * The compile-time assertions below are the actual guard for the shapes; they
 * fail the build, not the suite.
 */

import { formatCurrency } from '@utils/formatter';

import {
  ATTACHMENT_TYPES,
  BOOKING_STATUSES,
  CONSULTATION_MODES,
  LANGUAGES,
  PAYMENT_STATUSES,
  PRODUCT_CATEGORIES,
  PRODUCT_FORMS,
  RECORD_SOURCES,
  RECORD_TYPES,
  SPECIALITIES,
  STOCK_STATUSES,
  VITAL_METRICS,
  type Booking,
  type CartItem,
  type Doctor,
  type HealthRecord,
  type Money,
  type Product,
} from './index';

describe('domain vocabulary', () => {
  it.each([
    ['SPECIALITIES', SPECIALITIES],
    ['CONSULTATION_MODES', CONSULTATION_MODES],
    ['LANGUAGES', LANGUAGES],
    ['PRODUCT_CATEGORIES', PRODUCT_CATEGORIES],
    ['PRODUCT_FORMS', PRODUCT_FORMS],
    ['STOCK_STATUSES', STOCK_STATUSES],
    ['RECORD_TYPES', RECORD_TYPES],
    ['RECORD_SOURCES', RECORD_SOURCES],
    ['ATTACHMENT_TYPES', ATTACHMENT_TYPES],
    ['BOOKING_STATUSES', BOOKING_STATUSES],
    ['PAYMENT_STATUSES', PAYMENT_STATUSES],
  ])('%s is non-empty and has no duplicates', (_name, values) => {
    expect(values.length).toBeGreaterThan(0);
    expect(new Set(values).size).toBe(values.length);
  });

  it('exposes a unit for every chartable vital', () => {
    for (const metric of VITAL_METRICS) {
      expect(metric.unit.length).toBeGreaterThan(0);
      expect(metric.label.length).toBeGreaterThan(0);
    }

    const keys = VITAL_METRICS.map(metric => metric.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('Money convention', () => {
  it('is interpreted as minor units by the shared formatter', () => {
    const price: Money = { amountMinor: 149_900, currency: 'INR' };

    // 149900 paise === ₹1,499.00 — not ₹149,900.
    expect(formatCurrency(price.amountMinor)).toContain('1,499');
  });

  it('keeps whole amounts exact, which floating-point rupees would not', () => {
    const line: Money = { amountMinor: 10, currency: 'INR' };
    const other: Money = { amountMinor: 20, currency: 'INR' };

    // The reason the convention exists: 0.1 + 0.2 !== 0.3.
    expect(line.amountMinor + other.amountMinor).toBe(30);
  });
});

describe('entity serialisability', () => {
  // These cross the network, MMKV and the mutation queue. Anything that does
  // not survive a JSON round-trip (Date, Map, class instance) breaks all three.
  it('round-trips every core entity unchanged', () => {
    const doctor: Doctor = {
      id: 'doctor-00001',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      fullName: 'Dr. Vaidya Kumar',
      registrationNumber: 'AYUSH-12345',
      specialities: ['Panchakarma'],
      qualifications: ['BAMS'],
      experienceYears: 12,
      languages: ['Hindi', 'English'],
      consultationModes: ['video'],
      fees: { video: { amountMinor: 80_000, currency: 'INR' } },
      rating: { average: 4.6, count: 210 },
      isAcceptingPatients: true,
    };

    const product: Product = {
      id: 'product-00001',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      name: 'Ashwagandha Churna',
      slug: 'ashwagandha-churna',
      category: 'Sleep & Stress',
      form: 'Churna',
      shortDescription: 'Supports rest and recovery.',
      ingredients: ['Ashwagandha'],
      images: [],
      variants: [
        {
          id: 'variant-1',
          sku: 'ASH-100G',
          label: '100 g',
          price: { amountMinor: 34_900, currency: 'INR' },
          stockStatus: 'inStock',
        },
      ],
      rating: { average: 4.2, count: 87 },
      isPrescriptionRequired: false,
      tags: ['bestseller'],
    };

    const cartItem: CartItem = {
      id: 'line-1',
      productId: product.id,
      variantId: 'variant-1',
      quantity: 2,
      unitPriceSnapshot: { amountMinor: 34_900, currency: 'INR' },
      addedAt: '2026-08-05T10:00:00.000Z',
    };

    const booking: Booking = {
      id: 'booking-00001',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      patientId: 'patient-1',
      doctor: { doctorId: doctor.id, doctorName: doctor.fullName },
      slotId: 'slot-1',
      startsAt: '2026-08-06T09:00:00.000Z',
      endsAt: '2026-08-06T09:30:00.000Z',
      timeZone: 'Asia/Kolkata',
      mode: 'video',
      status: 'confirmed',
      paymentStatus: 'paid',
      fee: { amountMinor: 80_000, currency: 'INR' },
    };

    const record: HealthRecord = {
      id: 'record-00001',
      createdAt: '2026-08-06T10:00:00.000Z',
      updatedAt: '2026-08-06T10:00:00.000Z',
      patientId: 'patient-1',
      type: 'prescription',
      title: 'Consultation prescription',
      recordedAt: '2026-08-06T09:30:00.000Z',
      source: 'doctor',
      attachments: [],
      bookingId: booking.id,
    };

    for (const entity of [doctor, product, cartItem, booking, record]) {
      expect(JSON.parse(JSON.stringify(entity))).toEqual(entity);
    }
  });
});
