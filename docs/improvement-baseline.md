# Local improvement baseline

Baseline inspected on 2026-11-23 at local commit `050309a` on `main`.
Untracked local skill files and notes were present and are preserved.
Node v26.13.1 and npm 12.2.3 were available.

## Architecture and scope

Seven routes provide the dashboard, planner, indoor guidance, commute impact,
assistant, settings, and scenario comparison. Client components and hooks use
pure recommendation, planning, localization, and calculation modules. Route
handlers validate untrusted inputs before calling Open-Meteo, Upstash, and
Gemini through server-side code. Browser preferences are separate from server
credentials; AI text and provider responses cross validation boundaries.

Existing flows include English and Hindi, city lookup, forecasts, preferences,
rule-based fallback, source links, room sizing, and commute comparison. The
work must preserve these flows and the existing budgets and cache behavior.

## Baseline evidence

`./scripts/verify.ps1 -Browser` passed formatting, lint, typecheck, build,
bundle budget, 71 unit tests, 41 production-browser tests, and two public-mode
protection tests. Unit coverage for modules loaded by the test suite was
99.74% lines, 96.35% branches, and 98.78% functions; it is not coverage of
every production file. Compressed client JavaScript was 252.9 KiB across 16
assets. Production dependency audit reported zero known vulnerabilities.
Browser tests include mocked providers, but some existing browser journeys do
not intercept every air request. With local credentials present, those journeys
could reach a provider; no live-provider result was checked or claimed.

## Initial prioritized findings

1. **CONFIRMED — accessibility:** Several input borders in
   `src/app/globals.css` have low contrast against their backgrounds; add a
   computed-style regression test and improve functional boundaries.
2. **CONFIRMED — code quality:** Recommendation reason and evidence IDs are
   unrestricted strings in `src/features/recommendations/engine.ts`; derive
   types from the existing catalogs while retaining runtime validation.
3. **CONFIRMED — security:** No Content Security Policy is configured in
   `next.config.ts`; evaluate a report-only policy against production behavior.
4. **CONFIRMED — testing:** General route axe checks mock unavailable air;
   add success-state coverage while retaining failure-state checks.
5. **CONFIRMED — maintainability:** The narration SDK is a runtime dependency
   although it is only used by a separate script; preserve the script and move
   the package to development dependencies.
6. **DEFERRED — accessibility:** Real screen-reader and full WCAG 2.2 review
   require further hands-on verification; automated axe checks are partial.

## Traceability

| Area              | Local evidence                                                                         |
| ----------------- | -------------------------------------------------------------------------------------- |
| Code quality      | Strict TypeScript, lint, focused domain and integration tests                          |
| Security          | Bounded request parsing, origin checks, quotas, API protection tests, dependency audit |
| Efficiency        | Production build and compressed JavaScript budget                                      |
| Testing           | Unit coverage plus production browser and public-mode suites                           |
| Accessibility     | Axe checks, keyboard journeys, mobile and responsive tests                             |
| Problem alignment | Existing seven routes, domain tests, and browser journeys                              |

These signals are not a prediction of an external evaluation score.
