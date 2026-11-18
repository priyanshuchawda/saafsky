# Data sources and impact methodology

## Air quality

[Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) supplies modeled forecasts and pollutant concentrations. Air-quality model attribution is shown for the Copernicus Atmosphere Monitoring Service (CAMS). [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) resolves city searches. SaafSky uses the providers' free access tiers in its current deployment; provider terms, quotas, and eligibility govern continued access.

The dashboard labels its index **US AQI** and presents PM2.5 and PM10 in µg/m³ when valid values are available. Source, forecast time, and retrieval time give each reading useful context. These are grid-scale model estimates, so station observations and local conditions can provide additional context. SaafSky uses the US AQI scale described in [AirNow's AQI guidance](https://www.airnow.gov/aqi/aqi-basics/); it does not convert the forecast into India's CPCB National AQI.

Air responses use a 30-minute Next.js cache and city-search results use a 24-hour cache. The planner compares available hourly local-time windows, accounting for the selected time period, activity duration, household context, and fixed commitments. It only presents complete forecast windows, making the comparison reproducible from the available hourly data.

## Transport estimates

The commute page multiplies round-trip distance, travel days, and a per-passenger-kilometre factor, then compares the baseline with the chosen alternative. Vehicle factors are divided by the selected occupancy. Defaults use the [UK government's 2025 conversion factors](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025): 0.16272 kg CO₂e per petrol-car vehicle-km and 0.10385 kg CO₂e per local-bus passenger-km. Users can enter a sourced factor suited to another region or transport scenario.

Walking and cycling are assigned zero direct vehicle emissions in this comparison. The estimate focuses on the selected travel factors and does not model lifecycle emissions, local AQI changes, or individual exposure. During poor outdoor air, the app separately encourages users to consider current conditions and practical travel alternatives. This keeps the emissions comparison distinct from the exposure decision.
