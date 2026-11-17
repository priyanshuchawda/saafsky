# SaafSky

An early-stage air quality companion for a non-commercial hackathon. The dashboard uses Open-Meteo geocoding and modelled air quality estimates. US AQI is not India's CPCB AQI, and forecasts are not local sensor measurements.

## Run locally

Requires Node.js 22.18 or newer. Run `npm ci`, then `npm run dev` and open http://localhost:3000. No API key is required for the dashboard. Open-Meteo's free API is subject to its non-commercial terms and usage limits.

## Checks

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

## Current state and plan

The app includes city lookup, cached and validated air forecasts, stale-data checks, a basic rule-based plan, an offline scenario at `/scenarios`, an outing-window comparison at `/planner`, a factor-based emissions comparison at `/impact`, and an assistant at `/assistant`. The assistant uses a deterministic fallback unless Gemini and shared rate-limiter credentials are configured. Recommendations are general information and not medical advice.

Gemini is optional. Set `GEMINI_API_KEY`, `GEMINI_MODEL`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` in `.env.local`. Without both Upstash credentials the assistant never calls Gemini. A global limit of 3 requests per minute and 20 per day applies when configured; rate-limit errors fail closed to the fallback. Verify that the Google and Upstash projects are on free tiers before enabling them. Free-tier Gemini content may be used by Google to improve products; the interface asks users not to enter personal or medical details. AI output is schema-checked and action references are validated, but free text can still be wrong.

Do not deploy publicly yet: the air and location endpoints still need shared abuse protection and the app needs broader accessibility, route, and browser tests. GitHub Actions is intentionally disabled.

Open-Meteo responses are cached by Next.js for 30 minutes for air data and 24 hours for locations. Cache availability and sharing depend on the deployment environment; there is no uptime guarantee.
