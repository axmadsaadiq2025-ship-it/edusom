import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
  LogOut,
  Menu,
  Bell,
  Search,
  ChevronDown,
  ClipboardList,
  CreditCard,
  BarChart3,
  LifeBuoy,
  ScrollText,
  Activity,
  SlidersHorizontal,
  ShieldCheck,
  Plug,
  MessageSquare,


} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { BrandLogo } from "@/components/brand-logo";
import type { Profile } from "@/hooks/use-auth";
import { roleLabel, type AppRole } from "@/lib/roles";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { GlobalSearch } from "@/components/layout/global-search";
import { allowedModules, type ModuleKey } from "@/lib/rbac";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  module?: ModuleKey;
}

interface NavSection {
  section: string;
  items: NavItem[];
  superOnly?: boolean;
}

interface AuthenticatedIdentity {
  user: User;
  profile: Profile | null;
  roles: AppRole[];
  isSuper: boolean;
}

const NAV: NavSection[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, module: "dashboard" }],
  },
  {
    section: "People",
    items: [
      { label: "Students", to: "/students", icon: GraduationCap, module: "students" },
      { label: "Teachers", to: "/teachers", icon: UserSquare2, module: "teachers" },
      { label: "Parents", to: "/parents", icon: Users, module: "parents" },
    ],
  },
  {
    section: "Academic Setup",
    items: [
      { label: "Academic Years", to: "/academic-years", icon: CalendarClock, module: "academic-years" },
      { label: "Classes", to: "/classes", icon: BookOpen, module: "classes" },
      { label: "Subjects", to: "/subjects", icon: Library, module: "subjects" },
    ],
  },
  {
    section: "Academics",
    items: [
      { label: "Attendance", to: "/attendance", icon: ClipboardCheck, module: "attendance" },
      { label: "Timetable", to: "/timetable", icon: CalendarClock, module: "timetable" },
      { label: "Exams", to: "/exams", icon: GraduationCap, module: "exams" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Fees", to: "/fees", icon: Wallet, module: "fees" },
      { label: "Reports", to: "/reports", icon: FileBarChart, module: "reports" },
      { label: "Library", to: "/library", icon: Library, module: "library" },
    ],
  },
  {
    section: "System",
    items: [{ label: "Settings", to: "/settings", icon: Settings, module: "settings" }],
  },
];

/** Super Admin console navigation — manages the whole platform, not one school. */
const PLATFORM_NAV: NavSection[] = [
  {
    section: "Platform",
    items: [
      { label: "Dashboard Overview", to: "/platform/dashboard", icon: LayoutDashboard },
      { label: "Registration Requests", to: "/registration-requests", icon: ClipboardList },
      { label: "Schools Management", to: "/platform/schools", icon: Building2 },
    ],
  },
  {
    section: "Commercial",
    items: [
      { label: "Subscription & Plans", to: "/platform/subscriptions", icon: CreditCard },
      { label: "Revenue & Payments", to: "/platform/revenue", icon: Wallet },
      { label: "Platform Analytics", to: "/platform/analytics", icon: BarChart3 },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Users & Roles", to: "/platform/users", icon: Users },
      { label: "Support Tickets", to: "/platform/support", icon: LifeBuoy },
      { label: "Audit Logs", to: "/platform/audit-logs", icon: ScrollText },
      { label: "System Health", to: "/platform/system-health", icon: Activity },
      { label: "Notifications", to: "/platform/notifications", icon: Bell },
    ],
  },
  {
    section: "Configuration",
    items: [
      { label: "Platform Settings", to: "/platform/settings", icon: SlidersHorizontal },
      { label: "Security", to: "/platform/security", icon: ShieldCheck },
      { label: "API & Integrations", to: "/platform/integrations", icon: Plug },
    ],
  },
];

function SidebarContent({
  identity,
  onNavigate,
}: {
  identity: AuthenticatedIdentity;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const modules = allowedModules(identity.roles);
  const sections = (identity.isSuper ? PLATFORM_NAV : NAV)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.module || modules.has(item.module)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div className="px-2 pt-1">
        <BrandLogo size="sm" />
      </div>
      <nav className="flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.section} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {section.section}
            </p>
            {section.items.map((item) => {
              const active =
                item.to !== "/dashboard"
                  ? pathname.startsWith(item.to)
                  : pathname === item.to && item.label === "Dashboard";
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-gradient-primary text-primary-foreground shadow-glow"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                        active
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}

function UserMenu({ identity }: { identity: AuthenticatedIdentity }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, roles } = identity;

  const initials = (profile?.full_name || user?.email || "U")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const primaryRole = roles[0];

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-accent">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left leading-tight sm:block">
            <div className="text-sm font-medium text-foreground">
              {profile?.full_name ?? "Account"}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {roleLabel(primaryRole)}
            </div>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{profile?.full_name ?? "Account"}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {user?.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Profile settings</DropdownMenuItem>
        <DropdownMenuItem disabled>Preferences</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function QuickActions({ identity }: { identity: AuthenticatedIdentity }) {
  const modules = allowedModules(identity.roles);
  const actions = [
    { label: "Add student", to: "/students/new", module: "students" as ModuleKey },
    { label: "Add parent", to: "/parents/new", module: "parents" as ModuleKey },
    { label: "Add teacher", to: "/teachers/new", module: "teachers" as ModuleKey },
    { label: "Create class", to: "/classes", module: "classes" as ModuleKey },
    { label: "Record attendance", to: "/attendance/new", module: "attendance" as ModuleKey },
    { label: "Add fee invoice", to: "/fees/new", module: "fees" as ModuleKey },
    { label: "Create exam", to: "/exams", module: "exams" as ModuleKey },
  ].filter((a) => modules.has(a.module));

  if (identity.isSuper || actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="bg-gradient-primary shadow-glow hidden sm:inline-flex">
          <Plus className="mr-1 h-4 w-4" /> Quick actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((a) => (
          <DropdownMenuItem key={a.to} asChild>
            <Link to={a.to}>{a.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SchoolBadge({ schoolId }: { schoolId: string | null }) {
  const schoolQ = useQuery({
    queryKey: ["school-name", schoolId],
    enabled: !!schoolId,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("schools")
        .select("name")
        .eq("id", schoolId!)
        .maybeSingle();
      return data?.name ?? null;
    },
  });

  if (!schoolQ.data) return null;

  return (
    <div className="hidden min-w-0 items-center gap-2 rounded-xl bg-muted/70 px-3 py-1.5 lg:flex">
      <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="truncate text-xs font-medium text-foreground">{schoolQ.data}</span>
    </div>
  );
}

export function AppShell({
  children,
  identity,
}: {
  children: ReactNode;
  identity: AuthenticatedIdentity;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-gradient-subtle min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent identity={identity} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent identity={identity} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="lg:hidden">
              <BrandLogo size="sm" showText={false} />
            </div>

            <GlobalSearch roles={identity.roles} className="hidden min-w-0 max-w-md flex-1 md:block" />
            <SchoolBadge schoolId={identity.profile?.school_id ?? null} />

            <div className="flex flex-1 items-center justify-end gap-1 md:flex-none">
              <QuickActions identity={identity} />
              <Button variant="ghost" size="icon" className="relative" aria-label="Messages">
                <MessageSquare className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="bg-gradient-primary absolute right-2 top-2 h-2 w-2 rounded-full" />
              </Button>
              <UserMenu identity={identity} />
            </div>
          </div>

          {/* Mobile search row */}
          <div className="px-3 pb-3 md:hidden">
            <GlobalSearch roles={identity.roles} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
