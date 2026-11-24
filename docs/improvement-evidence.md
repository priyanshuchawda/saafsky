# Improvement evidence

The baseline, architecture, and original measurements are recorded in
[improvement-baseline.md](improvement-baseline.md). The following changes are
local and preserve existing routes and public response shapes.

| Finding | Change and evidence | Remaining risk |
| --- | --- | --- |
| Low-contrast functional borders | Updated the control borders in `src/app/globals.css`; the computed-color browser test first failed at 1.40:1–1.63:1 and passed after the change. | This targeted measurement does not replace complete contrast or screen-reader review. |
| Unknown evidence IDs | `findEvidence` rejects inherited properties for client-provided IDs; `tests/evidence.test.ts` covers known and unknown IDs including prototype names. | Schema validation and source whitelisting do not verify every claim in free-form model prose. |
| Malformed request encoding | The bounded JSON reader rejects invalid UTF-8 rather than replacing invalid bytes; unit and HTTP tests cover rejection and preserve valid Hindi text. | Request validation remains one layer of the public API's defenses. |
| Chat response caching | Success and error responses explicitly send `Cache-Control: no-store`; browser tests check validation and fail-closed responses. | This directive does not control behavior of clients that deliberately ignore it. |
| Shared quota fairness | Trusted visitor limits run before global limits, so visitor-rejected requests do not consume shared counters. `tests/rate-limit-stages.test.ts` exercises denial, timeout, error and simulated concurrent requests. Invalid reset values fail closed instead of emitting an invalid retry header. | Visitor and global checks are separate Redis operations, so eligible requests add a sequential round trip. Simulated tests do not prove Upstash's distributed atomic behavior; many distinct visitors can still exhaust shared capacity. |
| Untyped recommendation references | Catalog-derived reason and evidence unions protect controlled recommendation definitions. The assistant contract uses schema-inferred types. | Translation still partly relies on matching English text. |
| Fragile explanation translation | Recommendation reason descriptions now select English and Hindi by typed reason ID; the legacy translation path remains for compatibility. | Other recommendation, planner, indoor, and error copy still needs migration to stable keys. |
| Repeated invalid-AQI checks | `src/lib/aqi-validity.ts` centralizes missing, negative, and non-finite handling across affected modules; `tests/aqi-validity.test.ts` and existing domain tests cover boundaries. | More timezone and forecast edge-case review remains valuable. |
| Distributed AQI boundaries | `src/lib/aqi-policy.ts` defines the US AQI category boundaries used by classification, guidance and planning; boundary and existing domain tests preserve behavior. | Policy changes still require evidence review and appropriate regression tests. |
| Mobile navigation | The menu closes when a navigation link is selected. The keyboard test reproduced the previously open menu and now verifies closure. | Real assistive-technology testing remains unverified. |
| Normal-state accessibility | Browser axe checks exercise all seven routes in English and Hindi with mocked current forecast data in addition to existing error-state scans. The expanded test found a Hindi home-link name mismatch; the accessible name now includes the visible brand text. | Automated checks cannot establish WCAG conformance. |
| Narration dependency | ElevenLabs moved from production to development dependencies. The existing narration script remains available for a separate video workflow. | Production-only installs intentionally do not include this development tool. |

## Security and accessibility backlog

- A Content Security Policy is not yet enforced. Next.js nonce-based policies
  require dynamic rendering; a report-only experiment and production-route
  compatibility checks are needed before selecting a policy.
- Test the complete keyboard and screen-reader experience with real assistive
  technology, including Hindi, focus movement, and dynamic announcements.
- Existing AI responses validate the JSON shape and source IDs, but natural
  language remains untrusted and cannot be fully verified structurally.
- Provider and Redis behavior, concurrency and real deployment controls require
  separate authorized integration checks. Fixed-window shared budgets can be
  exhausted and users behind a shared IP may share visitor limits.
- Expand typed translation keys, privacy-safe diagnostics, and independent
  coverage of hooks and server boundaries without changing existing behavior.

No external certification, complete security assessment, or evaluation score
is implied by these checks.

## Local verification on 2026-11-24

`./scripts/verify.ps1 -Browser` passed formatting, lint, TypeScript, 81 unit
tests, the production build, the bundle budget, 43 production-browser tests,
and two public-mode API protection tests. Provider credentials were set to
empty values for this verification run. Unit coverage of modules loaded by the
suite was 99.75% lines, 96.66% branches and 98.85% functions; other production
modules are not represented by those percentages. The client JavaScript total
was 254.8 KiB gzip across 16 assets, compared with 252.9 KiB at baseline. The
additional keyed Hindi copy contributes to the increase; the configured limit is
300 KiB. npm's dependency audit reported zero known vulnerabilities.

| Criterion | Verified evidence | Further work |
| --- | --- | --- |
| Code quality | Typed references, shared response types, common AQI validity and passing static checks. | Complete the staged translation and time-handling review. |
| Security | Request protection tests, typed/validated IDs and dependency audit. | CSP experiment, concurrency and live deployment review. |
| Efficiency | Production build and compressed bundle budget. | Per-route performance and network profiling. |
| Testing | Unit, browser, accessibility and public-mode suites passed locally. | Add remaining failure, cancellation and provider contract cases. |
| Accessibility | Keyboard menu test, control-border checks and bilingual success-state axe scans. | Manual screen-reader, zoom, focus, and broader contrast review. |
| Problem alignment | All seven route entry points and existing browser journeys remain covered. | Live providers and AI credentials were not exercised in the final run. |

The suite's browser journeys cover preferences, scenario comparison, planner,
indoor guidance, room sizing, commute impact and assistant fallback. Provider
integrations, AI responses and rate limits use controlled test cases; no claim
of successful live service operation follows from the local suite.
