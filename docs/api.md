# API reference

The browser uses three same-origin route handlers. Each route validates user or provider data at the boundary and returns JSON. The current implementation is intentionally read-only: it has no account, profile, or conversation-storage endpoints.

## `GET /api/air`

Returns a validated Open-Meteo air-quality snapshot for a coordinate pair.

| Query parameter | Type | Rules |
| --- | --- | --- |
| `lat` | decimal string | Required; range `-90` to `90`; rounded to three decimal places before provider lookup. |
| `lon` | decimal string | Required; range `-180` to `180`; rounded to three decimal places before provider lookup. |

Successful response:

```json
{
  "data": {
    "timezone": "Asia/Kolkata",
    "utc_offset_seconds": 19800,
    "current": {
      "time": "2026-11-18T12:00",
      "us_aqi": 82,
      "pm2_5": 25.1,
      "pm10": 40.2
    },
    "hourly": {
      "time": ["2026-11-18T12:00"],
      "us_aqi": [82]
    }
  },
  "retrievedAt": "2026-11-18T06:30:00.000Z"
}
```

The provider supplies model estimates; `retrievedAt` is when SaafSky received the response. Air responses use a 30-minute Next.js cache. Invalid coordinates return `400`; rate limiting returns `429` with `Retry-After`; unavailable rate-limit protection or provider data returns `503` with a user-safe error.

## `GET /api/locations`

Looks up city names through Open-Meteo Geocoding.

| Query parameter | Type | Rules |
| --- | --- | --- |
| `q` | string | Trimmed; queries shorter than 2 or longer than 80 characters return `{ "results": [] }`. |

The response may contain a `results` array with up to eight validated matches. Each result includes `name`, `latitude`, `longitude`, and optional `admin1` and `country`. An upstream no-match response may omit the array; the browser treats that as an empty result. Results use a 24-hour Next.js cache. Provider failures return `503`; rate limiting follows the shared response contract below.

## `POST /api/chat`

Returns an explanation of the server-generated recommendation plan. The request must use JSON and pass the same-origin check when an `Origin` header is present. The body limit is 12,288 bytes.

All chat responses, including validation and protection errors, send `Cache-Control: no-store` to discourage storage by browsers and intermediaries.

| Field | Type | Rules |
| --- | --- | --- |
| `question` | string | Trimmed; 1–500 characters. |
| `latitude` | number | Finite; `-90` to `90`. |
| `longitude` | number | Finite; `-180` to `180`. |
| `profile` | object | Strict object with `sensitive`, `children`, `outdoorExercise`, `cookingSmoke` booleans and `commute` set to `none`, `walk`, `bike`, `public`, or `car`. |
| `language` | string | Optional; `en` or `hi`, with `en` as the default. |
| `history` | array | Optional; at most four `{ role, text }` entries. Role is `user` or `assistant`; text is at most 500 characters. |

Successful response:

```json
{
  "answer": "Consider the current forecast and keep flexible outdoor activity brief.",
  "referencedActionIds": ["reduce-outdoor-exertion"],
  "sourceIds": ["airnow-aqi"],
  "uncertainty": "Forecasts are model estimates.",
  "mode": "ai"
}
```

`mode` is `ai` or `fallback`. The fallback uses the deterministic action plan when Gemini is unconfigured, unavailable, out of budget, or current air data is not fresh. AI output is schema-validated; action IDs must match actions generated for the request, and source IDs must belong to those actions. The browser maps validated source IDs to the approved evidence catalog and displays the resulting links with the answer.

Invalid JSON or schema returns `400`; an oversized body returns `413`; a rejected origin or content type returns `403`; a request limit returns `429` with `Retry-After`; unavailable public request protection returns `503`. Gemini generation is bounded to 500 output tokens and a 12-second SDK timeout.

## Shared quotas and deployment behavior

Air and location requests share per-route budgets of 30 requests per minute and 1,000 per day. Chat requests have route budgets of 5 per minute and 50 per day. On Vercel, per-visitor limits are also applied: air and location use 15 per minute; chat uses 3 per minute and 5 per day. Gemini generation has additional global budgets of 3 attempts per minute and 20 per day, including a reserved attempt for model fallback.

Shared counters use Upstash Redis. Vercel requests fail closed if limiter configuration or trusted visitor identity is unavailable. Other public hosts can enable fail-closed shared limits with `SAAFSKY_PUBLIC=true`; local development without shared credentials remains available and serves deterministic assistant fallback. See [security and privacy](security-privacy.md) for the trusted client-key design.

## Reproduce contract checks

```sh
npm run test:coverage
npm run test:e2e:production
npm run test:protection
```

Provider-injected API tests cover successful responses, invalid inputs, provider failures, request limits, malformed provider responses, bounded request bodies, and cross-origin chat requests without live provider calls.
