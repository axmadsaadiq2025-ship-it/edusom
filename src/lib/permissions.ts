import type { AppRole } from "@/lib/roles";

/** Every capability guarded in the app. */
export type Permission =
  // platform
  | "platform.schools"
  | "system.settings"
  | "system.users"
  // people
  | "students.read.all"
  | "students.read.assigned"
  | "students.read.self"
  | "students.read.children"
  | "students.write"
  | "teachers.read"
  | "teachers.write"
  | "parents.read"
  | "parents.write"
  // academics
  | "academic.setup"
  | "attendance.read.all"
  | "attendance.manage.assigned"
  | "attendance.read.self"
  | "timetable.read"
  | "timetable.write"
  | "exams.manage"
  | "exams.marks.assigned"
  | "exams.read.self"
  | "homework.manage"
  | "homework.read.assigned"
  | "homework.submit"
  | "behaviour.manage"
  | "behaviour.read.self"
  | "reportcards.read"
  // finance
  | "finance.manage"
  | "finance.read"
  | "finance.read.self"
  // ops
  | "library.manage"
  | "reports.read.all"
  | "reports.read.assigned"
  | "announcements.manage"
  | "announcements.read"
  | "messages.use"
  | "leave.request"
  | "leave.approve"
  | "admissions.manage";

const ADMIN_FULL: Permission[] = [
  "system.settings",
  "system.users",
  "students.read.all",
  "students.write",
  "teachers.read",
  "teachers.write",
  "parents.read",
  "parents.write",
  "academic.setup",
  "attendance.read.all",
  "attendance.manage.assigned",
  "timetable.read",
  "timetable.write",
  "exams.manage",
  "exams.marks.assigned",
  "homework.manage",
  "behaviour.manage",
  "reportcards.read",
  "finance.manage",
  "finance.read",
  "library.manage",
  "reports.read.all",
  "announcements.manage",
  "announcements.read",
  "messages.use",
  "leave.approve",
  "leave.request",
  "admissions.manage",
];

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  super_admin: ["platform.schools", ...ADMIN_FULL],
  school_owner: [...ADMIN_FULL],
  principal: [...ADMIN_FULL],
  vice_principal: ADMIN_FULL.filter((p) => p !== "finance.manage"),
  registrar: [
    "students.read.all",
    "students.write",
    "teachers.read",
    "parents.read",
    "parents.write",
    "academic.setup",
    "attendance.read.all",
    "timetable.read",
    "reportcards.read",
    "reports.read.all",
    "announcements.manage",
    "announcements.read",
    "messages.use",
    "admissions.manage",
    "leave.request",
  ],
  accountant: [
    "students.read.all",
    "finance.manage",
    "finance.read",
    "reports.read.all",
    "announcements.read",
    "messages.use",
    "leave.request",
  ],
  teacher: [
    "students.read.assigned",
    "attendance.manage.assigned",
    "timetable.read",
    "exams.marks.assigned",
    "homework.manage",
    "homework.read.assigned",
    "behaviour.manage",
    "reportcards.read",
    "reports.read.assigned",
    "announcements.read",
    "messages.use",
    "leave.request",
  ],
  librarian: [
    "students.read.all",
    "library.manage",
    "announcements.read",
    "messages.use",
    "leave.request",
  ],
  student: [
    "students.read.self",
    "attendance.read.self",
    "timetable.read",
    "exams.read.self",
    "homework.submit",
    "behaviour.read.self",
    "reportcards.read",
    "finance.read.self",
    "announcements.read",
    "messages.use",
    "leave.request",
  ],
  parent: [
    "students.read.children",
    "attendance.read.self",
    "exams.read.self",
    "reportcards.read",
    "finance.read.self",
    "announcements.read",
    "messages.use",
  ],
};

/** Highest-priority role decides which portal a user lands in. */
const ROLE_PRIORITY: AppRole[] = [
  "super_admin",
  "school_owner",
  "principal",
  "vice_principal",
  "registrar",
  "accountant",
  "librarian",
  "teacher",
  "parent",
  "student",
];

export function primaryRole(roles: AppRole[]): AppRole | null {
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  return null;
}

export function permissionsFor(roles: AppRole[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const r of roles) for (const p of ROLE_PERMISSIONS[r] ?? []) set.add(p);
  return set;
}

export type Portal = "admin" | "teacher" | "student" | "parent";

export function portalFor(roles: AppRole[]): Portal {
  const r = primaryRole(roles);
  if (r === "teacher") return "teacher";
  if (r === "student") return "student";
  if (r === "parent") return "parent";
  return "admin";
}
