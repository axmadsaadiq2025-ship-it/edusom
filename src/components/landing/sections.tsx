import { Link } from "@tanstack/react-router";
import { RequestAccessDialog } from "./request-access-dialog";
import {
  ArrowRight,
  PlayCircle,
  CalendarCheck,
  Cloud,
  Building2,
  ShieldCheck,
  Zap,
  WifiOff,
  KeyRound,
  DatabaseBackup,
  MessageSquare,
  Mail,
  Sparkles,
  UserPlus,
  GraduationCap,
  Users,
  ClipboardCheck,
  CalendarClock,
  FileText,
  Wallet,
  Receipt,
  Banknote,
  Library,
  Bus,
  Boxes,
  BedDouble,
  BriefcaseBusiness,
  Award,
  FileBarChart,
  Settings,
  Check,
  Star,
  TrendingUp,
  Bell,
  BookOpen,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Counter, Reveal, SectionHeading } from "./primitives";
import { cn } from "@/lib/utils";
import { useState } from "react";

/* ------------------------------- HERO ---------------------------------- */

function FloatingStat({
  icon: Icon,
  label,
  value,
  trend,
  className,
  delay = "0s",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  trend: string;
  className?: string;
  delay?: string;
}) {
  return (
    <div
      style={{ animationDelay: delay }}
      className={cn(
        "glass animate-float absolute rounded-2xl p-3 shadow-elegant sm:p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="bg-gradient-primary flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-sm font-bold text-foreground sm:text-base">{value}</p>
          <p className="text-[10px] font-medium text-success">{trend}</p>
        </div>
      </div>
    </div>
  );
}

function DashboardMock({ className }: { className?: string }) {
  const bars = [42, 68, 55, 82, 61, 90, 74];
  return (
    <div
      className={cn(
        "glass overflow-hidden rounded-3xl p-4 shadow-elegant sm:p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2 pb-4">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <div className="ml-3 h-5 flex-1 rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Students", v: "1,284" },
          { l: "Attendance", v: "96.4%" },
          { l: "Collected", v: "$42.8k" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl bg-card/80 p-3 shadow-sm">
            <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.l}
            </p>
            <p className="mt-1 text-sm font-bold text-foreground sm:text-lg">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-card/80 p-4 shadow-sm">
        <div className="flex items-end justify-between gap-2 sm:gap-3" aria-hidden="true">
          {bars.map((h, i) => (
            <div key={i} className="flex-1">
              <div
                className="bg-gradient-primary w-full rounded-t-lg"
                style={{ height: `${h}px` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-card/70 p-2.5">
            <span className="bg-gradient-primary h-8 w-8 rounded-full opacity-80" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-1/2 rounded bg-muted" />
              <div className="h-2 w-1/3 rounded bg-muted/70" />
            </div>
            <span className="rounded-md bg-success/15 px-2 py-1 text-[10px] font-semibold text-success">
              Paid
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div className="bg-gradient-mesh animate-glow-pulse pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8">
        <div>
          <Reveal>
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Trusted by 100+ schools across Africa
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              EduSom Cloud
              <span className="bg-gradient-primary mt-2 block bg-clip-text text-transparent">
                Modern School Management System for Africa
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Manage admissions, students, teachers, attendance, examinations, finance,
              communication and school operations from one secure cloud platform.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-gradient-primary shadow-glow min-h-11 rounded-xl text-primary-foreground transition-transform hover:scale-[1.03]"
              >
                <Link to="/auth">
                  Login <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <RequestAccessDialog>
                <Button size="lg" variant="outline" className="min-h-11 rounded-xl">
                  <CalendarCheck className="mr-1 h-4 w-4" /> Book a Demo
                </Button>
              </RequestAccessDialog>
              <Button asChild size="lg" variant="ghost" className="min-h-11 rounded-xl">
                <a href="#dashboard-preview">
                  <PlayCircle className="mr-1 h-4 w-4" /> Watch Demo
                </a>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <p className="mt-6 text-xs text-muted-foreground">
              No credit card required · Free 30-day trial · Setup in under an hour
            </p>
          </Reveal>
        </div>

        <Reveal delay={200} className="relative">
          <div className="relative mx-auto max-w-lg">
            <DashboardMock />
            <FloatingStat
              icon={Users}
              label="Students"
              value="50,214"
              trend="+8.2% this term"
              className="hidden sm:block sm:-left-12 sm:top-40"
              delay="0.4s"
            />
            <FloatingStat
              icon={ClipboardCheck}
              label="Attendance"
              value="96.4%"
              trend="+1.4% vs last week"
              className="-right-2 -top-10 sm:-right-10"
              delay="1.2s"
            />
            <FloatingStat
              icon={Wallet}
              label="Finance"
              value="$42.8k"
              trend="Collected this month"
              className="hidden sm:block sm:-left-14 sm:bottom-8"
              delay="2s"
            />
            <FloatingStat
              icon={FileBarChart}
              label="Reports"
              value="1,120"
              trend="Generated instantly"
              className="-right-2 -bottom-8 sm:-right-12"
              delay="2.8s"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ STATS ---------------------------------- */

const STATS = [
  { value: 100, suffix: "+", label: "Schools" },
  { value: 50000, suffix: "+", label: "Students" },
  { value: 5000, suffix: "+", label: "Teachers" },
  { value: 99.9, suffix: "%", decimals: 1, label: "System Uptime" },
];

export function TrustedBy() {
  return (
    <section aria-label="EduSom in numbers" className="py-14 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="glass rounded-3xl px-6 py-10 shadow-elegant sm:px-10">
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Trusted by schools across Africa
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="sr-only">{s.label}</dt>
                <dd className="bg-gradient-primary bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
                  <Counter value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                </dd>
                <p className="mt-2 text-sm font-medium text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------- WHY EDUSOM -------------------------------- */

const FEATURES = [
  { icon: Cloud, title: "Cloud Based", desc: "Access your school from any device, anywhere, with zero servers to maintain." },
  { icon: Building2, title: "Multi School", desc: "Run many campuses or a whole school group from one unified platform." },
  { icon: ShieldCheck, title: "Secure", desc: "Row-level security, encrypted data and strict tenant isolation by design." },
  { icon: Zap, title: "Fast", desc: "Optimised pages and instant search keep daily admin work friction-free." },
  { icon: WifiOff, title: "Offline Ready", desc: "Keep working through connectivity drops and sync automatically after." },
  { icon: KeyRound, title: "Role Based Access", desc: "Ten precise roles from Super Admin to Student — everyone sees only their world." },
  { icon: DatabaseBackup, title: "Automatic Backups", desc: "Continuous backups and point-in-time recovery protect every record." },
  { icon: MessageSquare, title: "SMS Integration", desc: "Reach parents instantly with attendance, fee and announcement alerts." },
  { icon: Mail, title: "Email Notifications", desc: "Automated invoices, results and school news delivered to every inbox." },
  { icon: Sparkles, title: "AI Ready Architecture", desc: "Built for the next step: insights, predictions and smart assistants." },
];

export function WhyEduSom() {
  return (
    <section id="features" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why EduSom"
          title="Everything a modern school needs, nothing it doesn't"
          description="Enterprise-grade foundations wrapped in an interface your staff will actually enjoy using."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {FEATURES.map((f, i) => (
            <li key={f.title}>
              <Reveal
                delay={(i % 5) * 60}
                className="glass group h-full rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
              >
                <span className="bg-gradient-primary shadow-glow flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground transition-transform duration-300 group-hover:scale-110">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------- CORE MODULES ------------------------------ */

const MODULES = [
  { icon: UserPlus, title: "Admissions", desc: "Applications, screening and paperless enrollment." },
  { icon: GraduationCap, title: "Students", desc: "Complete student records and academic history." },
  { icon: Users, title: "Teachers", desc: "Staff profiles, subjects and workload management." },
  { icon: Smartphone, title: "Parents Portal", desc: "Guardians follow progress, fees and news live." },
  { icon: ClipboardCheck, title: "Attendance", desc: "Daily and per-period marking with instant alerts." },
  { icon: Award, title: "Examinations", desc: "Terms, marks entry and automatic grading." },
  { icon: CalendarClock, title: "Timetable", desc: "Conflict-aware weekly scheduling per section." },
  { icon: FileText, title: "Assignments", desc: "Set homework, collect and grade submissions." },
  { icon: Wallet, title: "Finance", desc: "Budgets, expenses and real-time revenue insight." },
  { icon: Receipt, title: "Fees", desc: "Invoices, payments, balances and reminders." },
  { icon: Banknote, title: "Payroll", desc: "Salaries, allowances and payslip generation." },
  { icon: Library, title: "Library", desc: "Catalogue, loans, returns and overdue tracking." },
  { icon: Bus, title: "Transport", desc: "Routes, vehicles and student ride assignment." },
  { icon: Boxes, title: "Inventory", desc: "Assets, stock levels and requisitions." },
  { icon: BedDouble, title: "Hostel", desc: "Rooms, allocations and boarding records." },
  { icon: BriefcaseBusiness, title: "HR", desc: "Contracts, leave and staff performance." },
  { icon: Award, title: "Certificates", desc: "Branded transcripts and certificates in a click." },
  { icon: FileBarChart, title: "Reports", desc: "Analytics on attendance, finance and results." },
  { icon: Settings, title: "Settings", desc: "School profile, roles, branding and preferences." },
];

export function CoreModules() {
  return (
    <section id="modules" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Core Modules"
          title="One platform for every part of school life"
          description="Nineteen deeply connected modules — turn on what you need, add the rest as you grow."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODULES.map((m, i) => (
            <li key={m.title}>
              <Reveal
                delay={(i % 4) * 60}
                className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-elegant"
              >
                <span className="bg-gradient-primary pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <m.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{m.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------ WORKFLOW -------------------------------- */

const WORKFLOW = [
  { title: "Admission", desc: "Capture applications online and review them in one queue." },
  { title: "Enrollment", desc: "Convert accepted applicants into students with full records." },
  { title: "Class Assignment", desc: "Place students into classes and sections instantly." },
  { title: "Attendance", desc: "Daily marking with automatic guardian notifications." },
  { title: "Assessment", desc: "Continuous assessment scores tracked per subject." },
  { title: "Examinations", desc: "Terms, exams and marks entry with auto grading." },
  { title: "Report Cards", desc: "Branded report cards generated and shared in seconds." },
  { title: "Graduation", desc: "Certificates, transcripts and alumni records." },
];

export function Workflow() {
  return (
    <section id="workflow" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Workflow"
          title="From first application to graduation day"
          description="EduSom follows the real journey of a student — every stage connected, nothing re-typed."
        />
        <ol className="relative mt-14 space-y-8 before:absolute before:left-[19px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gradient-to-b before:from-primary before:via-primary/40 before:to-transparent md:before:left-1/2">
          {WORKFLOW.map((step, i) => (
            <li key={step.title} className="relative md:grid md:grid-cols-2 md:gap-10">
              <Reveal
                delay={60}
                className={cn(
                  "pl-14 md:pl-0",
                  i % 2 === 0 ? "md:pr-14 md:text-right" : "md:col-start-2 md:pl-14",
                )}
              >
                <div className="glass rounded-2xl p-5 transition-shadow duration-300 hover:shadow-elegant">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                    Step {i + 1}
                  </span>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </p>
                </div>
              </Reveal>
              <span
                aria-hidden="true"
                className="bg-gradient-primary shadow-glow absolute left-0 top-4 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-primary-foreground md:left-1/2 md:-translate-x-1/2"
              >
                {i + 1}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* -------------------------- DASHBOARD PREVIEW ---------------------------- */

export function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Dashboard Preview"
          title="Beautiful on every screen"
          description="Desktop, tablet and mobile — the same powerful platform, tuned to each device."
        />
        <div className="relative mt-14 grid items-end gap-8 lg:grid-cols-[1.6fr_0.9fr_0.6fr]">
          <Reveal className="animate-float-slow">
            <DashboardMock />
            <p className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <Monitor className="h-4 w-4" aria-hidden="true" /> Desktop
            </p>
          </Reveal>
          <Reveal delay={120} className="animate-float">
            <DashboardMock className="scale-[0.98]" />
            <p className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <Tablet className="h-4 w-4" aria-hidden="true" /> Tablet
            </p>
          </Reveal>
          <Reveal delay={220} className="animate-float-slow">
            <div className="glass mx-auto w-full max-w-[220px] rounded-[2rem] border-4 border-border p-3 shadow-elegant">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
              <div className="space-y-2.5">
                {["Attendance 96%", "Fees $120 due", "Exam results ready", "New notice"].map(
                  (t) => (
                    <div key={t} className="rounded-xl bg-card/80 p-3 text-xs font-medium text-foreground shadow-sm">
                      {t}
                    </div>
                  ),
                )}
              </div>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
              <Smartphone className="h-4 w-4" aria-hidden="true" /> Mobile
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- PARENT APP -------------------------------- */

const PARENT_FEATURES = [
  { icon: Bell, title: "Attendance Alerts", desc: "Know the moment a child misses class." },
  { icon: BookOpen, title: "Homework", desc: "Daily assignments and due dates at a glance." },
  { icon: Award, title: "Exam Results", desc: "Grades and report cards as soon as they publish." },
  { icon: Wallet, title: "Fee Balance", desc: "Invoices, receipts and outstanding balances." },
  { icon: FileText, title: "School News", desc: "Announcements, events and holiday calendars." },
  { icon: MessageSquare, title: "SMS Notifications", desc: "Critical updates even without internet." },
];

export function ParentApp() {
  return (
    <section id="parent-app" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Reveal className="order-2 lg:order-1">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            Parent App
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Parents stay close to every school day
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            A calm, mobile-first experience that keeps guardians informed without a single
            phone call to the office.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {PARENT_FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120} className="order-1 lg:order-2">
          <div className="relative mx-auto w-full max-w-[300px]">
            <div className="bg-gradient-mesh animate-glow-pulse absolute -inset-8 -z-10 rounded-full blur-2xl" />
            <div className="glass animate-float rounded-[2.5rem] border-8 border-border p-4 shadow-elegant">
              <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-muted" />
              <div className="rounded-2xl bg-gradient-primary p-4 text-primary-foreground">
                <p className="text-xs opacity-80">Good morning</p>
                <p className="text-lg font-bold">Amina's day</p>
                <p className="mt-2 text-xs opacity-90">Present · Grade 7B · 08:02 AM</p>
              </div>
              <div className="mt-3 space-y-2.5">
                {PARENT_FEATURES.slice(0, 4).map((f) => (
                  <div
                    key={f.title}
                    className="flex items-center gap-3 rounded-xl bg-card/80 p-3 shadow-sm"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {f.title}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------- TEACHER PORTAL ------------------------------ */

const TEACHER_FEATURES = [
  { icon: BookOpen, title: "Lesson Planning", desc: "Plan units and share resources with your class." },
  { icon: ClipboardCheck, title: "Attendance", desc: "Mark a full class in seconds on any device." },
  { icon: Award, title: "Marks Entry", desc: "Bulk marks entry with automatic grading." },
  { icon: FileText, title: "Assignments", desc: "Create, collect and grade homework online." },
  { icon: CalendarClock, title: "Timetable", desc: "Personal weekly schedule, always up to date." },
  { icon: TrendingUp, title: "Student Performance", desc: "Spot who needs support before exams." },
];

export function TeacherPortal() {
  return (
    <section id="teacher-portal" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Teacher Portal"
          title="Less paperwork, more teaching"
          description="Everything a teacher touches in a day, in one focused workspace."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEACHER_FEATURES.map((f, i) => (
            <li key={f.title}>
              <Reveal
                delay={(i % 3) * 80}
                className="glass group h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
              >
                <span className="bg-gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground transition-transform duration-300 group-hover:rotate-6">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------- PRICING --------------------------------- */

const PLANS = [
  {
    name: "Starter",
    monthly: 49,
    tagline: "For small schools getting organised.",
    features: [
      "Up to 300 students",
      "Students, teachers & parents",
      "Attendance & timetable",
      "Fees and invoicing",
      "Email support",
    ],
  },
  {
    name: "Professional",
    monthly: 129,
    tagline: "For growing schools that need everything.",
    highlight: true,
    features: [
      "Up to 2,000 students",
      "All core modules included",
      "Exams, library & transport",
      "SMS + email notifications",
      "Advanced reports & analytics",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    monthly: 299,
    tagline: "For school groups and ministries.",
    features: [
      "Unlimited students & campuses",
      "Multi-school administration",
      "Custom roles & permissions",
      "API access & integrations",
      "Dedicated success manager",
      "99.9% uptime SLA",
    ],
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);
  return (
    <section id="pricing" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing that scales with your school"
          description="Every plan includes secure hosting, automatic backups and free updates."
        />
        <Reveal className="mt-8 flex items-center justify-center gap-3">
          <span className={cn("text-sm font-medium", !yearly && "text-foreground", yearly && "text-muted-foreground")}>
            Monthly
          </span>
          <Switch
            checked={yearly}
            onCheckedChange={setYearly}
            aria-label="Toggle yearly billing"
          />
          <span className={cn("text-sm font-medium", yearly ? "text-foreground" : "text-muted-foreground")}>
            Yearly
          </span>
          <span className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success">
            Save 20%
          </span>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p, i) => {
            const price = yearly ? Math.round(p.monthly * 12 * 0.8) : p.monthly;
            return (
              <Reveal
                key={p.name}
                delay={i * 100}
                className={cn(
                  "relative h-full rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1",
                  p.highlight
                    ? "bg-gradient-primary shadow-glow text-primary-foreground"
                    : "glass hover:shadow-elegant",
                )}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary shadow-sm">
                    Most popular
                  </span>
                )}
                <h3 className={cn("text-lg font-semibold", p.highlight ? "text-primary-foreground" : "text-foreground")}>
                  {p.name}
                </h3>
                <p className={cn("mt-1 text-sm", p.highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {p.tagline}
                </p>
                <p className="mt-6 flex items-end gap-1">
                  <span className={cn("text-4xl font-extrabold tracking-tight", p.highlight ? "text-primary-foreground" : "text-foreground")}>
                    ${price}
                  </span>
                  <span className={cn("pb-1 text-sm", p.highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>
                    /{yearly ? "year" : "month"}
                  </span>
                </p>
                <Button
                  asChild
                  className={cn(
                    "mt-6 min-h-11 w-full rounded-xl",
                    p.highlight
                      ? "bg-card text-primary hover:bg-card/90"
                      : "bg-gradient-primary text-primary-foreground",
                  )}
                >
                  <Link to="/auth">Login</Link>
                </Button>
                <ul className="mt-7 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={cn("mt-0.5 h-4 w-4 shrink-0", p.highlight ? "text-primary-foreground" : "text-success")}
                        aria-hidden="true"
                      />
                      <span className={p.highlight ? "text-primary-foreground/90" : "text-muted-foreground"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------- TESTIMONIALS ------------------------------ */

const TESTIMONIALS = [
  { quote: "EduSom replaced five spreadsheets and two notebooks. Our registrar finishes admissions in a morning now.", name: "Abdirahman Yusuf", role: "School Owner, Horizon Academy" },
  { quote: "The attendance alerts changed our culture. Parents respond the same hour a child is absent.", name: "Fadumo Ali", role: "Principal, Nasro Schools" },
  { quote: "Marks entry used to take a week per term. With auto grading I finish a class in fifteen minutes.", name: "Mohamed Hassan", role: "Teacher, Iftin Secondary" },
  { quote: "I can see my daughter's attendance, results and fee balance from my phone. That was impossible before.", name: "Sahra Warsame", role: "Parent" },
  { quote: "Managing four campuses from one dashboard finally made our group feel like one school.", name: "Ismail Nur", role: "Director, Barwaaqo Group" },
  { quote: "Fee collection is up 23% since we switched. The reminders do the work for us.", name: "Hodan Jama", role: "Accountant, Al-Furqan Schools" },
];

export function Testimonials() {
  return (
    <section id="about" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Testimonials"
          title="Loved by owners, principals, teachers and parents"
          description="Real schools, real results — across Somalia and beyond."
        />
        <Reveal className="mt-12">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent>
              {TESTIMONIALS.map((t) => (
                <CarouselItem key={t.name} className="sm:basis-1/2 lg:basis-1/3">
                  <figure className="glass flex h-full flex-col rounded-2xl p-6 transition-shadow duration-300 hover:shadow-elegant">
                    <div className="flex gap-0.5" aria-label="Rated 5 out of 5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
                      ))}
                    </div>
                    <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3">
                      <span className="bg-gradient-primary flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
                        {t.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-foreground">{t.name}</span>
                        <span className="block text-xs text-muted-foreground">{t.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- FAQ ----------------------------------- */

const FAQS: { q: string; a: string }[] = [
  { q: "What is EduSom Cloud?", a: "EduSom Cloud is a complete school management platform covering admissions, students, teachers, attendance, exams, finance, library and more — all in one secure cloud system." },
  { q: "Is EduSom suitable for schools in Somalia?", a: "Yes. EduSom was designed for Somali and wider African schools, with local currency support, SMS notifications and resilience on low-bandwidth connections." },
  { q: "Can I manage multiple schools?", a: "Yes. Multi-school administration lets groups and ministries run many campuses from one platform with strict data isolation per school." },
  { q: "How long does setup take?", a: "Most schools are live within a day. You can import students and staff from spreadsheets and configure classes in under an hour." },
  { q: "Is there a free trial?", a: "Every plan starts with a free 30-day trial. No credit card is required to begin." },
  { q: "How is our data secured?", a: "Data is encrypted in transit and at rest, protected by row-level security policies and isolated per school tenant." },
  { q: "Who can access what?", a: "Role-based access covers ten roles — Super Admin, School Owner, Principal, Vice Principal, Accountant, Registrar, Teacher, Librarian, Parent and Student." },
  { q: "Does EduSom work offline?", a: "Core screens keep working through short connectivity drops and synchronise automatically once the connection returns." },
  { q: "Can parents use it on a phone?", a: "Yes. The parent experience is mobile-first and works in any browser, with SMS fallback for critical alerts." },
  { q: "Do you support SMS notifications?", a: "Yes. Attendance, fee and announcement alerts can be delivered by SMS as well as email and in-app notifications." },
  { q: "Can we collect school fees through EduSom?", a: "You can issue invoices, record payments, track balances and send automatic reminders, with full payment history per student." },
  { q: "Does it generate report cards?", a: "Yes. Marks entry feeds automatic grading, and report cards and transcripts can be generated and shared instantly." },
  { q: "Can we import our existing data?", a: "Yes. Students, staff, classes and fee records can be imported from spreadsheets during onboarding." },
  { q: "Is training included?", a: "Onboarding and staff training sessions are included on Professional and Enterprise plans." },
  { q: "What happens to our data if we leave?", a: "Your data is yours. You can export complete records at any time in standard formats." },
  { q: "How often is EduSom backed up?", a: "Backups run continuously with point-in-time recovery, so nothing is lost even in the worst case." },
  { q: "Can we customise roles and permissions?", a: "Enterprise plans support custom roles and fine-grained permissions tailored to your structure." },
  { q: "Does EduSom integrate with other systems?", a: "API access is available on Enterprise plans for integration with payment providers, SMS gateways and reporting tools." },
  { q: "What support do you offer?", a: "Email support on Starter, priority support on Professional, and a dedicated success manager with an SLA on Enterprise." },
  { q: "How do we get started?", a: "Start your free trial or book a demo — our team will help configure your school and import your data." },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently asked questions"
          description="Everything schools usually ask before moving to EduSom Cloud."
        />
        <Reveal className="mt-10">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-semibold text-foreground sm:text-base">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- CTA ----------------------------------- */

export function FinalCTA() {
  return (
    <section id="contact" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="bg-gradient-primary shadow-glow relative overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12">
          <span className="bg-gradient-mesh animate-glow-pulse pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to digitize your school?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
              Join 100+ schools already running admissions, academics and finance on EduSom
              Cloud. Free for 30 days.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="min-h-11 rounded-xl bg-card text-primary hover:bg-card/90">
                <Link to="/auth">
                  Login <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <RequestAccessDialog>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-11 rounded-xl border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <CalendarCheck className="mr-1 h-4 w-4" /> Book a Demo
                </Button>
              </RequestAccessDialog>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------- BLOG / SUPPORT ------------------------------ */

const POSTS = [
  { tag: "Guide", title: "Digitising admissions without losing the human touch", desc: "How five schools moved paper applications online in a single term." },
  { tag: "Product", title: "Inside EduSom's role-based access model", desc: "Ten roles, one secure platform — how permissions really work." },
  { tag: "Story", title: "How Iftin Secondary raised fee collection by 23%", desc: "Automated invoices and reminders changed their cash flow." },
];

export function BlogAndSupport() {
  return (
    <section id="blog" className="scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Blog & Support"
          title="Insights and help whenever you need it"
          description="Practical guides from schools already running on EduSom, plus a support team that answers."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {POSTS.map((p, i) => (
            <Reveal
              key={p.title}
              delay={i * 80}
              className="glass group h-full rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
            >
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
                {p.tag}
              </span>
              <h3 className="mt-4 text-base font-semibold leading-snug text-foreground">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Read article
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Reveal>
          ))}
        </div>

        <Reveal
          id="support"
          delay={120}
          className="glass mt-8 flex scroll-mt-24 flex-col items-center justify-between gap-4 rounded-2xl p-6 sm:flex-row"
        >
          <div>
            <h3 className="text-base font-semibold text-foreground">Need help deciding?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Talk to our team about migrating your school — we answer within one business day.
            </p>
          </div>
          <Button asChild className="bg-gradient-primary min-h-11 rounded-xl text-primary-foreground">
            <a href="mailto:hello@edusom.app">Contact Support</a>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
