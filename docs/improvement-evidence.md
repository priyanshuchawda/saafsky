# Engineering evidence

SaafSky combines live environmental context, deterministic household guidance,
structured AI explanations, and a responsive bilingual interface. This page
summarizes the engineering practices and release checks behind the product.

## Product quality in practice

| Area              | Implementation                                                                                                                                                           | Evidence                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Code quality      | Strict TypeScript, type-aware lint, typed recommendation/evidence contracts, shared components, and documented module boundaries.                                        | 138 unit tests; 95.53% full-source line coverage; duplication scan reports zero clones across 7,884 source lines at the configured thresholds.                           |
| Security          | Validated API boundaries, server-only credentials, shared request budgets, enforced CSP/security headers, redacted diagnostics, and structured Gemini output validation. | Secret scan, API-protection tests, dependency audit, production header checks, live Gemini response, and isolated Upstash concurrency smoke.                             |
| Efficiency        | Cached air data, request deduplication, bounded retries, shared budgets, and a measured client-bundle budget.                                                            | 265.7 KiB gzip across 16 assets against the 300 KiB budget; Lighthouse route baselines in [EFFICIENCY.md](../EFFICIENCY.md).                                             |
| Testing           | Domain tests, direct jsdom hook tests, provider adapters, production-browser journeys, cross-browser smoke, and public-mode API protection.                              | 138 unit tests, 60 production-browser tests, 3 browser-engine smoke tests, and 2 API-protection tests passed locally.                                                    |
| Accessibility     | Semantic controls, keyboard support, focused status messages, English/Hindi content, responsive layouts, and visible focus states.                                       | Bilingual axe/browser checks and the project owner’s reported hands-on review of keyboard, assistive technology, language, mobile/desktop, and zoom/reflow interactions. |
| Problem alignment | Seven connected product routes use the same city, forecast, household profile, and deterministic action plan.                                                            | Browser journeys and a live AI exchange exercise dashboard, planner, indoor guidance, commute impact, assistant, preferences, and scenarios.                             |

## Release verification

The Windows release command is `./scripts/verify.ps1 -Browser`. On November 26,
2026, it passed formatting, tracked-file secret scanning, expanded type-aware
lint, TypeScript, the 90% coverage gate, production build, bundle budget,
production-browser tests, cross-browser smoke, and public API protection tests.
The measured coverage was 95.53% lines, 92.55% branches, and 93.13% functions
across every production `src/**/*.ts` file. The release measurements describe
the application and test source introduced through commit `8e632b4`; subsequent
changes to documentation and lint configuration preserve that application source.

`npm audit --audit-level=high` reported zero known vulnerabilities in the
installed dependency tree. The production smoke exercised Open-Meteo air and
location lookups and returned a validated Gemini AI response with action and
source references. `npm run smoke:redis` verified the distributed fixed-window
limiter using 24 concurrent requests under a unique one-minute key prefix.

## Production release

The `main` branch release was deployed directly with the Vercel CLI on November
26, 2026. The `saafsky.vercel.app` dashboard, planner, and assistant returned
HTTP 200 with the configured Content Security Policy, HSTS, and COOP headers.
The production chat endpoint returned AI mode with validated action and source
references.

## Accessibility review

On November 26, 2026, the project owner reported successful hands-on checks of
keyboard operation, assistive-technology output, English and Hindi content,
desktop and mobile layouts, and zoom/reflow behavior. The automated suite
provides repeatable coverage, and these hands-on checks add direct user review.

## Performance baseline

Lighthouse 13.6.0 mobile lab measurements against the local production server
scored 85–93 across seven routes. LCP ranged from 758–905 ms, TBT from 328–595
ms, and CLS from 0.000–0.008. These repeatable measurements are documented by
route in [EFFICIENCY.md](../EFFICIENCY.md).
