export class RequestBodyTooLarge extends Error {}

/** Read only a bounded amount even when Content-Length is absent or incorrect. */
export async function readBoundedJson(
  request: Request,
  limit: number,
): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > limit) {
    throw new RequestBodyTooLarge();
  }
  if (!request.body) throw new SyntaxError("Missing body");

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;

      bytes += chunk.value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new RequestBodyTooLarge();
      }

      text += decoder.decode(chunk.value, { stream: true });
    }

    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}
