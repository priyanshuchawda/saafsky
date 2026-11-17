# Security and privacy

## Data flow

The selected city is saved in browser local storage. Household choices are held in session storage for the tab. Chat messages remain in page memory and up to two preceding exchanges may be sent with a question to Gemini when configured. Location searches and coordinates are sent to Open-Meteo through the app; Gemini receives current US AQI, up to 12 upcoming hourly estimates, their time zone, and the selected action descriptions rather than precise coordinates. Actions can reflect generalized household choices. The settings page clears saved preferences, and the assistant can clear its conversation.

Gemini free-tier terms may permit content to be used to improve Google's products. Do not enter names, medical histories, identifying information about children or other sensitive details. See [Google's API terms](https://ai.google.dev/gemini-api/terms) for applicable conditions. Google and other providers may process data under their own terms; browser storage controls do not erase provider records.

## Controls and limits

- Secrets are server-side environment variables, excluded from Git. Never put them in `NEXT_PUBLIC_` variables or issue reports.
- Zod validates incoming requests and external responses. Chat has a bounded request body, model timeout and no automatic retries. An origin check applies when an Origin header is present.
- Shared Upstash quotas protect API routes when configured. Vercel deployments also use a keyed, short-lived pseudonymous visitor identifier derived from its trusted forwarding header. A separate `RATE_LIMIT_HASH_SECRET` is required. Global limits can affect all visitors at once.
- On Vercel or when `SAAFSKY_PUBLIC=true`, missing shared limiter credentials fail closed. On Vercel, missing trusted visitor data or hashing secret also fails closed. Non-Vercel public hosts currently get global, not per-visitor, limits.
- The AI receives server-selected actions, and returned action IDs are checked. Schema validation and source checks do not prove generated prose is accurate or eliminate prompt injection.
- Security response headers are configured, but there is no complete Content Security Policy. Do not treat these controls as a security certification.

For local use, missing Upstash credentials permit ordinary dashboard access, while AI falls back without making a Gemini call. Expired or unreachable configured Redis credentials can still cause requests to fail closed. Public operation requires an owner-controlled, functioning database and appropriate free-tier limits; temporary test databases expire.

Report suspected vulnerabilities privately to the repository owner; do not post credentials, prompts or personal information in a public issue. Rotate exposed credentials immediately.
