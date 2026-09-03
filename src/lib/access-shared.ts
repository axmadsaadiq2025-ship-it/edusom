import type { AppRole } from "./roles";

/** Authorization outcome for an authenticated identity (Google or email/password). */
export type AccessState = "active" | "pending" | "suspended" | "unregistered";

export interface AccessResult {
  state: AccessState;
  isSuper: boolean;
  roles: AppRole[];
  schoolId: string | null;
  /** Where an authorized user should land. */
  redirectTo: "/platform/dashboard" | "/dashboard" | null;
}

export const ACCESS_COPY: Record<
  Exclude<AccessState, "active">,
  { title: string; description: string }
> = {
  unregistered: {
    title: "Google account not registered",
    description:
      "Your Google account has not been registered with EduSom yet. Please contact your school administrator or request a demo.",
  },
  pending: {
    title: "Access pending approval",
    description:
      "Your EduSom account has been registered, but access is still waiting for approval.",
  },
  suspended: {
    title: "Account access unavailable",
    description:
      "Your EduSom account is currently inactive. Please contact your school administrator.",
  },
};

export function isAccessState(value: unknown): value is Exclude<AccessState, "active"> {
  return value === "unregistered" || value === "pending" || value === "suspended";
}
