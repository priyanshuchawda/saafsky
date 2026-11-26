# Code quality

SaafSky keeps page rendering, decision rules, and provider access in separate
areas so the core guidance can be reviewed and tested without live services.
This page maps those practices to the code and checks that enforce them.

## Architecture

| Layer                | Responsibility                                                                                   | Examples                        |
| -------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------- |
| Configuration        | Pure, validated-independent request, AI, cache, and timeout budgets                              | `src/config/server-budgets.ts`  |
| App Router           | Page composition and HTTP request coordination                                                   | `src/app/`, `src/app/api/`      |
| Components and hooks | Accessible UI and browser state                                                                  | `src/components/`, `src/hooks/` |
| Features             | AQI policy, recommendations, planning, indoor guidance, assistant contracts, and emissions logic | `src/features/`                 |
| Server adapters      | Open-Meteo, Redis limits, diagnostics, and Gemini                                                | `src/server/`                   |
| Shared primitives    | Runtime schemas, AQI policy, time handling, and request boundaries                               | `src/lib/`                      |

The import-boundary regression test at `tests/architecture.test.ts` checks that
lower-level modules do not depend on pages or UI, client-marked App Router
modules do not import server code or server SDKs, and the internal source graph
has no dependency cycles. It permits one existing compatibility edge:
`src/lib/air.ts` calls the recommendation engine for its retained `advice()`
helper. The exception is documented and can be removed when that compatibility
API is migrated; it is not required to remain.

## Enforced checks

- Strict TypeScript, unused-code checks, explicit return paths, unchecked-index
  protection, explicit optional-field handling, and checked switch behavior are
  enabled in `tsconfig.json`.
- ESLint uses TypeScript project services for application source and rejects
  explicit `any`, floating promises, promise misuse, and awaiting non-thenables.
  It also rejects unsafe argument/assignment/call/member-access/return flows,
  unnecessary type assertions, and conditions TypeScript can prove redundant.
  The TypeScript architecture test guards internal layer dependencies and
  client/server boundaries.
- Production source is held to executable limits: cyclomatic complexity 16 in
  domain/server/config modules and 32 in UI modules; maximum nesting depth 4;
  four parameters; 75 nonblank lines per domain/server function and 180 per UI
  function; and 350 nonblank lines per source file. Non-null assertions are
  prohibited in application source. These limits guide responsibility
  boundaries without imposing artificial byte-size targets on translations.
- ESLint and Prettier run before the release verification finishes.
- Runtime schemas validate external air data, API inputs, and assistant output.
- Stable recommendation IDs connect the rules engine to an exhaustive Hindi
  translation catalogue.
- Unit and browser tests exercise deterministic policy, API boundaries, language
  changes, assistant fallback, responsive layouts, and accessibility states.
- The Node coverage gate includes every `src/**/*.ts` file, including modules
  not imported by tests, and enforces 90% line, branch, and function coverage.
  Hook tests run in jsdom; TSX rendering is also covered by production browser
  tests.
- A duplication scan is reproducible with:

  ```powershell
  npx --yes jscpd@4.0.5 src --min-lines 8 --min-tokens 50 --reporters console
  ```

  The November 26 scan found zero clones across 7,884 source lines at these
  thresholds. Shared recommendation rendering and household/commute controls
  were extracted after a first scan found repeated TSX blocks. This scoped
  result does not imply that no smaller repetitions exist.

## Reproduce locally

```powershell
.\scripts\verify.ps1 -Browser
```

See [quality evidence](docs/quality.md), [architecture](docs/architecture.md),
and [testing](docs/testing.md) for measured results, module responsibilities,
and test scope. See [improvement evidence](docs/improvement-evidence.md) for
verified changes and residual checks.
