/**
 * Remembers which name *this device* submitted for a given group, so the
 * chat knows who's typing without needing accounts/auth. Set right after a
 * profile is submitted (create or join flow); the chat falls back to asking
 * if it's missing (different device, cleared storage, etc.).
 */

const key = (groupId: string) => `flatfinds:me:${groupId}`;

export function saveMyName(groupId: string, name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(groupId), name);
}

export function loadMyName(groupId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key(groupId));
}
