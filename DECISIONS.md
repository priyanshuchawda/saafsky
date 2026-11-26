# Engineering decisions

This file records architectural choices that affect safety, maintainability,
and the user experience. Supporting details live in the linked implementation
and verification documents.

## ADR-001 — Keep the application in Next.js and TypeScript

**Decision:** Use one Next.js App Router application for UI and API routes.

**Reason:** The project already has working route handlers, Cache Components,
production-browser coverage, and a typed domain model. A second backend or a
framework rewrite would add a new deployment boundary without improving the
air-quality decision policy.

**Evidence:** `src/app/`, `src/server/`, `tests/architecture.test.ts`.

## ADR-002 — Use modeled city forecasts and label their provenance

**Decision:** Use Open-Meteo air-quality and geocoding services for the free
MVP, and identify the AQI standard and modeled/forecast nature in the product.

**Reason:** This provides broad location coverage without API credentials while
preserving a clear distinction between modeled city estimates and station
measurements.

**Evidence:** `src/features/air-quality/`, `src/server/air-provider.ts`,
`docs/data-sources.md`.

## ADR-003 — Keep safety decisions deterministic

**Decision:** Domain rules select recommendations. Gemini may explain those
actions but does not choose or override the plan.

**Reason:** The dashboard and fallback remain available without AI, while
recommendations stay reproducible and directly testable.

**Evidence:** `src/features/recommendations/engine.ts`,
`src/features/assistant/orchestrate.ts`, `tests/assistant-orchestration.test.ts`.

## ADR-004 — Validate generated assistant output at the boundary

**Decision:** Require structured JSON, action and evidence IDs from the
approved catalog, unique references, bounded text, and numeric tokens found in
the supplied AQI, forecast, or action context.

**Reason:** A valid JSON shape alone is insufficient for factual responses.
When the answer fails validation, the deterministic personalized fallback is
returned.

**Evidence:** `src/features/assistant/validate.ts`,
`tests/assistant.test.ts`, `tests/gemini-adapter.test.ts`.

## ADR-005 — Keep shared request protection in Redis

**Decision:** Use Upstash-backed global and visitor request limits in public
mode; reject requests when protection configuration or Redis access is
unavailable.

**Reason:** Per-process counters cannot protect upstream quotas consistently
across serverless instances. Visitor limits are checked before global counters
so repeated visitor rejections do not consume shared capacity.

**Evidence:** `src/server/rate-limit.ts`,
`src/server/rate-limit-stages.ts`,
`tests/rate-limit-adapter.test.ts`, `tests/rate-limit-stages.test.ts`.

## ADR-006 — Preserve cache efficiency while evaluating strict CSP

**Decision:** Keep a compatible enforced baseline and deliver the broader
script policy in report-only mode while checking all seven routes.

**Reason:** Next.js nonce-based CSP requires per-request dynamic rendering and
changes static caching and Partial Prerendering behavior. The current route
configuration depends on Cache Components; compatibility is verified before
changing that trade-off.

**Evidence:** `next.config.ts`, `tests/e2e/csp-experiment.spec.ts`,
`tests/e2e/security.spec.ts`, and the locally bundled Next.js CSP guide.
