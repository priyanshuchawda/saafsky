/** Try one distinct alternative only for a model-specific availability failure. */
export async function withModelFallback<T>(
  primary: string,
  fallback: string | undefined,
  run: (model: string) => Promise<T>,
  reserveAttempt: () => Promise<boolean>,
): Promise<T> {
  try {
    return await run(primary);
  } catch (error) {
    const status =
      error instanceof Error && "status" in error ? error.status : undefined;
    if (
      !fallback ||
      fallback === primary ||
      ![404, 429, 503].includes(typeof status === "number" ? status : 0) ||
      !(await reserveAttempt())
    )
      throw error;
    return run(fallback);
  }
}
