import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
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

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async (s: Session | null) => {
      if (!s?.user) {
        setProfile(null);
        setRoles([]);
        return;
      }
      // Defer supabase calls to avoid deadlocks inside onAuthStateChange
      setTimeout(async () => {
        if (!mounted) return;
        const [{ data: p }, { data: r }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", s.user.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", s.user.id),
        ]);
        if (!mounted) return;
        setProfile((p as Profile) ?? null);
        setRoles(((r ?? []) as { role: AppRole }[]).map((x) => x.role));
      }, 0);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      load(s);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      load(data.session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    roles,
  };
}
