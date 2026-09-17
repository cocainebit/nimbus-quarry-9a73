// Parse a JSON API response, turning empty or non-JSON bodies (a restarting
// API, a proxy error, a throttled route) into a readable error instead of
// "Unexpected end of JSON input".
export async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (text) {
    try {
      return JSON.parse(text);
    } catch {
      // fall through to a status-based message
    }
  }
  const status = response.status;
  throw new Error(
    status === 429
      ? "Too many requests. Try again in a minute."
      : status >= 500 || status === 0
        ? `The server did not respond (${status}). Try again in a moment.`
        : `Unexpected server response (${status}).`,
  );
}
