# Amrutam

Production foundation for the Amrutam Ayurvedic super app — React Native 0.86,
TypeScript strict, offline-capable.

**This repository contains the foundation only.** Consultation, Shop and Health
Records are deliberately not implemented; each folder documents what belongs in
it and why. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the reasoning behind
every structural decision.

---

## Status

| Gate                    | Result                                                 |
| ----------------------- | ------------------------------------------------------ |
| `npm run typecheck`     | clean — TypeScript strict + `noUncheckedIndexedAccess` |
| `npm run lint`          | clean — zero warnings allowed                          |
| `npm test`              | 24 passing across 3 suites                             |
| Metro production bundle | builds, 2.62 MB (Android, `--dev false`)               |

All four tabs navigate, the design system renders in light and dark mode, and
the theme choice persists across restarts.

---

## Getting started

```bash
npm install
npm start                # Metro
npm run android          # or: npm run ios
```

iOS additionally needs pods:

```bash
cd ios && bundle install && bundle exec pod install && cd ..
```

Requires Node >= 22.11 (`.nvmrc` pins 22.13.0).

### Everyday commands

| Command                 | What it does                                               |
| ----------------------- | ---------------------------------------------------------- |
| `npm run verify`        | typecheck + lint + test. Run this before opening a PR.     |
| `npm run typecheck`     | `tsc --noEmit`                                             |
| `npm run lint` / `:fix` | ESLint, zero-warning policy                                |
| `npm run format`        | Prettier                                                   |
| `npm test` / `:watch`   | Jest                                                       |
| `npm run test:coverage` | Coverage report                                            |
| `npm run start:reset`   | Metro with a cleared cache (fixes most "module not found") |

### Environments

`APP_ENV` is inlined at build time by Babel, so the unused configs are
dead-code-eliminated from the bundle.

```bash
npm start                                   # development (default)
APP_ENV=staging npx react-native run-android --mode=release
APP_ENV=production npx react-native run-android --mode=release
```

Per-environment settings live in [`src/config/env/`](./src/config/env). Adding a
flag to `AppConfig` forces all three environments to define it — a missing
production value is a compile error, not a runtime surprise.

---

## Repository layout

```
src/
├── app/            Composition root — the ONLY layer that may know about every other
├── navigation/     Root stack + bottom tabs, typed param lists, deep linking
├── theme/          Design tokens, light/dark themes, the only place colours exist
├── design-system/  14 themed primitives with zero app knowledge
├── components/     App-level compositions (Screen, ErrorBoundary)
├── screens/        Shell screens (Settings, NotFound) + tab placeholders
├── modules/        Feature modules — EMPTY BY DESIGN
├── hooks/          Reusable stateful logic
├── store/          5 Zustand stores — empty, each documents what may NOT go in it
├── api/            Transport: axios, interceptors, error normalisation, React Query
├── repositories/   Domain data access — the contract; concrete repos ship with modules
├── services/       Cross-cutting capabilities (crash reporting)
├── storage/        MMKV + the storage port; app / cache / secure buckets
├── offline/        Disk cache, connectivity, sync coordinator
├── queue/          Durable mutation queue (writes are a different problem to reads)
├── providers/      Global providers + the documented nesting order
├── contexts/       Context *contracts*, kept apart from their providers
├── utils/          Pure helpers: logger, date, validation, formatter, network, …
├── constants/      Shared magic numbers, query-key namespaces
├── types/          Cross-layer types only — domain types live with their module
├── mocks/          Seeded generators for large fake datasets (no data yet)
├── generated/      Codegen output — never hand-edited
├── assets/         Fonts, images, source SVGs
└── tests/          Test infrastructure (tests themselves sit beside their code)
```

Every folder has a header comment or README explaining **why it exists** and,
just as importantly, **what must not go in it**.

---

## What is built

**Tooling** — TypeScript strict with `noUncheckedIndexedAccess`, ESLint with
enforced import layering and a no-inline-colours rule, Prettier, Husky
(pre-commit lint-staged, pre-push typecheck + tests), 26 path aliases kept in
sync across TypeScript, Babel and Jest.

**Theme** — light and dark themes over a shared token set (palette, spacing,
radius, typography, elevation, motion, opacity). `ThemeColors` is an interface
both themes must satisfy, so dark mode cannot fall behind light mode. Preference
persists to MMKV and is read synchronously, so there is no wrong-theme flash on
cold start.

**Design system** — Button, Card, Typography, TextField, SearchBar, FilterChip,
Avatar, Divider, Loader, Modal, Toast, EmptyState, ErrorState, Skeleton, plus a
typed SVG Icon registry. All theme-driven; press feedback and shimmer run on the
UI thread via Reanimated.

**Navigation** — root native stack wrapping bottom tabs (Consultation, Shop,
Health Records, Settings), fully typed param lists, deep linking, an imperative
navigation ref, and screen-change analytics hooks.

**Data** — axios instance with logging, retry (idempotent methods only) and
single-flight token-refresh interceptors; every failure normalised to one
`ApiError` with a `kind` that maps onto a UI decision; a generic `HttpClient`
that unwraps the API envelope; React Query wired to real connectivity and app
state.

**Offline** — TTL'd disk cache, a single honest connectivity source, a sync
coordinator, and a separate durable mutation queue with idempotency keys,
per-scope ordering, exponential backoff and dead-lettering.

**Error handling** — ErrorBoundary with reset keys, a themed fallback screen,
and a global handler covering unhandled rejections and native exceptions, all
routed through a redacting logger.

## What is deliberately not built

The three product modules, concrete repositories and endpoints, mock datasets
(the generators exist; no data is generated), auth, and any codegen. Each has a
documented placeholder rather than a guess.

---

## Contributing

1. `npm run verify` must pass. Husky enforces it on push.
2. No colour literals outside `theme/`. ESLint fails the build.
3. Server state belongs to React Query; client state to Zustand. Never copy one
   into the other.
4. Dependencies point downward. Foundation layers may not import from
   `screens/` or `modules/`; ESLint enforces this.
5. New feature work goes in `src/modules/<feature>/` — see
   [the module contract](./src/modules/README.md).
