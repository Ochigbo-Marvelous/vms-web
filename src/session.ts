import type { AuthPayload } from "./api";

const TOKEN = "hostpass_token";
const USER = "hostpass_user";
const ORG = "hostpass_org";

export function saveSession(payload: AuthPayload) {
  localStorage.setItem(TOKEN, payload.token);
  localStorage.setItem(USER, JSON.stringify(payload.user));
  const first = payload.memberships?.[0];
  if (first) {
    localStorage.setItem(ORG, String(first.organization_id));
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN);
}

export function getUser() {
  const raw = localStorage.getItem(USER);
  return raw ? (JSON.parse(raw) as AuthPayload["user"]) : null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(USER);
  localStorage.removeItem(ORG);
}