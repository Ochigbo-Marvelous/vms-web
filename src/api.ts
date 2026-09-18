const BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  details: Record<string, string[]>;

  constructor(message: string, status: number, details: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const first = body.message || body.error || "Request failed.";
    throw new ApiError(first, res.status, body.errors ?? {});
  }

  return body as T;
}

export type AuthUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  avatar_path: string | null;
};

export type AuthPayload = {
  token: string;
  user: AuthUser;
  memberships?: Array<{
    organization_id: number;
    organization_name: string;
    status: string;
    role: string;
    billing_status: string;
  }>;
};

export function registerOrganization(input: {
  organization_name: string;
  department_name: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}) {
  return api<AuthPayload>("/api/auth/register-organization", {
    method: "POST",
    body: JSON.stringify(input),
  });
}