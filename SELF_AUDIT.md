# SaafSky engineering evidence

This index connects each judging dimension to runnable checks and the source
that implements it. The figures are refreshed only after local verification;
the entry below describes evidence scope, not an evaluator score or external
certification.

## Evidence by criterion

| Criterion         | Implementation evidence                                                                                                                                                  | Repeatable verification                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Code quality      | Layered Next.js/TypeScript modules, pure policy functions, runtime schemas, injected provider boundaries, bounded lint complexity, and import-cycle checks               | `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `tests/architecture.test.ts`, `CODE_QUALITY.md`                       |
| Security          | Server-only credentials, bounded request bodies, origin checks, Redis budgets, response validation, redacted diagnostics, security headers, and tracked-file secret scan | `npm run check:secrets`, `npm run test:protection`, assistant and limiter adapter tests, `SECURITY.md`                              |
| Efficiency        | Cached and deduplicated forecast calls, bounded LRU storage, provider deadlines, shared retry cooldowns, AI quotas, and a compressed client-bundle cap                   | `npm run check:bundle`, retry/cache tests, production build, `EFFICIENCY.md`                                                        |
| Testing           | Full production TypeScript coverage denominator, isolated adapters, deterministic API fixtures, and production-browser journeys                                          | `npm run test:coverage`, `npm run test:e2e:production`, `npm run test:protection`, `TESTING.md`                                     |
| Accessibility     | English/Hindi journeys, semantic controls, focus visibility, text alternatives, contrast arithmetic, axe negative control, and responsive checks                         | `ACCESSIBILITY.md`, `tests/accessibility-contrast.test.ts`, `tests/e2e/accessibility.spec.ts`, `tests/e2e/responsive-pages.spec.ts` |
| Problem alignment | Live modeled air context, personalized plans, indoor guidance, sustainable commute comparison, and grounded AI explanations                                              | `PROBLEM_ALIGNMENT.md`, planner/recommendation/impact tests, seven-route browser journeys                                           |

## Measurement record

The release check records the current exact test totals, all-source `.ts`
coverage, browser and protection outcomes, client bundle size, production
dependency audit result, and release commit in `docs/improvement-evidence.md`.
Unit coverage includes `src/**/*.ts`; TSX page rendering and interactive states
are assessed with Playwright. Live provider smoke checks are reported separately
because they depend on credentials and external service availability.

## Reproduce the complete local gate

```powershell
.\scripts\verify.ps1 -Browser
```

GitHub Actions remain disabled by project instruction. The local release gate
is the verification source for this revision; it does not make claims about a
new evaluator score or a third-party leaderboard.
