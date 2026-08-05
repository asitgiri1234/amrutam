/**
 * Entity repository CONTRACTS. Interfaces only — no implementation, by design.
 *
 * WHY the contracts land before the implementations:
 *
 *   1. **They are the seam modules will be built against.** A hook depends on
 *      `DoctorRepository`, not on a concrete class, so the module can be built
 *      and tested against a stub while the endpoints are still being specced.
 *   2. **They pin down the questions the API must answer.** Writing
 *      `listSlots(doctorId, params)` here surfaces that slots are a separate
 *      resource from the doctor — a decision better made now than discovered
 *      mid-sprint.
 *   3. **Capability composition stays visible.** `HealthRecordRepository` is
 *      not `Deletable`, and that is a deliberate statement about medical
 *      records, enforced by the type rather than by a code review comment.
 *
 * Each interface composes the small capability interfaces from `./types`.
 * Implementations arrive with their module and extend `BaseRepository`.
 */

import type { ListResult } from '@api/httpClient';
import type { RequestOptions, SortParam } from '@app-types/api.types';
import type {
  Booking,
  Cart,
  CartItem,
  ConsultationMode,
  Doctor,
  HealthRecord,
  IsoDate,
  Language,
  Product,
  ProductCategory,
  ProductForm,
  RecordType,
  Speciality,
  TimeSlot,
} from '@models';
import type { OffsetPageParams } from '@utils/pagination';

import type { Creatable, Listable, Readable, Updatable } from './types';

/* ---- Shared filter shape ----------------------------------------------
 * Every list filter carries paging and an optional free-text query, so the
 * repositories stay uniform and a generic list hook can be written once. */

export interface BaseFilters extends OffsetPageParams {
  /** Free-text search. Debounced by `SearchBar` before it reaches here. */
  query?: string;
  sort?: SortParam;
}

/* ---- Doctor ------------------------------------------------------------ */

export interface DoctorFilters extends BaseFilters {
  specialities?: Speciality[];
  modes?: ConsultationMode[];
  languages?: Language[];
  city?: string;
  minRating?: number;
  /** Inclusive fee ceiling, in minor units — see `Money`. */
  maxFeeMinor?: number;
  /**
   * Experience bracket, in whole years. Two open-ended bounds rather than a
   * named bracket enum: the UI's brackets ("5–10 years") are a presentation
   * choice that will change with the design, and baking them into the wire
   * contract would make every rebracketing an API change.
   */
  minExperienceYears?: number;
  maxExperienceYears?: number;
  availableOn?: IsoDate;
  acceptingPatientsOnly?: boolean;
}

export interface SlotQuery {
  from: IsoDate;
  to: IsoDate;
  mode?: ConsultationMode;
}

export interface DoctorRepository
  extends Readable<Doctor>,
    Listable<Doctor, DoctorFilters> {
  /**
   * Slots are a separate call rather than a field on Doctor: they change by
   * the minute and are queried by date range, so bundling them would make the
   * doctor profile uncacheable.
   */
  listSlots(
    doctorId: string,
    query: SlotQuery,
    options?: RequestOptions,
  ): Promise<TimeSlot[]>;
}

/* ---- Product ----------------------------------------------------------- */

export interface ProductFilters extends BaseFilters {
  categories?: ProductCategory[];
  forms?: ProductForm[];
  ingredients?: string[];
  minPriceMinor?: number;
  maxPriceMinor?: number;
  minRating?: number;
  inStockOnly?: boolean;
  prescriptionRequired?: boolean;
}

export interface ProductRepository
  extends Readable<Product>,
    Listable<Product, ProductFilters> {
  /** Resolves the deep-link/SEO form of a product URL. */
  findBySlug(slug: string, options?: RequestOptions): Promise<Product>;
  /** Cross-sell on the product detail screen. */
  listRelated(
    productId: string,
    options?: RequestOptions,
  ): Promise<ListResult<Product>>;
}

/* ---- Health record ------------------------------------------------------ */

export interface HealthRecordFilters extends BaseFilters {
  patientId?: string;
  types?: RecordType[];
  from?: IsoDate;
  to?: IsoDate;
}

export interface CreateHealthRecordInput {
  patientId: string;
  type: RecordType;
  title: string;
  recordedAt: string;
  notes?: string;
  /** Ids returned by a prior upload call — the record itself never carries
   *  binary payloads. */
  attachmentIds?: string[];
}

/**
 * Deliberately NOT `Deletable`. Medical records are retained under a policy,
 * not deleted on a user's tap; the module exposes an archive action instead.
 * Encoding that here means no screen can casually wire up a delete button.
 */
export interface HealthRecordRepository
  extends Readable<HealthRecord>,
    Listable<HealthRecord, HealthRecordFilters>,
    Creatable<HealthRecord, CreateHealthRecordInput> {
  archive(recordId: string, options?: RequestOptions): Promise<void>;
}

/* ---- Cart --------------------------------------------------------------- */

export interface AddCartItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

/**
 * The cart is a singleton per user, so it does not fit `Readable<T>`'s
 * id-based lookup — hence the bespoke `get()`. Mutations return the whole cart
 * because the server recomputes totals, and a partial response would let the
 * client hold a subtotal that disagrees with the line items.
 */
export interface CartRepository {
  get(options?: RequestOptions): Promise<Cart>;
  addItem(input: AddCartItemInput, options?: RequestOptions): Promise<Cart>;
  updateItem(
    lineId: string,
    input: UpdateCartItemInput,
    options?: RequestOptions,
  ): Promise<Cart>;
  removeItem(lineId: string, options?: RequestOptions): Promise<Cart>;
  clear(options?: RequestOptions): Promise<Cart>;
  /**
   * Pushes locally-created lines after an offline session and returns the
   * reconciled cart. The queue calls this; screens do not.
   */
  sync(items: CartItem[], options?: RequestOptions): Promise<Cart>;
}

/* ---- Booking ------------------------------------------------------------ */

export interface BookingFilters extends BaseFilters {
  statuses?: Booking['status'][];
  from?: IsoDate;
  to?: IsoDate;
  doctorId?: string;
}

export interface CreateBookingInput {
  doctorId: string;
  slotId: string;
  mode: ConsultationMode;
  patientNotes?: string;
}

export interface RescheduleBookingInput {
  slotId: string;
}

/**
 * `Creatable` here is the one place `RequestOptions.idempotencyKey` is
 * mandatory in practice rather than by convention: a replayed booking is a
 * double charge. The queue supplies the key; see `queue/queue.types.ts`.
 */
export interface BookingRepository
  extends Readable<Booking>,
    Listable<Booking, BookingFilters>,
    Creatable<Booking, CreateBookingInput>,
    Updatable<Booking, RescheduleBookingInput> {
  cancel(
    bookingId: string,
    reason: string,
    options?: RequestOptions,
  ): Promise<Booking>;
}
