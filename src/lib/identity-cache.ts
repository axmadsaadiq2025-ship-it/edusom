import type { User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/roles";
import type { Profile } from "@/hooks/use-auth";

export interface ResolvedIdentity {
  user: User;
  profile: Profile | null;
  roles: AppRole[];
}

const TTL_MS = 5 * 60_000;
let cached: { userId: string; at: number; value: ResolvedIdentity } | null = null;

/** Returns a recently verified identity for this user, or null if stale/absent. */
export function getCachedIdentity(userId: string, now = Date.now()): ResolvedIdentity | null {
  if (!cached || cached.userId !== userId) return null;
  if (now - cached.at > TTL_MS) return null;
  return cached.value;
}

export function setCachedIdentity(value: ResolvedIdentity, now = Date.now()) {
  cached = { userId: value.user.id, at: now, value };
}

export function clearIdentityCache() {
  cached = null;
}
