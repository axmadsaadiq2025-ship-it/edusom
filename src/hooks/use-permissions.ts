import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  permissionsFor,
  portalFor,
  primaryRole,
  type Permission,
  type Portal,
} from "@/lib/permissions";
import type { AppRole } from "@/lib/roles";

export interface PermissionState {
  loading: boolean;
  roles: AppRole[];
  role: AppRole | null;
  portal: Portal;
  can: (p: Permission) => boolean;
  canAny: (ps: Permission[]) => boolean;
}

export function usePermissions(): PermissionState {
  const { roles, loading } = useAuth();
  return useMemo(() => {
    const set = permissionsFor(roles);
    const can = (p: Permission) => set.has(p);
    return {
      loading,
      roles,
      role: primaryRole(roles),
      portal: portalFor(roles),
      can,
      canAny: (ps: Permission[]) => ps.some(can),
    };
  }, [roles, loading]);
}
