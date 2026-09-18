import type { Session } from "../api/types";

const KEY = "hostpass.session.v1";

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.token || !parsed.user?.id) return null;
    return parsed;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function writeSession(session: Session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

