/** US AQI category upper bounds: https://www.airnow.gov/aqi/aqi-basics/ */
export const US_AQI_UPPER_BOUND = {
  good: 50,
  moderate: 100,
  sensitiveGroups: 150,
  unhealthy: 200,
  veryUnhealthy: 300,
} as const;
