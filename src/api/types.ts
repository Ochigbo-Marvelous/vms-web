export type AuthUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  avatar_path: string | null;
};

export type Membership = {
  organizationId: number;
  organizationName: string;
  status: "pending" | "approved" | "rejected" | string;
  role: string;
  billingStatus: string;
};

export type Session = {
  token: string;
  user: AuthUser;
  memberships: Membership[];
  activeOrganizationId: number | null;
};

export type RegisterOrganizationInput = {
  organization_name: string;
  department_name: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  email_code: string;
};

export type JoinLookup = {
  organization: {
    id: number;
    name: string;
  };
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
  department_id: number;
  email_code: string;
};