# Decision policy

SaafSky turns a validated US AQI value and household choices into a prioritized action plan. Each action has a stable ID, category, priority, reason codes, and evidence IDs. The interface explains why each action appears; sources are maintained in `src/features/recommendations/evidence.ts`. Gemini explains those selected actions, and its action and evidence references are checked against the supplied catalog.

## Air-quality guidance

When current data needs a refresh, the dashboard identifies that state and points people toward an official local source. General indoor smoke guidance remains available. Above US AQI 100, the policy adds caution for sensitive groups. Above 150, or above 100 for a household marked sensitive or with children, it recommends reducing prolonged or strenuous outdoor activity. Above 200, it adds an essential-trips precaution. Commute and cooking choices add relevant actions to the same plan.

These rules provide clear, repeatable daily decision support. They complement individual care guidance and do not diagnose health conditions.

## Outing planner

The planner compares complete hourly forecast windows inside the selected period, for durations of one to four hours. A fixed commitment excludes overlapping windows. Among the remaining options, it selects the window with the lowest peak AQI, then uses the earlier start time to break ties. Complete windows keep the comparison consistent with the hourly forecast.

The optional quick-range button fills the start and end with up to 12 consecutive forecast hours, using an observed hourly timestamp as the exclusive end boundary. It stops at missing or ambiguous hours and preserves any entered commitment. Selecting a new city clears city-local time fields so an old location's schedule is not silently interpreted in the new time zone.

For flexible activities, windows above US AQI 100 for sensitive households or above 150 for other households are marked unsuitable. For essential trips, the planner can show the lowest available window with its elevated-risk context. A lower forecast is a relative comparison, not a safety certification.

The daily timeline offers broad morning, daytime, and evening suggestions. The outing planner handles specific durations and commitments. Indoor guidance combines household answers with available outdoor conditions and presents advice as guidance, not an indoor sensor reading. The evidence catalog includes [AirNow](https://www.airnow.gov/aqi/aqi-basics/), [EPA indoor-air guidance](https://www.epa.gov/indoor-air-quality-iaq), and [EPA near-road air information](https://www.epa.gov/air-research/near-roadway-air-pollution-and-health-frequently-asked-questions).
