# Efficiency and performance

SaafSky keeps routine air-quality decisions deterministic and uses Gemini only
for optional explanations. Provider work is cached and bounded, and the
dashboard remains useful when the language model is unavailable.

## Resource controls

| Resource           | Control                                                                                                        | Implementation                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Air forecasts      | Server cache, client request deduplication, bounded LRU cache, request timeout                                 | `src/server/air-provider.ts`, `src/lib/request-cache.ts`, `src/hooks/use-air-quality.ts`         |
| Location search    | Explicit form submission, cancellation of the previous in-flight search, bounded query, provider cache         | `src/components/location-search.tsx`, `src/server/locations-endpoint.ts`                         |
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

The following baseline was measured on November 26, 2026, against the local
production build using Lighthouse 13.6.0 in mobile mode. The readings are
repeatable lab measurements; device, network, and runtime variation can change
them. They are not field Core Web Vitals.

| Route       | Performance |   LCP |   TBT |   CLS | Script transfer |
| ----------- | ----------: | ----: | ----: | ----: | --------------: |
| Dashboard   |          87 | 905ms | 520ms | 0.008 |       202,697 B |
| Planner     |          85 | 761ms | 595ms | 0.000 |       213,414 B |
| Indoor air  |          88 | 763ms | 484ms | 0.000 |       210,065 B |
| Commute     |          86 | 759ms | 547ms | 0.000 |       209,752 B |
| Assistant   |          91 | 758ms | 367ms | 0.000 |       208,356 B |
| Preferences |          91 | 758ms | 373ms | 0.000 |       205,096 B |
| Scenarios   |          93 | 870ms | 328ms | 0.000 |       208,892 B |

Reproduce the route table after `npm run build` with:

```powershell
.\scripts\measure-lighthouse.ps1
```

The script starts the local production server, audits all seven routes, prints
compact measurements, and stops the server. These lab results complement the
project-wide gzip budget; script transfer on one route is a separate measure.
