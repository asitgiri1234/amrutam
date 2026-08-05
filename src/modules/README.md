# `modules/` — feature modules

**Empty by design.** Consultation, Shop and Health Records are explicitly out of
scope for the foundation milestone.

## Why this folder exists

A folder-by-type layout (`screens/`, `hooks/`, `components/`, `services/`)
works until roughly the third feature. After that, shipping one change means
touching six folders, two engineers editing the same `hooks/` directory collide
constantly, and nobody can tell what a feature actually consists of.

`modules/` is folder-by-feature. Everything one product area needs lives in one
directory, so:

- one team can own one folder
- a feature can be deleted, or lazily loaded, in a single move
- the import graph makes coupling visible — if `shop/` imports from
  `consultation/`, that shows up in a diff instead of hiding behind a shared
  `hooks/` folder

## Expected structure

Each module is self-contained and follows the same shape, so moving between
them costs nothing:

```
modules/
  consultation/
    api/            # endpoint definitions for this module only
    components/     # composed components used by this module only
    hooks/          # useDoctorList, useBookingDraft — React Query lives here
    navigation/     # ConsultationNavigator + its ParamList
    repositories/   # DoctorRepository extends BaseRepository<Doctor>
    screens/        # DoctorListScreen, DoctorDetailScreen, BookingScreen
    store/          # the module's slice of client state
    types/          # Doctor, Slot, Booking — owned here, not in src/types
    index.ts        # the module's PUBLIC surface — see below
```

## The rules

1. **A module exports only through `index.ts`.** Anything not exported there is
   private. Reaching into `modules/shop/hooks/useCart` from another module is a
   review-blocking change.
2. **Modules do not import each other's internals.** If two need the same
   thing, it moves down into a shared layer (`design-system/`, `utils/`,
   `components/`).
3. **Core entities are shared; module shapes are local.** This was refined when
   the data layer landed. `Doctor`, `Product`, `HealthRecord`, `CartItem` and
   `Booking` live in [`src/models/`](../models/index.ts), because a Booking
   references a Doctor and a prescription is a HealthRecord produced by a
   Booking — keeping `Doctor` inside `modules/consultation/` would force
   `modules/health/` to import from a sibling module, which is exactly the
   coupling these boundaries exist to prevent.

   Everything that only serves one module's screens — view models, form
   payloads, filter state, wizard steps — still lives in that module.
   `BookingDraft` is the Consultation module's; `Booking` is shared.

   The test: **if the API returns it and two modules read it, it is a core
   entity.** Otherwise it stays local.

4. **Server state is React Query; client state is the module's Zustand slice.**
   Never copy fetched data into the store.
5. **A module registers itself with the shell** — it adds its navigator to
   `MainTabParamList`, its query keys under the namespace in
   `constants/query.constants.ts`, and its sync tasks via `registerSyncTask`.
   It does not modify the shell's internals.

## Build order

Consultation first: it exercises search, filtering, pagination, a booking flow
with money, and offline reads — which is nearly every capability the foundation
provides. Whatever gaps exist in the foundation will surface there, while they
are still cheap to fix.
