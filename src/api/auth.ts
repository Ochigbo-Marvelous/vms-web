import { http } from "./http";
import type {
  AuthUser,
  JoinLookup,
  JoinOrganizationInput,
  Membership,
  RegisterOrganizationInput,
  Session,
} from "./types";

type RawMembership = {
  organization_id?: number;
  organizationId?: number;
  organization_name?: string;
  organizationName?: string;
  organization?: { id?: number; name?: string };
  status?: string;
  role?: string;
  role_name?: string;
  billing_status?: string;
  billingStatus?: string;
};

type RawAuthResponse = {
  token?: string;
  user?: Partial<AuthUser> & {
    id?: number;
    memberships?: RawMembership[];
    organizations?: RawMembership[];
  };
  memberships?: RawMembership[];
  organizations?: RawMembership[];
  organization?: { id?: number; name?: string };
};

export type LoginInput = {
  login: string;
  password: string;
};

function asMembership(row: RawMembership): Membership | null {
  const organizationId =
    row.organization_id ??
    row.organizationId ??
    row.organization?.id;

  if (typeof organizationId !== "number") return null;

  return {
    organizationId,
    organizationName:
      row.organization_name ??
      row.organizationName ??
      row.organization?.name ??
      "Organization",
    status: row.status ?? "approved",
    role: row.role ?? row.role_name ?? "Staff",
    billingStatus: row.billing_status ?? row.billingStatus ?? "trial",
  };
}

function collectMemberships(raw: RawAuthResponse): Membership[] {
  const bags = [
    raw.memberships,
    raw.organizations,
    raw.user?.memberships,
    raw.user?.organizations,
  ].filter(Boolean) as RawMembership[][];

  const rows = bags.flat().map(asMembership).filter((row): row is Membership => row !== null);

  if (!rows.length && typeof raw.organization?.id === "number") {
    rows.push({
      organizationId: raw.organization.id,
      organizationName: raw.organization.name ?? "Organization",
      status: "approved",
      role: "Admin",
      billingStatus: "trial",
    });
  }

  const seen = new Set<number>();
  return rows.filter((row) => {
    if (seen.has(row.organizationId)) return false;
    seen.add(row.organizationId);
    return true;
  });
}

function asSession(raw: RawAuthResponse): Session {
  if (!raw.token || !raw.user?.id || !raw.user.name || !raw.user.email || !raw.user.username) {
    throw new Error("Auth response was incomplete.");
  }

  const memberships = collectMemberships(raw);

  return {
    token: raw.token,
    user: {
      id: raw.user.id,
      name: raw.user.name,
      username: raw.user.username,
      email: raw.user.email,
      phone: raw.user.phone ?? null,
      avatar_path: raw.user.avatar_path ?? null,
    },
    memberships,
    activeOrganizationId: memberships[0]?.organizationId ?? null,
  };
}

export function registerOrganization(input: RegisterOrganizationInput) {
  return http<RawAuthResponse>("/api/auth/register-organization", {
    method: "POST",
    body: input,
  }).then(asSession);
}

export function login(input: LoginInput) {
  return http<RawAuthResponse>("/api/auth/login", {
    method: "POST",
    body: input,
  }).then(asSession);
}

export function lookupOrganization(joinCode: string) {
  return http<JoinLookup>("/api/auth/lookup-organization", {
    method: "POST",
    body: { join_code: joinCode },
  });
}

export function joinOrganization(input: JoinOrganizationInput) {
  return http<{ message: string }>("/api/auth/join-organization", {
    method: "POST",
    body: input,
  });
}

export function requestEmailChallenge(email: string, purpose: "register" | "join") {
  return http<{ message: string }>("/api/auth/email/challenge", {
    method: "POST",
    body: { email, purpose },
  });
}