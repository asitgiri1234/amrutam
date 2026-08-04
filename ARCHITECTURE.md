# Architecture

Why this codebase is shaped the way it is, what it cost, and what to build next.

---

## 1. The one decision everything else follows from

**Server state and client state are different things and get different tools.**

- **Server state** — doctors, products, orders, records. Owned by React Query.
  It needs caching, deduplication, background revalidation, retry, and garbage
  collection. All four of those are hard, and React Query already does them.
- **Client state** — session status, a booking draft, a local cart, UI flags.
  Owned by Zustand. Small, synchronous, selector-subscribed.

Teams that blur this line copy fetched data into their store, and from that day
on every bug is "which copy is right?". Each of the five store files states
explicitly what must _not_ go in it, so the rule survives onboarding.

Everything else — the repository layer, the offline design, the provider order —
is downstream of taking that split seriously.

## 2. Layering

```
        screens / modules          ← feature code, may import anything below
              ↓
    components  ·  navigation      ← app-aware composition
              ↓
        design-system              ← primitives, zero app knowledge
              ↓
  hooks · providers · contexts     ← React-level plumbing
              ↓
 repositories → api → storage      ← data
              ↓
  offline · queue · services       ← infrastructure
              ↓
   utils · constants · types       ← pure, depends on almost nothing
              ↓
            theme                  ← design contract
```

Dependencies point **downward only**, enforced by ESLint's `no-restricted-imports`
rather than by review discipline. `app/` is the single exception: it is the
composition root and may know about everything, which is why it is only about
forty lines.

This is what makes the pieces independently testable. A repository test needs no
network; a design-system test needs no navigation; a queue test needs no React.

## 3. Decisions worth defending

**Feature modules, not folder-by-type.** `screens/`, `hooks/`, `components/` at
the top level works until the third feature. After that, one change touches six
folders and two engineers collide in the same directory every week.
`modules/consultation/` keeps a feature's screens, hooks, repository and store
slice together, so one team owns one folder and a feature can be deleted — or
lazily loaded — in a single move. The [module contract](./src/modules/README.md)
specifies the shape.

**A repository layer between screens and HTTP.** It looks like ceremony until
the first time a doctor profile has to come from cache instead of the network.
With repositories, that is one file. Without them, it is every screen. It also
means the wire shape and the domain shape can differ, so a backend field rename
has a blast radius of one file.

**Semantic colour tokens, not a palette.** Components consume `primary` and
`danger`, never `green500`. `ThemeColors` is an interface both themes implement,
so adding a colour role forces dark mode to keep up — light/dark parity is a
compile-time guarantee, not a QA task. `react-native/no-color-literals` is an
error, so the rule cannot erode.

**Errors normalised at the transport boundary.** axios throws four structurally
different things. Every one becomes an `ApiError` with a `kind` that maps
directly onto a UI decision (`offline` → retry banner, `validation` → field
errors, `notFound` → navigate away). Without this, every screen grows its own
slightly-wrong `err?.response?.data?.message ?? …`.

**Reads and writes are separate subsystems.** `offline/` handles reads (cache,
connectivity, sync); `queue/` handles writes. They are split because their
failure semantics have nothing in common: a failed read can be retried freely
and dropped safely, while a failed write may have partially succeeded, must
survive an app kill, and often must preserve order. Queued writes carry a
mandatory idempotency key — a replayed POST without one can double-charge a
customer.

**MMKV, not AsyncStorage.** Synchronous reads mean the theme, the session and
the queue are all readable during module init. No `await` before first paint,
so no flash of the wrong theme and no flash of a logged-out shell. Storage sits
behind a port with a real second (in-memory) implementation, so tests need no
native runtime.

**Three storage buckets** (`app` / `cache` / `secure`). This makes "clear the
cache" and "log the user out" independent, safe operations, instead of two
routines that must each remember to skip the other's keys.

**A redacting logger, not `console.log`.** This is a health app. Device logs are
readable by other tooling on a rooted phone. `utils/logger` strips tokens,
diagnoses and prescriptions from anything logged, gates by level so production
pays nothing, and provides one seam for crash-reporting breadcrumbs.

**Provider order is documented, not incidental.** GestureHandlerRootView must be
outermost or nested gestures die on Android; ThemeProvider must sit above the
ErrorBoundary or the crash screen renders unstyled. Getting this wrong produces
bugs that look unrelated to providers, so the reasoning lives in a comment in
`AppProviders.tsx`.

## 4. Trade-offs taken knowingly

| Choice                                | Cost                                                       | Why it is still right                                                                                                    |
| ------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 26 path aliases                       | Must stay in sync across tsconfig, Babel and Jest          | Deep relative paths break on every file move; the sync cost is one-time, refactor pain is forever                        |
| `noUncheckedIndexedAccess`            | Extra `?? fallback` at array/record access                 | Catches the exact class of crash that only appears with real data volume                                                 |
| Repository + API split                | One more layer for a simple GET                            | Pays for itself the first time caching, mocking or a field rename arrives                                                |
| `--max-warnings=0`                    | Noisy rules must be turned off deliberately, with a reason | A warning nobody fixes trains people to ignore lint output entirely                                                      |
| Zustand over Redux                    | No time-travel devtools, less middleware ecosystem         | With React Query owning server state, there is little global state left; selector subscriptions keep re-renders surgical |
| Hand-rolled `debounce`/`throttle`     | Reimplementing solved problems                             | `cancel`/`flush` on unmount are required, and lodash is not worth its weight in a mobile bundle                          |
| Custom Reanimated Jest mock           | Must be extended when new Reanimated APIs are used         | Reanimated 4's own mock pulls in the native worklets module and cannot load under Node                                   |
| Empty stores and repositories shipped | Looks like dead code                                       | They are the contract. An empty file with a documented rule is cheaper than an unwritten convention                      |
| SVG icon registry over an icon font   | Adding an icon means adding path data                      | Typed names (a typo is a compile error), theme-driven colour, and only used icons reach the bundle                       |

## 5. Why this scales to a team

- **Parallel work without collisions.** Four modules, four folders, four owners.
  The shared layers are stable and boring by design.
- **Consistency is mechanical, not cultural.** A new engineer building the Shop
  screen makes zero visual decisions — `Screen`, `Card`, `Button` and the theme
  make them. The screen automatically matches one built by someone else last
  month.
- **Reviews are about behaviour.** Prettier owns formatting, ESLint owns
  layering and colour literals, TypeScript owns contracts. Reviewers spend their
  attention on logic.
- **Mistakes fail fast and locally.** Wrong route name, missing dark-mode
  colour, unhandled `undefined` from an array index, an import that inverts the
  layering — all compile or lint errors, not production bugs.
- **Onboarding is self-serve.** Every folder answers "why does this exist?" and
  "what must not go here?" in its own header. That is the documentation that
  actually gets read, because it is where people are already looking.
- **Vendors are replaceable.** Crash reporting, the storage engine and the auth
  provider are all injected behind interfaces. None is an import in a hundred
  files.

## 6. What to build next

**1 — Auth (blocks everything).**
Implement `AuthTokenProvider` and register it via `setAuthTokenProvider`; the
single-flight refresh is already written and waiting. Move the MMKV encryption
key into Keychain/Keystore — this is the first task, not a follow-up. Add the
auth stack to `RootStackParamList` and switch on `useAuthStore.status`.

**2 — Consultation module.**
Build this before Shop. It exercises search, filtering, pagination, a booking
flow with money, and offline reads — nearly every foundation capability at once.
Whatever gaps exist will surface here while they are still cheap to close. It
also produces the first concrete `BaseRepository` subclass, which becomes the
reference other modules copy.

**3 — Codegen for wire types.**
Point `openapi-typescript` at the backend spec, output to `src/generated/`. A
hand-written `interface Doctor` drifts silently the day a field is renamed; a
generated one turns that into a CI failure. Highest leverage per hour of any
item on this list.

**4 — Fill in the mock factories.**
The seeded generators exist. Once entity types are real, generate 10k doctors
and products and profile the lists — FlashList recycling, filter latency and
image loading only misbehave at volume.

**5 — React Query cache persistence.**
`enableOfflineCache` and `CacheManager` are in place; wire
`persistQueryClient` to the cache bucket so a cold start with no signal renders
real data instead of skeletons.

**6 — CI.**
GitHub Actions running `npm run verify` on every PR, plus a bundle-size check.
The gates already exist locally; CI stops them being optional.

**7 — Then Shop, then Health Records.**
Shop reuses Consultation's list and filter patterns and adds the cart, which is
the first real consumer of the mutation queue. Health Records comes last because
it carries the strictest data-handling requirements and benefits most from
patterns proven twice already.

Deferred until there is a reason: analytics, push notifications, i18n,
Storybook, E2E (Maestro/Detox). Each has a documented seam; none should be added
speculatively.
