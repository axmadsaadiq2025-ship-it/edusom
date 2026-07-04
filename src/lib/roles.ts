export type AppRole =
  | "super_admin"
  | "school_owner"
  | "principal"
  | "vice_principal"
  | "accountant"
  | "registrar"
  | "teacher"
  | "librarian"
  | "parent"
  | "student";

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  school_owner: "School Owner",
  principal: "Principal",
  vice_principal: "Vice Principal",
  accountant: "Accountant",
  registrar: "Registrar",
  teacher: "Teacher",
  librarian: "Librarian",
  parent: "Parent",
  student: "Student",
};

export const ALL_ROLES: AppRole[] = [
  "super_admin",
  "school_owner",
  "principal",
  "vice_principal",
  "accountant",
  "registrar",
  "teacher",
  "librarian",
  "parent",
  "student",
];

export function roleLabel(r: AppRole | string | null | undefined): string {
  if (!r) return "—";
  return ROLE_LABELS[r as AppRole] ?? r;
}
