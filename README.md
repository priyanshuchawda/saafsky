# SaafSky

**A clearer way to plan around the air.** SaafSky brings city air-quality forecasts, household-aware guidance, outing planning, indoor-air actions, commute comparisons, and a contextual assistant into one responsive product.

Choose a city and household preferences once. The dashboard, planner, indoor advisor, and assistant use the same current air context and deterministic recommendation rules.

## Product features

| Area | What it helps you do |
| --- | --- |
| Dashboard | Review current modeled US AQI, PM2.5 and PM10, source timestamps, and the hours ahead. |
| Personalized guidance | See practical actions selected from air conditions and household preferences, with reasons and evidence links. |
| Outing planner | Compare complete forecast windows against your available time, activity duration, household sensitivity, and fixed commitments. |
| Indoor-air advisor | Choose relevant actions for cooking smoke, filtration, and outdoor-air context. |
| Commute impact | Compare estimated transport emissions with the selected factors and calculation assumptions shown. |
| Ask SaafSky | Get a concise explanation of the current plan, with a deterministic fallback when AI is unavailable. |
| Scenario explorer | Change illustrative AQI and household inputs to see how recommendations respond without external services. |

## Air data and recommendations

Air forecasts and city lookup come from Open-Meteo, with atmospheric model attribution to Copernicus Atmosphere Monitoring Service (CAMS). SaafSky labels its index as **US AQI**. Forecasts are model estimates for a grid and may differ from local monitoring stations. The dashboard shows source and time context so people can interpret readings appropriately.

Recommendations and calculations are deterministic TypeScript. Gemini can explain the server-selected actions; its response is schema-validated and its action references are checked. The dashboard, recommendation engine, planner, indoor guidance, and scenario explorer remain useful without Gemini. The indoor advisor is a guidance tool, not an indoor sensor. See [data sources](docs/data-sources.md) and [decision policy](docs/decision-policy.md) for the exact methodology.

## Run locally

Requires Node.js 22.18 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The air dashboard and planning features need no API key. To enable the optional Gemini explanation service, configure server-side variables in `.env.local`:

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_FALLBACK_MODEL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RATE_LIMIT_HASH_SECRET=
SAAFSKY_PUBLIC=false
```

AI requests require Gemini and shared Upstash credentials. On Vercel, the separate rate-limit hash secret and trusted platform address are also required for public requests. Gemini uses bounded output and request budgets, and falls back to the deterministic plan if AI is unavailable. Review provider terms and quota settings before enabling external services. Full configuration and data-flow details are in [security and privacy](docs/security-privacy.md).

## Verify the product

On Windows, run the concise release check from the repository root:

```powershell
.\scripts\verify.ps1 -Browser
```

This runs ESLint, strict TypeScript, unit coverage, a production build, production-browser journeys, responsive and accessibility checks, and public API protection checks. Browser verification uses mocked provider responses and does not spend Gemini or air-data quotas. GitHub Actions is intentionally disabled; run the local release check against the commit you intend to deploy.

The current unit suite contains 55 tests. Its coverage command enforces minimums of 90% lines, 85% branches, and 90% functions; the latest run measured 99.80% lines, 95.61% branches, and 98.28% functions across modules loaded by that suite. Production browser verification covers 27 journeys and UI checks; the separate public API protection suite covers two fail-closed scenarios. Re-run the command above for fresh results.

To run a single layer, use `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`, `npm run test:e2e:production`, or `npm run test:protection`. Install Playwright Chromium once with `npx playwright install chromium` if it is not present.

## Product design and privacy

The app has no account or application database. City selection is stored in browser local storage; household preferences use tab session storage; conversation text stays in page memory. `/settings` lets people update or clear preferences. When configured, Gemini receives the question, recent context, modeled air summary, and selected actions; details are documented in [security and privacy](docs/security-privacy.md).

The interface is designed for desktop and mobile, with semantic controls, keyboard navigation, visible focus, text labels alongside color, and 48px targets for primary interactive controls. Automated axe checks and browser tests exercise the product at mobile and desktop widths. See [accessibility](docs/accessibility.md) for the interaction coverage and review method.

## Technical documentation

- [Architecture and data flow](docs/architecture.md)
- [Data sources and impact methodology](docs/data-sources.md)
- [Recommendation and planning policy](docs/decision-policy.md)
- [Security and privacy](docs/security-privacy.md)
- [Accessibility](docs/accessibility.md)
- [Testing and verification](docs/testing.md)
- [Security reporting](SECURITY.md)

Air-quality advice is general information. Follow existing clinical guidance for personal health decisions. Free service availability, quotas, and eligibility are governed by each provider's current terms.
