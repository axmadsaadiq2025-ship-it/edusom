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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/hooks/use-auth";
import { roleLabel } from "@/lib/roles";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

interface NavSection {
  section: string;
  items: NavItem[];
  superOnly?: boolean;
}

const NAV: NavSection[] = [
  {
    section: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Platform",
    superOnly: true,
    items: [{ label: "Schools", to: "/schools", icon: Building2 }],
  },
  {
    section: "People",
    items: [
      { label: "Students", to: "/dashboard", icon: GraduationCap, badge: "Soon" },
      { label: "Teachers", to: "/dashboard", icon: UserSquare2, badge: "Soon" },
      { label: "Parents", to: "/dashboard", icon: Users, badge: "Soon" },
    ],
  },
  {
    section: "Academics",
    items: [
      { label: "Classes", to: "/dashboard", icon: Building2, badge: "Soon" },
      { label: "Subjects", to: "/dashboard", icon: BookOpen, badge: "Soon" },
      { label: "Timetable", to: "/dashboard", icon: CalendarClock, badge: "Soon" },
      { label: "Attendance", to: "/dashboard", icon: ClipboardCheck, badge: "Soon" },
    ],
  },
  {
    section: "Operations",
    items: [
      { label: "Fees", to: "/dashboard", icon: Wallet, badge: "Soon" },
      { label: "Library", to: "/dashboard", icon: Library, badge: "Soon" },
      { label: "Reports", to: "/dashboard", icon: FileBarChart, badge: "Soon" },
    ],
  },
  {
    section: "System",
    items: [{ label: "Settings", to: "/dashboard", icon: Settings, badge: "Soon" }],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div className="px-2 pt-1">
        <BrandLogo size="sm" />
      </div>
      <nav className="flex flex-col gap-6">
        {NAV.map((section) => (
          <div key={section.section} className="flex flex-col gap-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {section.section}
            </p>
            {section.items.map((item) => {
              const active = pathname === item.to && item.label === "Dashboard";
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

function UserMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, roles } = useAuth();

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

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-gradient-subtle min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students, teachers, invoices…"
                className="h-10 rounded-xl border-transparent bg-muted pl-9"
              />
            </div>

            <div className="flex flex-1 items-center justify-end gap-1 md:flex-none">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="bg-gradient-primary absolute right-2 top-2 h-2 w-2 rounded-full" />
              </Button>
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
