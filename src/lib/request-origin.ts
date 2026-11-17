/** Allow same-origin browsers and non-browser API clients that omit Origin. */
export function hasAllowedJsonOrigin(request: Request): boolean {
  const type = request.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();
  if (type !== "application/json") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
