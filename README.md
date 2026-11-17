# SaafSky

An early-stage air quality companion for a non-commercial hackathon. The dashboard uses Open-Meteo geocoding and modelled air quality estimates. US AQI is not India's CPCB AQI, and forecasts are not local sensor measurements.

## Run locally

Requires Node.js 22.18 or newer. Run `npm ci`, then `npm run dev` and open http://localhost:3000. No API key is required for the dashboard. Open-Meteo's free API is subject to its non-commercial terms and usage limits.

## Checks

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

## Current state and plan

The first increment includes city lookup, cached forecast requests, basic household-sensitive rules and tests. Upcoming work includes runtime validation, reliable freshness metadata, a richer evidence-reviewed rule catalog, demo fixtures, Gemini with a server-only key and privacy controls, shared rate limiting, an emissions calculator, accessibility and end-to-end checks, and deployment. The current recommendations are general information and not medical advice.

Open-Meteo responses are cached by Next.js for 30 minutes for air data and 24 hours for locations. Cache availability and sharing depend on the deployment environment; there is no uptime guarantee.
