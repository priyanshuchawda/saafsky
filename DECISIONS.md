# Engineering decisions

This file records architectural choices that affect safety, maintainability,
and the user experience. Supporting details live in the linked implementation
and verification documents.

## ADR-001 — Keep the application in Next.js and TypeScript

**Decision:** Use one Next.js App Router application for UI and API routes.

**Reason:** One application provides typed route handlers, Cache Components,
shared domain contracts, and a unified production-browser verification path.
The deployment boundary keeps provider credentials and infrastructure access
server-side while supporting cohesive product navigation.

**Evidence:** `src/app/`, `src/server/`, `tests/architecture.test.ts`.

## ADR-002 — Use modeled city forecasts and label their provenance

**Decision:** Use Open-Meteo air-quality and geocoding services, and identify
the AQI standard, data provenance, and forecast nature in the product.

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

**Decision:** Require structured JSON, bounded text, unique action and evidence
references from the approved catalog, and claim screening. The validator
rejects detected numeric tokens, context-paired English/Hindi number words,
and selected unsupported safety, efficacy, and product claims. Exact air
readings and forecast times are displayed separately by deterministic UI.

**Reason:** Separating authoritative readings and actions from generated prose
keeps the factual presentation reproducible. A validated explanation is
shown when available; otherwise the deterministic personalized plan remains
available.

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

## ADR-006 — Enforce a static-compatible content security policy

**Decision:** Enforce a same-origin resource policy with explicit restrictions
on scripts, styles, connections, images, fonts, workers, frames, forms, base
URLs, and embedded objects. Inline scripts and styles are permitted for
Next.js static rendering. Report-only behavior is exercised separately by a
browser test.

**Reason:** This policy provides resource-origin and embedding restrictions
while preserving Cache Components, static rendering, and navigation.
Nonce-based script restrictions require per-request rendering and a separate
performance and compatibility assessment.

**Evidence:** `next.config.ts`, `tests/e2e/csp-experiment.spec.ts`,
`tests/e2e/security.spec.ts`, and the [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy).
