export class HttpError extends Error {
  readonly status: number;
  readonly fields: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    fields: Record<string, string[]> = {}
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.fields = fields;
  }
}

const BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

const TIMEOUT_MS = 15000;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  organizationId?: number | string | null;
  signal?: AbortSignal;
};

function firstMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const row = payload as Record<string, unknown>;
  if (typeof row.message === "string" && row.message.trim()) return row.message;
  if (typeof row.error === "string" && row.error.trim()) return row.error;
  return fallback;
}

function fieldErrors(payload: unknown): Record<string, string[]> {
  if (!payload || typeof payload !== "object") return {};
  const errors = (payload as { errors?: unknown }).errors;
  if (!errors || typeof errors !== "object") return {};
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      out[key] = value.filter((item): item is string => typeof item === "string");
    }
  }
  return out;
}

export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = new Headers({
    Accept: "application/json",
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  if (options.organizationId != null && options.organizationId !== "") {
    headers.set("X-Organization-Id", String(options.organizationId));
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal ?? controller.signal,
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      throw new HttpError(
        firstMessage(
          payload,
          res.status === 402 ? "Organization is locked." : "Request failed."
        ),
        res.status,
        fieldErrors(payload)
      );
    }

    return payload as T;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new HttpError("The server took too long.", 408);
    }
    throw new HttpError("Cannot reach the API. Confirm vms-api is running.", 0);
  } finally {
    window.clearTimeout(timer);
  }
}

export function flattenFields(fields: Record<string, string[]>): string | null {
  const first = Object.values(fields).flat()[0];
  return first ?? null;
}