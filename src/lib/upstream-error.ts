/** A provider returned an unsuccessful HTTP response; no payload is retained. */
export class UpstreamHttpError extends Error {
  readonly status: number | null;
  constructor(status: number | null = null) {
    super("Upstream request failed");
    this.status = status;
  }
}
