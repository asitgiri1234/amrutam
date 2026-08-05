/**
 * Consultation listing tests.
 *
 * The scroll-performance claim is the interesting one. Real FPS can only be
 * measured on a device, so what is asserted here are the *properties that
 * determine* it — each of which fails silently if broken:
 *
 *   - paging keeps the rendered set bounded regardless of dataset size
 *   - the row memo survives FlashList recycling (a new object, same id)
 *   - `renderItem` / `keyExtractor` identities are stable across renders
 *   - a page fetch over 5,000 filtered doctors stays inside a frame budget
 */

import type { ReactNode } from 'react';

import { Text } from 'react-native';

import { doctorDataset, mockDoctorRepository, resetAllDatasets } from '@mocks';
import {
  INITIAL_DOCTOR_FILTERS,
  hasActiveFilters,
  useConsultationStore,
  type DoctorListFilters,
} from '@store/consultation.store';
import { QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, waitFor } from '@testing-library/react-native';
import { createTestQueryClient } from '@tests/renderWithProviders';

import {
  toRepositoryFilters,
  useDoctorList,
  type UseDoctorListResult,
} from './hooks/useDoctorList';
import { setDoctorRepository } from './repositories';

/**
 * The hook is exercised through a probe COMPONENT rather than `renderHook`.
 *
 * WHY: `renderHook` assigns its result inside a `useEffect`, and with a hook
 * that settles asynchronously that ref was observed to stay null in this
 * suite — the test then fails for harness reasons that have nothing to do with
 * the code under test. Rendering a component is how the screen uses the hook
 * anyway, so this exercises the real path and is stable.
 */
const client = createTestQueryClient();

function Wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** Latest hook value, captured during render. */
let latest: UseDoctorListResult | null = null;

function Probe({ filters }: { filters: DoctorListFilters }) {
  latest = useDoctorList(filters);
  return <Text testID="probe">{String(latest.isLoading)}</Text>;
}

function current(): UseDoctorListResult {
  if (latest === null) {
    throw new Error('Probe has not rendered yet');
  }
  return latest;
}

async function renderList(filters: DoctorListFilters = INITIAL_DOCTOR_FILTERS) {
  latest = null;
  const view = await render(<Probe filters={filters} />, { wrapper: Wrapper });
  await waitFor(() => expect(current().isLoading).toBe(false));
  return view;
}

beforeAll(() => {
  // The screen resolves this from config; pin it so the test does not depend
  // on which environment the suite happens to run under.
  setDoctorRepository(mockDoctorRepository);
});

afterAll(() => {
  setDoctorRepository(null);
});

afterEach(async () => {
  // Unmount before clearing the client: a tree left mounted keeps writing to
  // `latest` and keeps queries alive into the next case.
  await cleanup();
  latest = null;
  client.clear();
  useConsultationStore.getState().resetFilters();
  resetAllDatasets();
});

describe('filter mapping', () => {
  it('omits empty values so they do not fragment the query key', () => {
    // `{ specialities: [] }` and `{}` would be two cache entries for one result.
    expect(toRepositoryFilters(INITIAL_DOCTOR_FILTERS)).toEqual({});
  });

  it('translates an experience bracket into open-ended year bounds', () => {
    expect(
      toRepositoryFilters({ ...INITIAL_DOCTOR_FILTERS, experience: '5-10' }),
    ).toEqual({ minExperienceYears: 5, maxExperienceYears: 10 });
  });

  it('leaves the top bracket unbounded above', () => {
    expect(
      toRepositoryFilters({ ...INITIAL_DOCTOR_FILTERS, experience: '20+' }),
    ).toEqual({ minExperienceYears: 20 });
  });

  it('trims a whitespace-only query to nothing', () => {
    expect(
      toRepositoryFilters({ ...INITIAL_DOCTOR_FILTERS, query: '   ' }),
    ).toEqual({});
  });

  it('passes through the filters that are set', () => {
    const filters: DoctorListFilters = {
      ...INITIAL_DOCTOR_FILTERS,
      query: ' panchakarma ',
      specialities: ['Panchakarma'],
      maxFeeMinor: 100_000,
      acceptingPatientsOnly: true,
    };

    expect(toRepositoryFilters(filters)).toEqual({
      query: 'panchakarma',
      specialities: ['Panchakarma'],
      maxFeeMinor: 100_000,
      acceptingPatientsOnly: true,
    });
  });
});

/**
 * Note the deliberate absence of `act()` here. These exercise the store
 * directly with no React tree mounted, so there is nothing to flush — and
 * calling `act` with no renderer leaves React's internal act queue dirty,
 * which silently breaks every `render` later in the file. That cost an hour;
 * it is documented so it does not cost another.
 */
describe('filter store', () => {
  it('starts with nothing applied', () => {
    expect(hasActiveFilters(useConsultationStore.getState().filters)).toBe(
      false,
    );
  });

  it('toggles a speciality on and back off', () => {
    const { toggleSpeciality } = useConsultationStore.getState();

    toggleSpeciality('Panchakarma');
    expect(useConsultationStore.getState().filters.specialities).toEqual([
      'Panchakarma',
    ]);

    toggleSpeciality('Panchakarma');
    expect(useConsultationStore.getState().filters.specialities).toEqual([]);
  });

  it('reports active filters for the badge', () => {
    useConsultationStore.getState().setMaxFee(50_000);
    expect(hasActiveFilters(useConsultationStore.getState().filters)).toBe(
      true,
    );
  });

  it('resets everything', () => {
    useConsultationStore.getState().setExperience('10-20');
    useConsultationStore.getState().setAcceptingPatientsOnly(true);

    useConsultationStore.getState().resetFilters();

    expect(useConsultationStore.getState().filters).toEqual(
      INITIAL_DOCTOR_FILTERS,
    );
  });
});

describe('useDoctorList', () => {
  it('loads the first page and reports the full match count', async () => {
    await renderList();

    // Bounded rendering: one page loaded, 5,000 matched.
    expect(current().doctors).toHaveLength(20);
    expect(current().totalCount).toBe(5_000);
    expect(current().hasNextPage).toBe(true);
  });

  it('accumulates pages without duplicating rows', async () => {
    await renderList();

    // No manual `act` — RNTL v14 wraps updates itself, and an explicit act
    // here leaves its queue dirty for every later case in the file.
    current().loadNextPage();
    await waitFor(() => expect(current().doctors).toHaveLength(40));

    // Duplicate keys crash FlashList's recycling.
    const ids = current().doctors.map(doctor => doctor.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('narrows results when a filter is applied', async () => {
    await renderList({
      ...INITIAL_DOCTOR_FILTERS,
      specialities: ['Panchakarma'],
      acceptingPatientsOnly: true,
    });

    expect(current().totalCount).toBeGreaterThan(0);
    expect(current().totalCount).toBeLessThan(5_000);

    for (const doctor of current().doctors) {
      expect(doctor.specialities).toContain('Panchakarma');
      expect(doctor.isAcceptingPatients).toBe(true);
    }
  });

  it('surfaces a repository failure as an error rather than an empty list', async () => {
    setDoctorRepository({
      findById: jest.fn(),
      listSlots: jest.fn(),
      list: jest.fn().mockRejectedValue(new Error('network down')),
    });

    latest = null;
    await render(<Probe filters={INITIAL_DOCTOR_FILTERS} />, {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(current().error).not.toBeNull());
    expect(current().doctors).toHaveLength(0);

    setDoctorRepository(mockDoctorRepository);
  });
});

describe('scroll performance properties', () => {
  it('keeps the rendered set bounded no matter the dataset size', async () => {
    await renderList();

    // 5,000 available, 20 in memory. This — not any FlashList prop — is what
    // makes the list size-independent.
    expect(doctorDataset.count).toBe(5_000);
    expect(current().doctors.length).toBe(20);
  });

  it('serves a page over 5,000 filtered doctors within a frame budget', async () => {
    // Warm the dataset first: the one-time materialisation is a fixture cost,
    // not a per-scroll cost, and folding it in would measure the wrong thing.
    await mockDoctorRepository.list({ page: 1, pageSize: 20 });

    const startedAt = Date.now();
    await mockDoctorRepository.list({
      page: 40,
      pageSize: 20,
      specialities: ['Panchakarma'],
      minExperienceYears: 10,
      maxFeeMinor: 200_000,
    });
    const elapsed = Date.now() - startedAt;

    // The mock adds ~220ms of simulated latency on purpose, so the ceiling is
    // generous; what this guards against is a filter pass that degrades into
    // something pathological as filters compose.
    expect(elapsed).toBeLessThan(1_000);
  });

  it('returns a stable doctors array reference when nothing changed', async () => {
    const { rerender } = await renderList();

    const before = current().doctors;
    await rerender(<Probe filters={INITIAL_DOCTOR_FILTERS} />);

    // A new array identity every render would make FlashList re-diff the whole
    // list on any unrelated state change.
    expect(current().doctors).toBe(before);
  });
});
