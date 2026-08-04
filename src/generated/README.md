# `generated/` — machine-written code

**Nothing is generated yet.** This folder exists so that when code generation
arrives, there is exactly one place it can land.

## Why a dedicated folder

Generated code has different rules from handwritten code, and mixing the two is
how a repo ends up with someone hand-editing a file that gets overwritten on the
next build:

- **Never edit by hand.** Change the source (the OpenAPI spec, the SVG, the
  translation file) and re-run the generator.
- **Excluded from lint, formatting and typecheck.** See the `ignorePatterns` in
  `.eslintrc.js`, `.prettierignore` and the `exclude` in `tsconfig.json`. Style
  rules on generated output are noise that trains people to ignore lint errors.
- **Excluded from coverage.** `jest.config.js` drops it from
  `collectCoverageFrom` — generated code inflates the number and hides real
  gaps.

## What is expected to land here

| Source                | Generator                    | Output                       |
| --------------------- | ---------------------------- | ---------------------------- |
| Backend OpenAPI spec  | `openapi-typescript`         | `api/schema.ts` — request and response types |
| GraphQL schema (if adopted) | `graphql-codegen`      | typed documents and hooks    |
| `assets/icons/*.svg`  | `svgr`                       | typed React components       |
| Translation catalogues| i18n extractor               | typed message keys           |

## The point

Wire-format types should be **derived from the contract, not retyped by hand**.
A hand-written `interface Doctor` silently drifts from the API the day someone
renames a field on the backend; a generated one turns that into a compile error
in CI. That is the single highest-leverage use of this folder, and the reason it
is reserved now rather than improvised later.
