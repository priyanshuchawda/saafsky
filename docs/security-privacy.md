# Security and privacy

SaafSky keeps preferences close to the user and protects public API access with shared request limits and server-side credentials.

## Data and controls

The selected city and language are stored in browser local storage, household choices in tab session storage, and chat messages in page memory. Settings can clear preferences, and the assistant can clear its conversation. City searches and coordinates reach Open-Meteo through the application. Gemini receives the question, up to two previous exchanges, current US AQI, up to 12 forecast hours, the time zone, and selected action descriptions; precise coordinates are not included in the Gemini context.

Gemini free-tier content may be used to improve Google's products. Keep questions focused on air quality and general routines, and avoid names, medical histories, or identifying details. See [Google's API terms](https://ai.google.dev/gemini-api/terms) for the applicable conditions.

## Security controls

- Credentials remain in server-side environment variables and are excluded from Git.
- Zod validates incoming requests and external responses. Chat requests have body and output limits, a model timeout, and origin checks when an Origin header is present.
- Shared Upstash quotas protect routes. On Vercel, a keyed pseudonymous visitor identifier supports additional per-visitor limits. Public requests require functioning rate-limit configuration and trusted visitor information.
- The assistant receives server-selected actions. Responses are schema-validated and action and evidence references are checked against the approved catalog. Generated prose still requires careful interpretation.
- Security response headers provide browser protections. The current configuration does not include a complete Content Security Policy.

Provider availability and shared quotas can affect requests. Public deployments should use owner-controlled Upstash credentials and an independently generated `RATE_LIMIT_HASH_SECRET`.

Report suspected vulnerabilities privately to the repository owner, excluding credentials and personal information from reports. Rotate exposed credentials immediately.
