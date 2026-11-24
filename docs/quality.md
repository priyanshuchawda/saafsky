# Quality engineering

SaafSky separates presentation, provider access, and decision logic into clear layers. This keeps important behavior deterministic, independently testable, and useful alongside optional AI explanations.

| Area | Quality practice | Evidence in the repository |
| --- | --- | --- |
| Formatting | Prettier checks source and test files consistently in the release script. | `npm run format:check`, `scripts/verify.ps1`. |
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

Verified locally against the production build on **November 25, 2026**:

- **93 unit tests passed.** The coverage command enforces minimums of 90% lines, 85% branches, and 90% functions. The run measured 99.79% lines, 96.69% branches, and 99.04% functions across the modules loaded by the unit suite.
- **47 production-browser tests passed**, including English and Hindi journeys, household comparison, all-page navigation, 320px through 1440px responsive layouts, touch-target sizing, axe checks, mobile keyboard navigation, and primary user journeys.
- **2 public API protection tests passed**, checking fail-closed public behavior and request validation before provider access.
- **Client JavaScript measured 260.2 KiB gzip across 16 emitted chunks**, below the enforced 300 KiB project-wide budget. This counts all emitted client chunks and is not a per-route first-load estimate.
- **Production dependency audit** on November 25 reported zero known vulnerabilities with `npm audit --omit=dev --audit-level=high` against the current lockfile. This checks known advisories and is not a complete security assessment.
- **Production smoke passed** on November 18 at [saafsky.vercel.app](https://saafsky.vercel.app): the site, air endpoint, city lookup, and Gemini chat in AI mode all returned successfully.
- **Local live smoke passed** on November 18 for Open-Meteo air data, Open-Meteo city lookup, and the SaafSky chat route in AI mode. The reusable [live smoke script](../scripts/smoke-live.ps1) prints no secrets or generated answer text.

Coverage reports quantify modules imported by the unit suite. Browser, API-protection, bundle, and live-provider checks add complementary evidence for rendered behavior, request boundaries, resource size, and external integration.

## Change discipline

- Add a regression test with each behavior change.
- Keep policy thresholds, budgets, and calculation factors in named configuration or domain logic.
- Validate all external inputs and outputs at the boundary.
- Keep provider credentials server-side and out of browser bundles.
- Run the release script against the exact source intended for deployment.
- Keep live-provider smoke checks separate from deterministic tests so ordinary checks do not consume external quotas.
