# Testing and verification

SaafSky uses deterministic unit tests, injected provider and limiter tests,
production-browser journeys, accessibility scans, and a separate public-mode
API protection suite. Routine verification uses fixtures and does not consume
Open-Meteo, Upstash, or Gemini quotas.

## Release verification

On Windows, run the complete local release check:

```powershell
.\scripts\verify.ps1 -Browser
```

This runs formatting, tracked-file secret scanning, ESLint, strict TypeScript,
all-source unit coverage, a production build, the compressed bundle budget,
production-browser tests, cross-browser smoke tests, and public API protection
tests. This command provides the repeatable local release quality gate.

Individual checks:

```sh
npm run format:check
npm run check:secrets
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run check:bundle
npm run test:e2e:production
npm run test:e2e:compat
npm run test:protection
```

## Coverage scope

Node.js 26 coverage includes every production `src/**/*.ts` module, including
modules not imported by a unit test. The configured floors are 90% lines, 90%
branches, and 90% functions. React hooks have direct jsdom tests; TSX rendering
and browser-only behavior are also verified in Playwright. Coverage measures
executed code, while policy boundaries use explicit expected results.

The suite exercises AQI policy boundaries, household decisions, time handling,
forecast and provider schemas, request caching and cooldowns, emissions,
Gemini output validation, model fallback, rate-limit orchestration, endpoint
contracts, bilingual journeys, navigation, responsive layouts, and security
headers. Adapter tests inject controlled dependencies. The separate Redis smoke verifies fixed-window admission under concurrent
requests and independent visitor permits using an isolated live key. Its
measurement scope is the bounded scenario described below.

## Controlled live Redis concurrency smoke

When `.env.local` contains the Upstash REST URL and token, run:

```powershell
npm run smoke:redis
```

The script creates a unique verification prefix, sends concurrent requests to
Upstash's distributed fixed-window limiter, checks the single-permit result and
an independent client, and relies on the one-minute key expiry. It prints no
credentials or identifiers and does not consume SaafSky's production limiter
prefixes. This is an on-demand integration smoke, not part of ordinary unit
tests.

## Browser and live checks

```sh
npm run test:e2e:production
npm run test:protection
```

The production suite uses a locally built Next.js server. The protection suite
verifies fail-closed behavior with public mode enabled and missing credentials.
Use `scripts/smoke-live.ps1 -RequireGemini` separately when a deliberate live
provider check is needed; that command is not part of ordinary tests.
