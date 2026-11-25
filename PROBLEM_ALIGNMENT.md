# Challenge alignment

SaafSky addresses urban air-quality decisions by connecting modeled city
conditions, household context, practical routines, sustainable travel choices,
and an optional AI explanation. The rule engine remains the source of the
recommendations; Gemini explains the selected actions.

## Requirement traceability

| Challenge need                      | SaafSky implementation                                                                                                                                                                             | Verification                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Smart, dynamic assistant            | `/assistant` sends a bounded question with current air context; server-side Gemini explains selected actions and validates action/source references. A deterministic plan is available on failure. | `tests/assistant-orchestration.test.ts`, `tests/assistant.test.ts`, `tests/e2e/journeys.spec.ts` |
| Decisions based on user context     | Household sensitivity, children, outdoor exercise, commuting, and cooking context affect recommendation and planning rules.                                                                        | `tests/recommendations.test.ts`, `tests/planner.test.ts`, `tests/e2e/journeys.spec.ts`           |
| Practical everyday use              | City search and modeled forecast feed the dashboard, outing planner, indoor-air guide, and commute comparison. Preferences and language selection remain available across visits.                  | `tests/air.test.ts`, `tests/e2e/mobile-search.spec.ts`, `tests/e2e/responsive-pages.spec.ts`     |
| Explainable recommendations         | Recommendations carry stable IDs, reason codes, and approved evidence IDs; the UI links only to the approved source catalogue.                                                                     | `tests/evidence.test.ts`, `tests/i18n.test.ts`, `tests/assistant.test.ts`                        |
| Sustainable choices with trade-offs | Commute estimates use explicit factors and show emissions separately from outdoor exposure considerations.                                                                                         | `tests/impact.test.ts`, `tests/commute-exposure.test.ts`, `tests/e2e/journeys.spec.ts`           |
| Inclusive bilingual experience      | English and Hindi are available across navigation, guidance, search, and assistant responses. Responsive and accessibility checks cover the primary routes.                                        | `tests/i18n.test.ts`, `tests/e2e/accessibility.spec.ts`, `tests/e2e/responsive-pages.spec.ts`    |

## Product flows

| Route        | User outcome                                                | Core implementation                                                               |
| ------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/`          | Review city conditions, trend, and priority actions         | `src/app/page.tsx`, `src/server/air-provider.ts`, `src/features/recommendations/` |
| `/planner`   | Compare outing windows against availability and duration    | `src/app/planner/`, `src/features/planner/`                                       |
| `/indoor`    | Choose practical household particle-reduction steps         | `src/app/indoor/`, `src/features/indoor/`                                         |
| `/impact`    | Compare estimated commute emissions and exposure trade-offs | `src/app/impact/`, `src/features/sustainability/`                                 |
| `/assistant` | Ask for a contextual explanation in English or Hindi        | `src/app/assistant/`, `src/app/api/chat/`, `src/server/chat.ts`                   |
| `/scenarios` | Explore offline household and AQI scenarios                 | `src/app/scenarios/`, `src/features/recommendations/`                             |
| `/settings`  | Manage saved preferences and language                       | `src/app/settings/`, `src/hooks/use-preferences.ts`                               |

See the [README](README.md) for the user journey and [decision policy](docs/decision-policy.md)
for the documented recommendation rules and assumptions.
