/**
 * Mock HealthRecordRepository.
 *
 * `create` and `archive` mutate an in-memory overlay rather than the generated
 * dataset. WHY an overlay instead of writing into the fixtures: the dataset is
 * deterministic and memoised, and mutating it would make "the same seed
 * produces the same data" false the moment a test created a record. The
 * overlay is cleared by `resetMockHealthRecords()`, which keeps test cases
 * independent.
 *
 * Note the contract has no `delete` — medical records are archived under a
 * retention policy, never removed on a tap. See `repositories/contracts.ts`.
 */

import { ApiError } from '@api/errors';
import type { RequestOptions } from '@app-types/api.types';
import type { HealthRecord } from '@models';
import type {
  CreateHealthRecordInput,
  HealthRecordFilters,
  HealthRecordRepository,
} from '@repositories/contracts';

import { healthRecordDataset } from '../data';
import { withLatency } from '../mockUtils';
import { runQuery } from '../query';

/** Records created during this session, newest first. */
let createdRecords: HealthRecord[] = [];
/** Ids hidden by `archive`. */
let archivedIds = new Set<string>();
let createdCounter = 0;

/** Test-only. Restores the repository to pure generated data. */
export function resetMockHealthRecords(): void {
  createdRecords = [];
  archivedIds = new Set<string>();
  createdCounter = 0;
}

const searchableFields = (record: HealthRecord): Array<string | undefined> => [
  record.title,
  record.type,
  record.notes,
  record.author?.name,
];

export class MockHealthRecordRepository implements HealthRecordRepository {
  async findById(id: string, _options?: RequestOptions): Promise<HealthRecord> {
    const record = this.resolve(id);

    if (record === undefined) {
      throw new ApiError({
        kind: 'notFound',
        message: `Record ${id} was not found`,
        status: 404,
      });
    }

    return withLatency(record, 120);
  }

  async list(filters: HealthRecordFilters, _options?: RequestOptions) {
    const fromMs =
      filters.from === undefined ? undefined : Date.parse(filters.from);
    const toMs = filters.to === undefined ? undefined : Date.parse(filters.to);

    const result = runQuery<HealthRecord, HealthRecordFilters>({
      items: this.visibleRecords(),
      filters,
      searchableFields,
      predicates: [
        filters.patientId === undefined
          ? undefined
          : record => record.patientId === filters.patientId,

        filters.types === undefined || filters.types.length === 0
          ? undefined
          : record => filters.types!.includes(record.type),

        fromMs === undefined
          ? undefined
          : record => Date.parse(record.recordedAt) >= fromMs,

        toMs === undefined
          ? undefined
          : record => Date.parse(record.recordedAt) <= toMs,
      ],
    });

    return withLatency(result, 240);
  }

  async create(
    input: CreateHealthRecordInput,
    _options?: RequestOptions,
  ): Promise<HealthRecord> {
    const now = new Date().toISOString();
    createdCounter += 1;

    const record: HealthRecord = {
      id: `record-created-${createdCounter}`,
      createdAt: now,
      updatedAt: now,
      patientId: input.patientId,
      type: input.type,
      title: input.title,
      recordedAt: input.recordedAt,
      // Anything the user creates is self-reported by definition.
      source: 'self',
      ...(input.notes === undefined ? {} : { notes: input.notes }),
      // Attachment ids are accepted but not resolved: uploads are a separate
      // endpoint, and inventing binary payloads here would prove nothing.
      attachments: [],
    };

    createdRecords = [record, ...createdRecords];
    return withLatency(record, 200);
  }

  async archive(recordId: string, _options?: RequestOptions): Promise<void> {
    if (this.resolve(recordId) === undefined) {
      throw new ApiError({
        kind: 'notFound',
        message: `Record ${recordId} was not found`,
        status: 404,
      });
    }

    archivedIds.add(recordId);
    await withLatency(undefined, 150);
  }

  /** Session-created records first, then generated ones, minus archived. */
  private visibleRecords(): readonly HealthRecord[] {
    const generated = healthRecordDataset.all();

    if (createdRecords.length === 0 && archivedIds.size === 0) {
      return generated;
    }

    return [...createdRecords, ...generated].filter(
      record => !archivedIds.has(record.id),
    );
  }

  private resolve(id: string): HealthRecord | undefined {
    if (archivedIds.has(id)) {
      return undefined;
    }

    const created = createdRecords.find(record => record.id === id);
    // O(1) for generated records — the id encodes the index.
    return created ?? healthRecordDataset.byId(id);
  }
}

export const mockHealthRecordRepository = new MockHealthRecordRepository();
