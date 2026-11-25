# Code quality

SaafSky keeps page rendering, decision rules, and provider access in separate
areas so the core guidance can be reviewed and tested without live services.
This page maps those practices to the code and checks that enforce them.

## Architecture

| Layer                | Responsibility                                                                                   | Examples                        |
| -------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------- |
| App Router           | Page composition and HTTP request coordination                                                   | `src/app/`, `src/app/api/`      |
| Components and hooks | Accessible UI and browser state                                                                  | `src/components/`, `src/hooks/` |
| Features             | AQI policy, recommendations, planning, indoor guidance, assistant contracts, and emissions logic | `src/features/`                 |
| Server adapters      | Open-Meteo, Redis limits, diagnostics, and Gemini                                                | `src/server/`                   |
| Shared primitives    | Runtime schemas, AQI policy, time handling, and request boundaries                               | `src/lib/`                      |

The import-boundary regression test at `tests/architecture.test.ts` checks that
lower-level modules do not depend on pages or UI, and that client-facing layers
do not import server code. It permits one existing compatibility edge:
`src/lib/air.ts` calls the recommendation engine for its retained `advice()`
helper. The exception is documented and can be removed when that compatibility
API is migrated; it is not required to remain.

## Enforced checks

- Strict TypeScript, unchecked-index protection, explicit optional-field
  handling, and checked switch behavior are enabled in `tsconfig.json`.
- ESLint and Prettier run before the release verification finishes.
- Runtime schemas validate external air data, API inputs, and assistant output.
- Stable recommendation IDs connect the rules engine to an exhaustive Hindi
  translation catalogue.
- Unit and browser tests exercise deterministic policy, API boundaries, language
  changes, assistant fallback, responsive layouts, and accessibility states.

## Reproduce locally

```powershell
.\scripts\verify.ps1 -Browser
```

See [quality evidence](docs/quality.md), [architecture](docs/architecture.md),
and [testing](docs/testing.md) for measured results, module responsibilities,
and test scope. See [improvement evidence](docs/improvement-evidence.md) for
verified changes and residual checks.
