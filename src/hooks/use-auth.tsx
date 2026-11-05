import { useRouteContext } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/roles";

export interface Profile {
  id: string;
  school_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
}

/**
 * Reads the identity already resolved by the protected layout's beforeLoad.
 * Previously every page mounting this hook re-fetched the session, profile and
 * roles; now it is a zero-request context read.
 */
export function useAuth(): AuthState {
  const ctx = useRouteContext({ strict: false }) as
    | { user: User; profile: Profile | null; roles: AppRole[] }
    | undefined;
  return {
    loading: false,
    session: null,
    user: ctx?.user ?? null,
    profile: ctx?.profile ?? null,
    roles: ctx?.roles ?? [],
  };
}
