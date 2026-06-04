export type ApiError = { message?: string; details?: string };

export class ApiRequestError extends Error {
  status?: number;
  details?: string;

  constructor(message: string, opts?: { status?: number; details?: string }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = opts?.status;
    this.details = opts?.details;
  }
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" })
    }
  });

  if (!res.ok) {
    const raw = (await readJsonSafe(res)) as unknown;
    const data = typeof raw === "object" && raw ? (raw as ApiError) : null;
    const message = data?.message || `HTTP ${res.status}`;
    throw new ApiRequestError(message, { status: res.status, details: data?.details });
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const raw = await readJsonSafe(res);
  return raw as T;
}
