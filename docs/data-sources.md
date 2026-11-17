# Data sources and impact methodology

## Air quality

[Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) supplies model-based forecasts and pollutant concentrations. The underlying atmospheric model is attributed to the Copernicus Atmosphere Monitoring Service (CAMS), as required by the provider. [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) resolves city searches. Free access is subject to the providers' terms, limits and non-commercial eligibility.

The displayed index is **US AQI**, not India's CPCB National AQI. It is an estimate for a model grid, not a measurement at a home, road, school or monitoring station. PM2.5 and PM10 concentrations are displayed in µg/m³ when valid and current. The app does not measure indoor air. Retrieval time and the model's time are distinct; stale or unavailable values do not become safe readings. See [AirNow's AQI guidance](https://www.airnow.gov/aqi/aqi-basics/) for the named index.

Air responses use a 30-minute Next.js cache and location results use a 24-hour cache. Effective cache sharing and freshness depend on the host. The planner uses local forecast times; missing or duplicate hourly wall times cannot form a complete outing window. Model estimates, time-zone transitions, changing conditions and local sources limit the precision of any suggested time.

## Transport estimates

The impact page multiplies round-trip kilometres, travel days and a per-passenger-kilometre factor. It subtracts the alternative estimate from the baseline; negative results mean the alternative is estimated to emit more. A petrol-car factor is divided by user-selected occupancy. Defaults use the [UK government's 2025 conversion factors](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025): 0.16272 kg CO₂e per vehicle-km for a petrol car and 0.10385 kg CO₂e per passenger-km for a local bus. These are UK proxies, not measured Indian emissions. Users can enter their own passenger-km factor.

Walking and cycling use zero direct vehicle emissions in this comparison. The estimate excludes lifecycle effects, induced travel and individual exposure. It cannot establish a change in local AQI or a health benefit. When outdoor air is poor, a lower-emission journey can still mean greater exposure near traffic.
