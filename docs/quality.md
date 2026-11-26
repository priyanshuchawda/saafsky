# Quality engineering

SaafSky separates presentation, provider access, and decision logic into clear layers. This keeps important behavior deterministic, independently testable, and useful alongside optional AI explanations.

| Area                    | Quality practice                                                                                                                                                                              | Evidence in the repository                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Formatting              | Prettier checks source, tests, release scripts, repository guidance, and key configuration files with matching write/check scopes.                                                            | `package.json`, `npm run format`, `npm run format:check`, `scripts/verify.ps1`.                                                               |
| Type safety             | Strict TypeScript, unused-code checks, explicit return paths, unchecked-index protection, runtime boundary schemas, and a domain-owned recommendation ID union with exhaustive Hindi mapping. | `tsconfig.json`, `eslint.config.mjs`, `src/lib/schemas.ts`, `src/features/recommendations/engine.ts`, `src/features/i18n/recommendations.ts`. |
| Domain logic            | AQI guidance, planning windows, indoor actions, and emissions arithmetic are pure functions.                                                                                                  | `src/features/` and the corresponding unit tests.                                                                                             |
| Provider boundaries     | Air, geocoding, Redis, and Gemini access stay in server adapters; provider responses are parsed before use.                                                                                   | `src/server/`, `src/features/air-quality/provider.ts`, provider contract tests.                                                               |
| AI behavior             | Deterministic actions define the plan; Gemini explains supplied actions, action/evidence IDs are checked, and numeric and selected unsupported qualitative claims are rejected.               | `src/server/chat.ts`, `src/features/assistant/validate.ts`, assistant and model-fallback tests.                                               |
| Resilience              | The planner and recommendations work without Gemini; public deployments fail closed on malformed shared-protection configuration.                                                             | Endpoint, fallback, protection configuration, and production-browser tests.                                                                   |
| Diagnostics             | Assistant fallback paths distinguish air, rate-limit, and Gemini failures through redacted service diagnostics without changing user responses.                                               | `src/features/assistant/orchestrate.ts`, `src/server/diagnostics.ts`, orchestration tests.                                                    |
| Runtime budgets         | Request quotas, AI attempt/output limits, provider timeouts, cache lifetimes, and chat body cap have one typed configuration source.                                                          | `src/config/server-budgets.ts`, `tests/server-budgets.test.ts`.                                                                               |
| Architecture boundaries | A TypeScript AST regression check guards layer imports, client server-only dependencies, and source cycles while documenting the retained compatibility bridge.                               | `tests/architecture.test.ts`, `src/lib/air.ts`.                                                                                               |
| Accessible state        | Search stores structured status so changing language updates in-flight result announcements; the assistant announces only request state and its latest reply.                                 | `src/components/location-search.tsx`, `src/app/assistant/page.tsx`, browser regression tests.                                                 |
| Resource use            | Air forecasts and location searches use separate cache lifetimes; API requests have timeouts and shared budgets.                                                                              | `src/server/air-provider.ts`, `src/server/locations-endpoint.ts`, `src/server/rate-limit.ts`.                                                 |

## Reproducible release checks

Run from the repository root on Windows:

```powershell
.\scripts\verify.ps1 -Browser
```

The script runs formatting, tracked-file secret scanning, type-aware ESLint, strict typechecking, unit tests with coverage thresholds, the production build, the compressed client bundle check, production-browser tests, cross-browser smoke tests, and public API protection tests. It prints concise summaries while preserving failure diagnostics. See [testing and verification](testing.md) for individual commands and coverage scope.

## Current measured evidence

Verified locally against the production build on **November 26, 2026**:

- **138 unit tests passed.** Coverage includes every production `src/**/*.ts` file; the run measured 95.53% lines, 92.55% branches, and 93.13% functions against enforced floors of 90% for each measure. Direct jsdom tests exercise the four React hooks.
- **60 production-browser tests passed**, including English and Hindi journeys, language changes during pending searches and rate-limit errors, focused assistant announcements, air retry recovery, household comparison, all-page navigation, responsive layouts, WCAG text-spacing overrides, forced-colors focus, touch-target sizing, axe checks, mobile keyboard navigation, and primary user journeys.
- **3 cross-browser production smoke tests passed** in Chromium, Firefox, and WebKit, covering the seven routes, core navigation, scenario selection, transport calculation, and Hindi selection.
- **2 public API protection tests passed**, checking fail-closed public behavior and request validation before provider access.
- **Live distributed Redis concurrency smoke passed:** 24 simultaneous requests for one isolated visitor yielded exactly one permit; a second visitor received an independent permit. The verification prefix is unique and keys expire within one minute.
- **Client JavaScript measured 265.7 KiB gzip across 16 emitted chunks**, below the enforced 300 KiB project-wide budget. This counts all emitted client chunks and is not a per-route first-load estimate.
- **Lighthouse 13.6.0 mobile lab measurements** against the local production server scored 85–93 across the seven routes. LCP ranged from 758–905 ms, TBT from 328–595 ms, and CLS from 0.000–0.008. Per-route script transfer ranged from 202,697–213,414 bytes. See [EFFICIENCY.md](../EFFICIENCY.md) for the route table and reproduction command; these are lab results, not field Core Web Vitals.
- **Architecture-boundary regression passed**, checking TypeScript imports across application layers and documenting the retained compatibility bridge.
- **Production dependency audit** on November 25 reported zero known vulnerabilities with `npm audit --omit=dev --audit-level=high` against the lockfile.
- **Production smoke passed** on November 26 at [saafsky.vercel.app](https://saafsky.vercel.app): the site, air endpoint, city lookup, and Gemini chat in AI mode all returned successfully.
- **Local live smoke passed** on November 26 for Open-Meteo air data, Open-Meteo city lookup, and the SaafSky chat route in AI mode. The run also exercised configured Redis-backed request and AI-attempt budgets. The reusable [live smoke script](../scripts/smoke-live.ps1) prints no secrets or generated answer text.

Coverage reports quantify every production `src/**/*.ts` module, including unexecuted modules; TSX rendering is assessed separately through browser tests. Browser, API-protection, bundle, cross-engine, and live-provider checks add complementary evidence for rendered behavior, request boundaries, resource size, and external integration. The project owner also reported successful hands-on review of keyboard operation, assistive-technology output, English/Hindi content, mobile/desktop layouts, and zoom/reflow on November 26, 2026; see [accessibility review](accessibility.md).

## Change discipline

- Add a regression test with each behavior change.
- Keep policy thresholds, budgets, and calculation factors in named configuration or domain logic.
- Validate all external inputs and outputs at the boundary.
- Keep provider credentials server-side and out of browser bundles.
- Run the release script against the exact source intended for deployment.
- Keep live-provider smoke checks separate from deterministic tests so ordinary checks do not consume external quotas.
