import type { AppRole } from "@/lib/roles";

/** Modules the internal school app exposes. Keys are used for nav + dashboard gating. */
export type ModuleKey =
  | "dashboard"
  | "students"
  | "parents"
  | "teachers"
  | "classes"
  | "subjects"
  | "academic-years"
  | "attendance"
  | "timetable"
  | "exams"
  | "library"
  | "fees"
  | "reports"
  | "settings";

const ALL: ModuleKey[] = [
  "dashboard",
  "students",
  "parents",
  "teachers",
  "classes",
  "subjects",
  "academic-years",
  "attendance",
  "timetable",
  "exams",
  "library",
  "fees",
  "reports",
  "settings",
];

const ROLE_MODULES: Record<AppRole, ModuleKey[]> = {
  super_admin: ALL,
  school_owner: ALL,
  principal: ALL,
  vice_principal: ALL,
  registrar: [
    "dashboard",
    "students",
    "parents",
    "teachers",
    "classes",
    "subjects",
    "academic-years",
    "attendance",
    "timetable",
    "reports",
  ],
  accountant: ["dashboard", "students", "parents", "fees", "reports"],
  teacher: [
    "dashboard",
    "students",
    "classes",
    "subjects",
    "attendance",
    "timetable",
    "exams",
    "library",
  ],
  librarian: ["dashboard", "students", "library"],
  parent: ["dashboard", "attendance", "exams", "fees", "timetable"],
  student: ["dashboard", "attendance", "exams", "timetable", "library"],
};

/** Modules visible to a user, given every role they hold. */
export function allowedModules(roles: readonly AppRole[]): Set<ModuleKey> {
  if (roles.length === 0) return new Set<ModuleKey>(["dashboard"]);
  const out = new Set<ModuleKey>();
  for (const role of roles) {
    for (const m of ROLE_MODULES[role] ?? []) out.add(m);
  }
  return out;
}

export function canAccess(roles: readonly AppRole[], moduleKey: ModuleKey): boolean {
  return allowedModules(roles).has(moduleKey);
}
