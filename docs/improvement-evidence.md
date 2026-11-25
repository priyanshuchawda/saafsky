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
| Provider diagnostics | Air, location and limiter exceptions emit only a service name and coarse failure category. Unit and endpoint tests verify classifications, unchanged public errors and redaction. | Gemini diagnostics, correlation IDs, metrics and real infrastructure monitoring remain outstanding. |
| Gemini response contract | A contract test compares the generation schema's fields, required keys and types with Zod's runtime schema; forged references and oversized responses are rejected in unit tests. | Generation schema intentionally uses a simpler supported subset; free-form prose grounding and live Gemini adapter behavior still need independent verification. |
| AI attempt budgets | Simulated concurrent requests and an alternate-model attempt verify that each model call requires a separate reservation and denied reservations fall back. | In-memory simulations do not establish distributed Redis atomicity or live provider behavior. |
| Partial Content Security Policy | A local report-only experiment covered all seven route entries and a deliberately invalid base URL; the enforced policy restricts base URLs, form destinations, embedded objects and framing. Production-browser journeys and a blocked-base check passed. | Script and style sources are not restricted; this is not a complete XSS defense. No production report collector or cross-browser proof is claimed. |
| Shared quota fairness | Trusted visitor limits run before global limits, so visitor-rejected requests do not consume shared counters. `tests/rate-limit-stages.test.ts` exercises denial, timeout, error and simulated concurrent requests. Invalid reset values fail closed instead of emitting an invalid retry header. | Visitor and global checks are separate Redis operations, so eligible requests add a sequential round trip. Simulated tests do not prove Upstash's distributed atomic behavior; many distinct visitors can still exhaust shared capacity. |
| Untyped recommendation references | Catalog-derived reason and evidence unions protect controlled recommendation definitions. The assistant contract uses schema-inferred types. | A legacy sentence-matching helper remains available for compatibility. |
| Fragile explanation translation | Recommendations, indoor guidance, planner steps, AQI categories, availability messages, and deterministic fallbacks use stable identifiers. Rate-limit text uses structured retry metadata. Application code no longer calls the legacy sentence-matching translator, which remains exported for compatibility. | Remaining parameterized interface text and legacy compatibility behavior need further review. |
| Repeated invalid-AQI checks | `src/lib/aqi-validity.ts` centralizes missing, negative, and non-finite handling across affected modules; `tests/aqi-validity.test.ts` and existing domain tests cover boundaries. | More timezone and forecast edge-case review remains valuable. |
| Wall-time validation | Freshness, provider schemas and planner windows share a calendar-validating wall-time parser; impossible dates no longer normalize into fresh readings. Existing duplicate-hour safeguards remain in place. | A wall-clock index is not a zoned instant; broader timezone and real-world DST checks remain valuable. |
| Air endpoint contract | The injected provider result uses the schema-derived response type, and the endpoint test now asserts a complete valid payload rather than an incomplete fixture. | A compile-time contract does not replace runtime validation of external providers. |
| Distributed AQI boundaries | `src/lib/aqi-policy.ts` defines the US AQI category boundaries used by classification, guidance and planning; boundary and existing domain tests preserve behavior. | Policy changes still require evidence review and appropriate regression tests. |
| Mobile navigation | The menu closes when a navigation link is selected. The keyboard test reproduced the previously open menu and now verifies closure. | Real assistive-technology testing remains unverified. |
| Normal-state accessibility | Browser axe checks exercise all seven routes in English and Hindi with mocked current forecast data in addition to existing error-state scans. The expanded test found a Hindi home-link name mismatch; the accessible name now includes the visible brand text. | Automated checks cannot establish WCAG conformance. |
| Assistant navigation translation | The dashboard link uses the existing language dictionary; a browser test verifies English and Hindi labels. | Other legacy sentence-based translations still require migration. |
| Assistant pending focus | The pending submit control retains focus and exposes its unavailable state; an active-request guard prevents repeated submissions, including after a language switch. Browser tests cover the focus and request behavior. | Real assistive-technology verification remains outstanding. |
| Typed recommendation identity | `RecommendationId` is defined with the domain catalog, and the Hindi catalog uses `satisfies Record<RecommendationId, ...>` so every known action must have translated content. Unit tests cover catalog completeness and reject unknown IDs. | Newly added recommendation IDs require a matching Hindi entry, by design. |
| Language-safe city search | Location search stores a typed status/result instead of translated text; visible status copy is rendered from the currently selected language. Production-browser tests change language while a search is pending and cover results and rate limits. | Manual assistive-technology testing remains outstanding. |
| Focused assistant announcements | The conversation transcript is no longer a live region. A persistent status region announces request state and the latest answer; browser tests cover pending, success, and clearing the conversation. | Manual NVDA/VoiceOver verification remains outstanding. |
| Public protection configuration | A pure configuration validator makes incomplete or malformed public Redis settings fail closed while retaining local development and local HTTP emulator support. Unit and public-mode HTTP tests cover configuration and pre-provider rejection. | Real Upstash concurrency and deployment configuration still need controlled infrastructure verification. |
| Assistant failure diagnostics | Assistant fallback paths classify air-provider, Redis budget, and Gemini failures through the existing redacted diagnostics boundary while preserving the same public fallback. Unit tests cover the service boundaries and the redacted reporter emits only service and failure code. | Live provider and Redis errors have not been exercised in this verification run. |
| Missing forecast text | Missing hourly values retain the visible dash and expose localized text to assistive technology; a production-browser regression test verifies the alternative. | Manual screen-reader verification remains outstanding. |
| Narration dependency | ElevenLabs moved from production to development dependencies. The existing narration script remains available for a separate video workflow. | Production-only installs intentionally do not include this development tool. |

## Security and accessibility backlog

- The enforced CSP is partial. A stricter script policy requires a separate
  compatibility and performance review: Next.js nonce-based policies require
  dynamic rendering, and the current policy does not restrict script sources.
- Test the complete keyboard and screen-reader experience with real assistive
  technology, including Hindi, focus movement, and dynamic announcements.
- Existing AI responses validate the JSON shape and source IDs, but natural
  language remains untrusted and cannot be fully verified structurally.
- Provider and Redis behavior, concurrency and real deployment controls require
  separate authorized integration checks. Fixed-window shared budgets can be
  exhausted and users behind a shared IP may share visitor limits.
- Expand typed translation keys, privacy-safe diagnostics, and independent
  coverage of hooks and server boundaries without changing existing behavior.

The November 25 `npm audit --omit=dev --audit-level=high` run reported zero
known vulnerabilities in production dependencies. It does not assess the
application or undisclosed vulnerabilities.

No external certification, complete security assessment, or evaluation score
is implied by these checks.

## Local verification on 2026-11-25

Formatting, lint, TypeScript, 98 unit tests, the production build, the bundle
budget, 51 production-browser tests, and two public-mode API protection tests
passed with `./scripts/verify.ps1 -Browser`. Provider credentials were set to
empty values for this verification run. Unit coverage of modules loaded by the
suite was 99.79% lines, 96.93% branches and 99.04% functions; other production
modules are not represented by those percentages. The client JavaScript total
was 260.7 KiB gzip across 16 assets, compared with 252.9 KiB at baseline. The
additional product functionality contributes to the increase; the configured
limit is 300 KiB. This run does not verify live provider or Redis behavior.
`npm audit --omit=dev --audit-level=high` also completed with zero reported
production dependency advisories on this date.

| Criterion | Verified evidence | Further work |
| --- | --- | --- |
| Code quality | Domain-owned recommendation IDs, exhaustive Hindi recommendation mapping, shared response types, common AQI validity, and passing static checks. | Continue time-handling and adapter-boundary review. |
| Security | Validated public protection configuration, request protection tests, typed/validated IDs, a partial CSP and dependency audit. | Stricter script policy, real concurrency and live deployment review. |
| Efficiency | Production build and compressed bundle budget. | Per-route performance and network profiling. |
| Testing | 98 unit tests, 51 production-browser tests, accessibility journeys, and two public-mode protection tests passed locally. | Add remaining provider and real-infrastructure failure cases. |
| Accessibility | Focused assistant announcements, language-aware pending city search, keyboard journeys, control-border checks and bilingual axe scans. | Manual screen-reader, zoom, focus, and broader contrast review. |
| Problem alignment | All seven route entry points and existing browser journeys remain covered. | Live providers and AI credentials were not exercised in the final run. |

The suite's browser journeys cover preferences, scenario comparison, planner,
indoor guidance, room sizing, commute impact and assistant fallback. Provider
integrations, AI responses and rate limits use controlled test cases; no claim
of successful live service operation follows from the local suite.
