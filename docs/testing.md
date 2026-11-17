# Testing and verification

SaafSky uses fast, offline unit tests, provider-injected API tests, production-browser journeys, and a separate public-mode protection suite. Automated checks do not require Gemini credentials or consume provider quotas.

Requires Node.js 22.18 or newer. Install dependencies and run the core checks from the repository root:

```sh
npm ci
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

The unit suite covers domain calculations, AQI boundaries, freshness and time zones, recommendation policy, indoor advice, planner constraints, emissions arithmetic, request schemas, bounded request bodies, rate-limit decisions, and provider failures. API endpoint tests inject provider and limiter dependencies so success, validation, rate-limit, and upstream-error responses stay deterministic and free of live network calls.

The coverage report measures modules loaded by the unit suite. Browser and protection tests complement it by validating rendered pages, API responses, keyboard and mobile behavior, security headers, and public-mode fail-closed behavior.

Run the browser suites with:

```sh
npx playwright install chromium
npm run test:e2e
npm run test:e2e:production
npm run test:protection
```

The default browser suite uses a development server. The production suite runs the built application and checks user journeys, responsive layouts at 320px, 390px, and desktop widths, assistant fallback, accessibility, and error states. The protection suite starts a separate production server with public mode enabled and credentials blank, then verifies that API requests fail closed before provider access.

On Windows, `scripts/verify.ps1` provides a concise local release check:

```powershell
.\scripts\verify.ps1
.\scripts\verify.ps1 -Browser
```

The browser option runs production browser journeys and public API protection after lint, typecheck, coverage, and build. Provider smoke checks are performed separately when validating live credentials and provider availability; keeping those checks outside the routine suite preserves deterministic runs and free-tier quotas.

GitHub Actions remains disabled during iterative development. Run the local release check against the exact commit prepared for deployment.
