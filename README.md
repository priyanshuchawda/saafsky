# SaafSky

SaafSky is an air quality and daily planning companion. The dashboard uses Open-Meteo geocoding and modelled air quality estimates. US AQI is not India's CPCB AQI, and forecasts are not local sensor measurements.

## Make a clearer plan for your day

- **Understand your air:** See a city-level estimate, pollutant readings and upcoming forecast periods in one place. The dashboard refreshes while it is open.
- **Plan around your household:** Get practical guidance shaped by sensitivities, children, exercise and commute choices, with reasons and supporting sources.
- **Choose a useful outing window:** Compare complete forecast periods against your available time and whether the trip is flexible or essential.
- **Improve indoor habits:** Explore practical ways to manage cooking smoke, ventilation and filtration.
- **Compare commute choices:** Estimate emissions differences with transparent factors and see the exposure tradeoffs.
- **Ask a follow-up:** Get an AI explanation when available, with a rule-based fallback to keep the core experience useful.

## Run locally

Requires Node.js 22.18 or newer. Run `npm ci`, then `npm run dev` and open http://localhost:3000. No API key is required for the dashboard. Open-Meteo's free API is subject to its non-commercial terms and usage limits.

## Checks

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. To run the mocked browser journeys, install Chromium with `npx playwright install chromium` and run `npm run test:e2e`. After building, run `npm run test:e2e:production` to test the production server. These tests do not call Gemini.

The browser suite includes automated axe checks of the initial state of each page, a skip-link keyboard check, and a 320px overflow check. These automated checks do not establish full accessibility compliance; assistive technology and additional interaction states still require manual testing.

## Current state and plan

The app includes city lookup, cached and validated air forecasts, stale-data checks, a basic rule-based plan, an offline scenario at `/scenarios`, an outing-window comparison at `/planner`, an indoor-air advisor at `/indoor`, a factor-based emissions comparison at `/impact`, and an assistant at `/assistant`. The assistant uses a deterministic fallback unless Gemini and shared rate-limiter credentials are configured. Recommendations are general information and not medical advice.

The selected city is saved in browser local storage. Household sensitivity, children, commute, exercise, and cooking-smoke choices stay in session storage for the current tab and feed the dashboard, planner, and assistant. Use `/settings` to update or clear these preferences. Chat messages remain in page memory only; when AI is enabled, up to two previous exchanges are sent to Gemini as context. Clear them using the assistant's clear button or leave the page.

Gemini is optional. Set `GEMINI_API_KEY`, `GEMINI_MODEL`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` in `.env.local`. Without both Upstash credentials the assistant never calls Gemini. A global limit of 3 requests per minute and 20 per day applies when configured; rate-limit errors fail closed to the fallback. Verify that the Google and Upstash projects are on free tiers before enabling them. Free-tier Gemini content may be used by Google to improve products; the interface asks users not to enter personal or medical details. AI output is schema-checked and action references are validated, but free text can still be wrong.

Air, location, and chat endpoints use global shared rate limits when Upstash is configured. On Vercel they additionally apply per-visitor caps using a short-lived HMAC of the platform-supplied IP address; raw IP addresses are not stored in Redis. Configure a separate random `RATE_LIMIT_HASH_SECRET` for the HMAC. Rotating it resets visitor-specific counters while global budgets remain in force. Vercel requests fail closed when the limiter, hashing secret, or trusted address is unavailable. Set `SAAFSKY_PUBLIC=true` on other public hosts to enforce global limits; per-visitor limits require a trusted platform address and are currently enabled only on Vercel. A global quota can temporarily block everyone during heavy usage. GitHub Actions is intentionally disabled.

Open-Meteo responses are cached by Next.js for 30 minutes for air data and 24 hours for locations. Cache availability and sharing depend on the deployment environment; there is no uptime guarantee.

## Architecture and decision policy

The browser calls Next.js route handlers. City search and air data use Open-Meteo; responses are validated with Zod. A pure recommendation function uses the US AQI and general household context to select stable action IDs. The assistant receives the server-generated actions and a minimal forecast summary, and validates the AI's action references before returning its answer. The dashboard and planner do not depend on Gemini.

Air data is modeled, not a local measurement. The dashboard rejects guidance based on data if retrieval or model timestamps are stale. The outing planner compares available forecast hours in a user-selected local time window; the lowest forecast is not necessarily safe. The indoor advisor has no sensor and cannot determine actual indoor air quality. The app does not provide medical advice or calculate India's CPCB AQI.

The impact page offers 2025 UK average petrol-car and local-bus factors as clearly labeled proxies; the car factor is divided by the number of occupants. Users can instead enter a sourced passenger-kilometre factor. Walking and cycling are treated as zero direct vehicle emissions; lifecycle emissions, induced travel and individual exposure are excluded. Results should not be interpreted as measured Indian transport emissions or changes in local AQI.

## Product documentation

- [Architecture and data flow](docs/architecture.md)
- [Data sources and impact methodology](docs/data-sources.md)
- [Recommendation and planning policy](docs/decision-policy.md)
- [Security and privacy](docs/security-privacy.md)
- [Accessibility and known gaps](docs/accessibility.md)
- [Testing and verification](docs/testing.md)
- [Reporting a security concern](SECURITY.md)

## Release status

SaafSky is not a clinically reviewed safety product. It needs more extensive policy review, accessible interaction testing, and production monitoring. Public hosting requires a free Upstash database that the owner controls; temporary test databases expire. Open-Meteo's free service and Vercel Hobby are subject to non-commercial eligibility and usage limits. Keep billing disabled for a zero-cost Gemini project and never commit `.env.local` or API keys.
