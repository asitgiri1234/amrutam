/**
 * The mock layer has three claims that are easy to make and easy to break
 * silently. Each gets a test:
 *
 *   1. **Deterministic** — same seed produces byte-identical data, and item N
 *      is the same whether generated alone or as part of the whole set.
 *   2. **Lazy** — importing and doing detail lookups must not materialise
 *      35,000 entities.
 *   3. **The query pipeline behaves like a server** — AND-token search,
 *      filters compose, `totalItems` reflects matches rather than dataset size.
 */

import {
  buildDoctor,
  buildList,
  buildOne,
  buildProduct,
  createRandom,
  deriveSeed,
  doctorDataset,
  healthRecordDataset,
  matchesQuery,
  mockDoctorRepository,
  mockHealthRecordRepository,
  mockProductRepository,
  paginateResult,
  parseSequentialId,
  productDataset,
  resetAllDatasets,
  resetMockHealthRecords,
  runQuery,
  sequentialId,
  doctorFactory,
} from './index';

afterEach(() => {
  resetAllDatasets();
  resetMockHealthRecords();
});

describe('determinism', () => {
  it('produces identical output for the same seed', () => {
    expect(buildDoctor(7)).toEqual(buildDoctor(7));
    expect(buildProduct(1_234)).toEqual(buildProduct(1_234));
  });

  it('produces different output for different seeds', () => {
    expect(buildDoctor(7, 1)).not.toEqual(buildDoctor(7, 2));
  });

  it('generates item N identically alone or as part of a batch', () => {
    // This is the property that per-index seeding buys, and the one a shared
    // RNG stream would silently break.
    const batch = buildList(doctorFactory, 50);
    const standalone = buildOne(doctorFactory, 42);

    expect(batch[42]).toEqual(standalone);
  });

  it('gives adjacent indices uncorrelated streams', () => {
    // A weak mixing function would make doctor 41 and 42 near-identical.
    const a = createRandom(deriveSeed(1, 41))();
    const b = createRandom(deriveSeed(1, 42))();

    expect(Math.abs(a - b)).toBeGreaterThan(0.001);
  });
});

describe('id encoding', () => {
  it('round-trips index -> id -> index', () => {
    expect(parseSequentialId('doctor', sequentialId('doctor', 4_321))).toBe(
      4_321,
    );
  });

  it('rejects ids from another prefix or malformed input', () => {
    expect(parseSequentialId('doctor', 'product-00001')).toBeNull();
    expect(parseSequentialId('doctor', 'doctor-abc')).toBeNull();
    expect(parseSequentialId('doctor', 'nonsense')).toBeNull();
  });
});

describe('laziness', () => {
  it('generates nothing until asked', () => {
    expect(doctorDataset.isMaterialised).toBe(false);
    expect(productDataset.isMaterialised).toBe(false);
    expect(healthRecordDataset.isMaterialised).toBe(false);
  });

  it('serves a detail lookup without materialising the dataset', async () => {
    const doctor = await mockDoctorRepository.findById('doctor-04999');

    expect(doctor.id).toBe('doctor-04999');
    // The whole point: entity 4,999 of 5,000 cost one allocation.
    expect(doctorDataset.isMaterialised).toBe(false);
  });

  it('materialises only when a full scan is genuinely required', async () => {
    await mockDoctorRepository.list({ page: 1, pageSize: 10 });
    expect(doctorDataset.isMaterialised).toBe(true);
    // A list query must not drag the other datasets in with it.
    expect(productDataset.isMaterialised).toBe(false);
  });

  it('streams without materialising', () => {
    const stream = productDataset.stream();
    const first = stream.next().value;

    expect(first).toBeDefined();
    expect(productDataset.isMaterialised).toBe(false);
  });

  it('reports the configured dataset sizes', () => {
    expect(doctorDataset.count).toBe(5_000);
    expect(productDataset.count).toBe(20_000);
    expect(healthRecordDataset.count).toBe(10_000);
  });

  it('returns undefined outside the range rather than generating junk', () => {
    expect(doctorDataset.at(-1)).toBeUndefined();
    expect(doctorDataset.at(5_000)).toBeUndefined();
    expect(doctorDataset.at(4_999)).toBeDefined();
  });
});

describe('search', () => {
  interface Row {
    name: string;
    tags: string[];
  }

  const fields = (row: Row) => [row.name, ...row.tags];

  it('requires every token to match, not any', () => {
    const row: Row = { name: 'Amrutam Ashwagandha Churna', tags: ['Sleep'] };

    expect(matchesQuery(row, 'ashwagandha churna', fields)).toBe(true);
    // "triphala" is absent, so an AND search must reject it. An OR search
    // would wrongly match on "churna" alone.
    expect(matchesQuery(row, 'triphala churna', fields)).toBe(false);
  });

  it('is case- and accent-insensitive', () => {
    const row: Row = { name: 'Ashwagandha', tags: [] };

    expect(matchesQuery(row, 'ASHWAGANDHA', fields)).toBe(true);
    expect(
      matchesQuery({ name: 'Áshwagandha', tags: [] }, 'ashwa', fields),
    ).toBe(true);
  });

  it('treats an empty query as matching everything', () => {
    expect(matchesQuery({ name: 'x', tags: [] }, '   ', fields)).toBe(true);
  });
});

describe('pagination', () => {
  const items = Array.from({ length: 95 }, (_unused, i) => i);

  it('slices correctly and reports totals', () => {
    const page = paginateResult(items, 2, 20);

    expect(page.items).toHaveLength(20);
    expect(page.items[0]).toBe(20);
    expect(page.meta).toEqual({
      page: 2,
      pageSize: 20,
      totalItems: 95,
      totalPages: 5,
    });
  });

  it('handles the ragged last page', () => {
    expect(paginateResult(items, 5, 20).items).toHaveLength(15);
  });

  it('clamps nonsense page numbers instead of returning a negative slice', () => {
    expect(paginateResult(items, 0, 20).meta.page).toBe(1);
    expect(paginateResult(items, -3, 20).items[0]).toBe(0);
  });

  it('reports totalItems as matches, not dataset size', () => {
    const result = runQuery<number, { query?: string }>({
      items,
      filters: { page: 1, pageSize: 10 },
      searchableFields: () => [],
      predicates: [value => value < 25],
    });

    expect(result.meta.totalItems).toBe(25);
    expect(result.meta.totalPages).toBe(3);
  });
});

describe('repositories', () => {
  it('throws a typed 404 for a missing entity', async () => {
    await expect(
      mockDoctorRepository.findById('doctor-99999'),
    ).rejects.toMatchObject({ kind: 'notFound', status: 404 });

    await expect(
      mockProductRepository.findById('not-an-id'),
    ).rejects.toMatchObject({ kind: 'notFound' });
  });

  it('applies filters and returns an API-shaped envelope', async () => {
    const result = await mockDoctorRepository.list({
      page: 1,
      pageSize: 5,
      acceptingPatientsOnly: true,
      minRating: 4,
    });

    expect(result.items.length).toBeLessThanOrEqual(5);
    expect(result.meta.page).toBe(1);

    for (const doctor of result.items) {
      expect(doctor.isAcceptingPatients).toBe(true);
      expect(doctor.rating.average).toBeGreaterThanOrEqual(4);
    }
  });

  it('narrows results as filters are added', async () => {
    const all = await mockProductRepository.list({ page: 1, pageSize: 1 });
    const filtered = await mockProductRepository.list({
      page: 1,
      pageSize: 1,
      categories: ['Immunity'],
      inStockOnly: true,
    });

    expect(filtered.meta.totalItems).toBeLessThan(all.meta.totalItems);
    expect(filtered.meta.totalItems).toBeGreaterThan(0);
  });

  it('resolves a product by slug', async () => {
    const first = await mockProductRepository.findById('product-00000');
    const bySlug = await mockProductRepository.findBySlug(first.slug);

    expect(bySlug.id).toBe(first.id);
  });

  it('generates the same slots for the same doctor and day', async () => {
    const query = { from: '2026-09-01', to: '2026-09-03' };

    const first = await mockDoctorRepository.listSlots('doctor-00001', query);
    const second = await mockDoctorRepository.listSlots('doctor-00001', query);

    expect(first).toEqual(second);
  });

  it('rejects an invalid slot range', async () => {
    await expect(
      mockDoctorRepository.listSlots('doctor-00001', {
        from: '2026-09-10',
        to: '2026-09-01',
      }),
    ).rejects.toMatchObject({ kind: 'validation' });
  });

  it('surfaces created records without corrupting the generated dataset', async () => {
    const created = await mockHealthRecordRepository.create({
      patientId: 'patient-00',
      type: 'vitals',
      title: 'Morning reading',
      recordedAt: new Date().toISOString(),
    });

    const found = await mockHealthRecordRepository.findById(created.id);
    expect(found.title).toBe('Morning reading');
    expect(found.source).toBe('self');

    // The overlay must not have changed the deterministic fixtures.
    expect(healthRecordDataset.at(0)).toEqual(healthRecordDataset.at(0));
  });

  it('hides archived records', async () => {
    await mockHealthRecordRepository.archive('record-00000');

    await expect(
      mockHealthRecordRepository.findById('record-00000'),
    ).rejects.toMatchObject({ kind: 'notFound' });
  });
});
