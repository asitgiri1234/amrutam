/**
 * Endpoint registry.
 *
 * WHY a registry of path *builders* rather than strings sprinkled through
 * repositories: it makes the API surface of the whole app greppable in one
 * file, it makes a versioning change (`/v1` -> `/v2`) mechanical, and it makes
 * path parameters type-checked instead of template-literal guesswork.
 *
 * INTENTIONALLY EMPTY. The foundation milestone does not implement endpoints —
 * each module adds its own namespace here when it lands, following the shape
 * shown below.
 *
 * @example
 * export const Endpoints = {
 *   consultation: {
 *     doctors: () => '/doctors',
 *     doctor: (id: string) => `/doctors/${id}`,
 *     slots: (doctorId: string) => `/doctors/${doctorId}/slots`,
 *   },
 * } as const;
 */

export const Endpoints = {
  /** Health check — the one endpoint the foundation legitimately needs, used
   *  by the connectivity/sync layer to distinguish "no internet" from
   *  "our API is down". */
  system: {
    health: () => '/health',
  },

  consultation: {
    doctors: () => '/doctors',
    doctor: (doctorId: string) => `/doctors/${doctorId}`,
    /** Slots are their own resource: they change by the minute and are queried
     *  by date range, so bundling them into the profile would make it
     *  uncacheable. */
    doctorSlots: (doctorId: string) => `/doctors/${doctorId}/slots`,
  },
} as const;

export type EndpointGroup = keyof typeof Endpoints;
