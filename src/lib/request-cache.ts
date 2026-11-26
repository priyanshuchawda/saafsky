type CachedValue<T> = {
  value: T;
  expiresAt: number;
};

export type RequestCache<T> = {
  load(key: string, loader: () => Promise<T>): Promise<T>;
  invalidate(key: string): void;
  clear(): void;
};

/** Cache successful values and share concurrent requests by key. */
export function createRequestCache<T>(
  ttlMs: number,
  now: () => number = Date.now,
  maxEntries = 20,
): RequestCache<T> {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new RangeError("Request cache TTL must be a positive finite number");
  }
  if (!Number.isSafeInteger(maxEntries) || maxEntries <= 0) {
    throw new RangeError("Request cache size must be a positive integer");
  }

  const values = new Map<string, CachedValue<T>>();
  const pending = new Map<string, Promise<T>>();

  return {
    load(key, loader) {
      const cached = values.get(key);
      if (cached && cached.expiresAt > now()) {
        values.delete(key);
        values.set(key, cached);
        return Promise.resolve(cached.value);
      }
      if (cached) values.delete(key);

      const inFlight = pending.get(key);
      if (inFlight) return inFlight;

      let request: Promise<T>;
      try {
        request = Promise.resolve(loader());
      } catch (error) {
        request = Promise.reject(error);
      }

      const tracked = request
        .then((value) => {
          values.delete(key);
          values.set(key, { value, expiresAt: now() + ttlMs });
          while (values.size > maxEntries) {
            const oldest = values.keys().next();
            if (oldest.done) break;
            values.delete(oldest.value);
          }
          return value;
        })
        .finally(() => {
          if (pending.get(key) === tracked) pending.delete(key);
        });
      pending.set(key, tracked);
      return tracked;
    },
    invalidate(key) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
}
