export class ClientApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(path, { ...options, headers, credentials: "include" });
  const payload = (await response.json().catch(() => null)) as { error?: { code?: string; message?: string } } & T;
  if (!response.ok) {
    throw new ClientApiError(payload.error?.code ?? "REQUEST_FAILED", payload.error?.message ?? "요청을 처리하지 못했습니다.", response.status);
  }
  return payload;
}
