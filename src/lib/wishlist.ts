/**
 * A private, per-browser save list — not shared with the group, doesn't
 * affect matching, and carries no "match"/outcome framing. Just "save this
 * one to look at again," scoped per group so different searches don't mix.
 */

const key = (groupId: string) => `flatfinds:wishlist:${groupId}`;

// localStorage's own "storage" event only fires in *other* tabs, never the
// one that made the change — so two components on the same page (a card's
// heart button and the tab counter) each holding their own useWishlist()
// state won't see each other's updates without this.
const CHANGE_EVENT = "flatfinds:wishlist-changed";

export function loadWishlist(groupId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(groupId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveWishlist(groupId: string, listingIds: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(groupId), JSON.stringify(listingIds));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { groupId } }));
}

export function onWishlistChange(groupId: string, callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ groupId: string }>).detail;
    if (detail?.groupId === groupId) callback();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
