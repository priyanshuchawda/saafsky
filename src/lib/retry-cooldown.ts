type RetryCooldownStore = {
  get(key: string): number | null;
  set(key: string, retryAt: number): void;
  clear(key: string): void;
};

/** Keep server-request cooldowns shared across mounted air-data consumers. */
export function createRetryCooldownStore(
  now: () => number = Date.now,
  maxEntries = 100,
): RetryCooldownStore {
  if (!Number.isSafeInteger(maxEntries) || maxEntries <= 0) {
    throw new RangeError("Retry cooldown capacity must be a positive integer");
  }

  const deadlines = new Map<string, number>();

  return {
    get(key) {
      const retryAt = deadlines.get(key);
      if (retryAt === undefined) return null;
      if (retryAt <= now()) {
        deadlines.delete(key);
        return null;
      }
      deadlines.delete(key);
      deadlines.set(key, retryAt);
      return retryAt;
    },
    set(key, retryAt) {
      if (!key || !Number.isFinite(retryAt) || retryAt <= now()) {
        deadlines.delete(key);
        return;
      }
      deadlines.delete(key);
      deadlines.set(key, retryAt);
      while (deadlines.size > maxEntries) {
        const oldest = deadlines.keys().next();
        if (oldest.done) break;
        deadlines.delete(oldest.value);
      }
    },
    clear(key) {
      deadlines.delete(key);
    },
  };
}
