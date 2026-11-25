/** Central request, provider, and cache limits; changing these needs review. */
export const SERVER_BUDGETS = {
  requests: {
    air: { minute: 30, day: 1000, visitorMinute: 15 },
    locations: { minute: 30, day: 1000, visitorMinute: 15 },
    chat: { minute: 5, day: 50, visitorMinute: 3, visitorDay: 5 },
  },
  ai: { minute: 3, day: 20, maxOutputTokens: 500 },
  timeouts: { airForecastMs: 8000, geocodingMs: 8000, geminiMs: 12000 },
  cache: {
    air: { staleSeconds: 1800, revalidateSeconds: 1800, expireSeconds: 3600 },
    locationsRevalidateSeconds: 86400,
  },
  chatBodyBytes: 12_288,
} as const;
