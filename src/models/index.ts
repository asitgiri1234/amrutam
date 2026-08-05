/**
 * WHY `models/` exists — and how it squares with the rule in `modules/README.md`
 * that domain types belong to their module:
 *
 * That rule still holds, with a refinement this milestone forced. There are two
 * different kinds of "domain type":
 *
 *   **Core entities** (here). The nouns the *data layer* traffics in, that more
 *   than one module legitimately needs. A Booking references a Doctor; a
 *   CartItem references a Product; a prescription is a HealthRecord produced by
 *   a Booking. Putting Doctor inside `modules/consultation/` would force
 *   `modules/health/` to import from a sibling module to render "prescribed
 *   by", which is precisely the cross-module coupling the folder rule exists to
 *   prevent. Shared entities in a shared, dependency-free layer are the fix.
 *
 *   **Module shapes** (still local). View models, form payloads, filter state,
 *   screen props, wizard steps. `BookingDraft` belongs to the Consultation
 *   module; `Booking` belongs here.
 *
 * The test: if the API returns it and two modules read it, it is a core entity.
 * If it only exists to serve one module's screens, it stays in that module.
 *
 * Constraints on this folder:
 *   - Types and `as const` vocabulary only. No functions, no classes, no
 *     React, no imports outside `@app-types`.
 *   - Everything must survive `JSON.parse(JSON.stringify(x))` unchanged, since
 *     these cross the network, the disk cache and the offline queue.
 */

export * from './common.model';
export * from './doctor.model';
export * from './product.model';
export * from './healthRecord.model';
export * from './cart.model';
export * from './booking.model';
