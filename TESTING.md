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
production-browser tests, and public API protection tests. GitHub Actions remain
disabled; this local command is the release quality gate.

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
npm run test:protection
```

## Coverage scope

Node.js 26 coverage includes every production `src/**/*.ts` module, including
modules not imported by a unit test. The configured floors are 75% lines, 90%
branches, and 90% functions. React TSX rendering and browser-only behavior are
verified in Playwright rather than being included in the Node coverage
denominator. The release report records these scopes separately.

The suite exercises AQI policy boundaries, household decisions, time handling,
forecast and provider schemas, request caching and cooldowns, emissions,
Gemini output validation, model fallback, rate-limit orchestration, endpoint
contracts, bilingual journeys, navigation, responsive layouts, and security
headers. Adapter tests inject controlled dependencies; they do not claim to
prove external provider uptime or distributed Redis atomicity.

## Browser and live checks

```sh
npm run test:e2e:production
npm run test:protection
```

The production suite uses a locally built Next.js server. The protection suite
verifies fail-closed behavior with public mode enabled and missing credentials.
Use `scripts/smoke-live.ps1 -RequireGemini` separately when a deliberate live
provider check is needed; that command is not part of ordinary tests.
