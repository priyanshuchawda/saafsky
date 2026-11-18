# Quality engineering

SaafSky keeps presentation, provider access, and decision logic in separate layers. The boundaries make the most important behavior deterministic, independently testable, and usable when an external AI service is unavailable.

| Area | Quality practice | Evidence in the repository |
| --- | --- | --- |
| Type safety | Strict TypeScript, unchecked-index protection, explicit optional-field handling, and runtime schemas at API boundaries. | `tsconfig.json`, `src/lib/schemas.ts`, route tests. |
| Domain logic | AQI guidance, planning windows, indoor actions, and emissions arithmetic are pure functions. | `src/features/` and the corresponding unit tests. |
| Provider boundaries | Air, geocoding, Redis, and Gemini access stay in server adapters; provider responses are parsed before use. | `src/server/`, `src/features/air-quality/provider.ts`, provider contract tests. |
| AI behavior | Deterministic actions define the plan; Gemini explains supplied actions, action/evidence IDs are checked, and the browser renders only approved catalog links. | `src/server/chat.ts`, `src/features/assistant/validate.ts`, assistant and model-fallback tests. |
| Resilience | The planner and recommendations work without Gemini; provider errors produce bounded, user-safe responses. | Endpoint, fallback, and production-browser tests. |
| Resource use | Air forecasts and location searches use separate cache lifetimes; API requests have timeouts and shared budgets. | `src/server/air-provider.ts`, `src/server/locations-endpoint.ts`, `src/server/rate-limit.ts`. |

## Reproducible release checks

Run from the repository root on Windows:

```powershell
.\scripts\verify.ps1 -Browser
```

The script runs ESLint, strict typechecking, unit tests with coverage thresholds, the production build, the compressed client bundle check, production-browser tests, and public API protection tests. It prints concise summaries while preserving failure diagnostics. See [testing and verification](testing.md) for individual commands and coverage scope.

## Current measured evidence

Verified locally against the production build on **November 18, 2026**:

- **55 unit tests passed.** The coverage command enforces minimums of 90% lines, 85% branches, and 90% functions. The run measured 99.80% lines, 95.44% branches, and 98.39% functions across the modules loaded by the unit suite.
- **28 production-browser tests passed**, including all-page navigation, 320px and 390px responsive layouts, touch-target sizing, axe checks, mobile keyboard navigation, and primary user journeys.
- **2 public API protection tests passed**, checking fail-closed public behavior and request validation before provider access.
- **Client JavaScript measured 234.0 KiB gzip across 16 emitted chunks**, below the enforced 300 KiB project-wide budget. This counts all emitted client chunks and is not a per-route first-load estimate.
- **Production dependency audit reported zero known advisories** with `npm audit --omit=dev` against the current lockfile.
- **Live smoke passed** for Open-Meteo air data, Open-Meteo city lookup, and the SaafSky chat route in AI mode. The reusable [live smoke script](../scripts/smoke-live.ps1) prints no secrets or generated answer text.

Coverage is the measured scope of the modules imported by the unit suite; it is not a whole-application statement. Browser, API-protection, bundle, and live-provider checks add separate evidence for rendered behavior, request boundaries, resource size, and external integration.

## Change discipline

- Add a regression test with each behavior change.
- Keep policy thresholds, budgets, and calculation factors in named configuration or domain logic.
- Validate all external inputs and outputs at the boundary.
- Keep provider credentials server-side and out of browser bundles.
- Run the release script against the exact source intended for deployment.
- Keep live-provider smoke checks separate from deterministic tests so ordinary checks do not consume external quotas.
