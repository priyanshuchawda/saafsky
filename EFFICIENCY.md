# Efficiency and performance

SaafSky keeps routine air-quality decisions deterministic and uses Gemini only
for optional explanations. Provider work is cached and bounded, and the
dashboard remains useful when the language model is unavailable.

## Resource controls

| Resource           | Control                                                                                                        | Implementation                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Air forecasts      | Server cache, client request deduplication, bounded LRU cache, request timeout                                 | `src/server/air-provider.ts`, `src/lib/request-cache.ts`, `src/hooks/use-air-quality.ts`         |
| Location search    | Debounced input, cancellation, bounded query, provider cache                                                   | `src/components/location-search.tsx`, `src/server/locations-endpoint.ts`                         |
| Gemini             | Shared per-minute and daily budgets, bounded history and output tokens, timeout, one reserved fallback attempt | `src/server/chat.ts`, `src/features/assistant/model-fallback.ts`, `src/config/server-budgets.ts` |
| Public APIs        | Shared visitor and global request budgets with fail-closed production behavior                                 | `src/server/rate-limit.ts`, `src/server/rate-limit-stages.ts`                                    |
| Browser JavaScript | Gzip budget across emitted client chunks                                                                       | `scripts/check-bundle.mjs`                                                                       |

The city-keyed retry cooldown is shared by mounted air-data consumers. Automatic
refresh and manual retry observe the same `Retry-After` deadline, preventing a
route change from triggering a request during a server-imposed cooldown.

## Reproduce measurements

Run the production bundle measurement after a clean build:

```powershell
npm run build
npm run check:bundle
```

The bundle checker sums gzip sizes of emitted client JavaScript and fails above
the configured 300 KiB budget. It is a project-wide emitted-asset measure; it
does not represent a route-specific first-load transfer or a Web Vitals score.

The release browser suite measures real rendered routes, mobile reflow, and
interaction behavior against the production server:

```powershell
npm run test:e2e:production
```

## Measurement record

Values below are refreshed in `SELF_AUDIT.md` after running the local release
verification. Live request latency and Core Web Vitals are reported only when
measured in a browser session; they are not inferred from bundle size.
