export type AuthUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  avatar_path: string | null;
};

export type DeskKind = "admin" | "security" | "staff";

export type Membership = {
  organizationId: number;
  organizationName: string;
  status: "pending" | "approved" | "rejected" | string;
  role: string;
  roleSlug: string;
  billingStatus: string;
  canCheckIn: boolean;
  canViewAll: boolean;
};

export type Session = {
  token: string;
  user: AuthUser;
  memberships: Membership[];
  activeOrganizationId: number | null;
};

export type RegisterOrganizationInput = {
  organization_name: string;
  department_name?: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  email_code: string;
};

export type JoinLookup = {
  organization: { id: number; name: string };
  roles: Array<{ id: number; name: string; slug: string }>;
  departments: Array<{ id: number; name: string }>;
};

export type JoinOrganizationInput = {
  join_code: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  role_id: number;
  department_id?: number | null;
  email_code: string;
};

export type HostHit = {
  id: number;
  name: string;
  phone: string | null;
  username: string;
  avatar_path: string | null;
  role: string | null;
  department: string | null;
};

export type VisitRow = {
  id: number;
  visitor_name: string;
  visitor_phone: string | null;
  purpose: string | null;
  status: string;
  hold_reason: string | null;
  host_id: number;
  created_at: string;
  host?: {
    id: number;
    name: string;
    phone: string | null;
    avatar_path?: string | null;
  };
};