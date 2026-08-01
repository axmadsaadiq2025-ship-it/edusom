import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserSquare2,
  Building2,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Wallet,
  FileBarChart,
  Library,
  Settings,
  NotebookPen,
  Megaphone,
  MessageSquare,
  Smile,
  CalendarOff,
  UserCircle,
  Award,
  Receipt,
  Baby,
  ListChecks,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";
import type { Portal } from "@/lib/permissions";

export interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

const ADMIN_NAV: NavSection[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Platform",
    items: [
      { label: "Schools", to: "/schools", icon: Building2, permission: "platform.schools" },
    ],
  },
  {
    section: "People",
    items: [
      { label: "Students", to: "/students", icon: GraduationCap, permission: "students.read.all" },
      { label: "Teachers", to: "/teachers", icon: UserSquare2, permission: "teachers.read" },
      { label: "Teacher Assignments", to: "/teachers/assignments", icon: ListChecks, permission: "teachers.write" },
      { label: "Parents", to: "/parents", icon: Users, permission: "parents.read" },
    ],
  },
  {
    section: "Academic Setup",
    items: [
      { label: "Academic Years", to: "/academic-years", icon: CalendarClock, permission: "academic.setup" },
      { label: "Classes", to: "/classes", icon: BookOpen, permission: "academic.setup" },
      { label: "Subjects", to: "/subjects", icon: Library, permission: "academic.setup" },
    ],
  },
  {
    section: "Academics",
    items: [
      { label: "Attendance", to: "/attendance", icon: ClipboardCheck, permission: "attendance.read.all" },
      { label: "Timetable", to: "/timetable", icon: CalendarClock, permission: "timetable.read" },
      { label: "Exams", to: "/exams", icon: Award, permission: "exams.manage" },
      { label: "Homework", to: "/homework", icon: NotebookPen, permission: "homework.manage" },
      { label: "Behaviour", to: "/behaviour", icon: Smile, permission: "behaviour.manage" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Fees", to: "/fees", icon: Wallet, permission: "finance.read" },
      { label: "Reports", to: "/reports", icon: FileBarChart, permission: "reports.read.all" },
      { label: "Library", to: "/library", icon: Library, permission: "library.manage" },
      { label: "Leave Requests", to: "/leave", icon: CalendarOff, permission: "leave.approve" },
    ],
  },
  {
    section: "Communication",
    items: [
      { label: "Announcements", to: "/announcements", icon: Megaphone, permission: "announcements.read" },
      { label: "Messages", to: "/messages", icon: MessageSquare, permission: "messages.use" },
    ],
  },
  {
    section: "System",
    items: [
      { label: "Settings", to: "/settings", icon: Settings, permission: "system.settings" },
      { label: "My Profile", to: "/profile", icon: UserCircle },
    ],
  },
];

const TEACHER_NAV: NavSection[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Teaching",
    items: [
      { label: "My Classes", to: "/teacher/classes", icon: BookOpen },
      { label: "My Subjects", to: "/teacher/subjects", icon: Library },
      { label: "Attendance", to: "/attendance", icon: ClipboardCheck },
      { label: "Timetable", to: "/timetable", icon: CalendarClock },
    ],
  },
  {
    section: "Coursework",
    items: [
      { label: "Homework", to: "/homework", icon: NotebookPen },
      { label: "Exams", to: "/teacher/exams", icon: Award },
      { label: "Report Cards", to: "/report-cards", icon: FileBarChart },
      { label: "Student Behaviour", to: "/behaviour", icon: Smile },
    ],
  },
  {
    section: "Communication",
    items: [
      { label: "Announcements", to: "/announcements", icon: Megaphone },
      { label: "Messages", to: "/messages", icon: MessageSquare },
    ],
  },
  {
    section: "Me",
    items: [
      { label: "Leave Requests", to: "/leave", icon: CalendarOff },
      { label: "My Profile", to: "/profile", icon: UserCircle },
    ],
  },
];

const STUDENT_NAV: NavSection[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Academics",
    items: [
      { label: "My Subjects", to: "/portal/subjects", icon: Library },
      { label: "Timetable", to: "/timetable", icon: CalendarClock },
      { label: "Attendance", to: "/portal/attendance", icon: ClipboardCheck },
      { label: "Homework", to: "/portal/homework", icon: NotebookPen },
      { label: "Exams & Results", to: "/portal/results", icon: Award },
      { label: "Report Cards", to: "/report-cards", icon: FileBarChart },
    ],
  },
  {
    section: "Finance",
    items: [{ label: "Fee Status", to: "/portal/fees", icon: Receipt }],
  },
  {
    section: "Communication",
    items: [
      { label: "Announcements", to: "/announcements", icon: Megaphone },
      { label: "Messages", to: "/messages", icon: MessageSquare },
    ],
  },
  {
    section: "Me",
    items: [
      { label: "Leave Requests", to: "/leave", icon: CalendarOff },
      { label: "My Profile", to: "/profile", icon: UserCircle },
    ],
  },
];

const PARENT_NAV: NavSection[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "My Children",
    items: [
      { label: "Children", to: "/portal/children", icon: Baby },
      { label: "Attendance", to: "/portal/attendance", icon: ClipboardCheck },
      { label: "Homework", to: "/portal/homework", icon: NotebookPen },
      { label: "Results", to: "/portal/results", icon: Award },
      { label: "Report Cards", to: "/report-cards", icon: FileBarChart },
      { label: "Fee Status", to: "/portal/fees", icon: Receipt },
    ],
  },
  {
    section: "Communication",
    items: [
      { label: "Announcements", to: "/announcements", icon: Megaphone },
      { label: "Messages", to: "/messages", icon: MessageSquare },
    ],
  },
  {
    section: "Me",
    items: [{ label: "My Profile", to: "/profile", icon: UserCircle }],
  },
];

export const PORTAL_NAV: Record<Portal, NavSection[]> = {
  admin: ADMIN_NAV,
  teacher: TEACHER_NAV,
  student: STUDENT_NAV,
  parent: PARENT_NAV,
};

export function navFor(portal: Portal, can: (p: Permission) => boolean): NavSection[] {
  return PORTAL_NAV[portal]
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => !i.permission || can(i.permission)),
    }))
    .filter((s) => s.items.length > 0);
}
