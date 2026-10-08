import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  accent?: "primary" | "success" | "warning" | "destructive";
}

const ACCENTS: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-primary/8 text-primary ring-primary/10",
  success: "bg-success/10 text-success ring-success/10",
  warning: "bg-warning/12 text-warning-foreground ring-warning/15",
  destructive: "bg-destructive/8 text-destructive ring-destructive/10",
};

export function StatCard({ label, value, icon: Icon, trend, accent = "primary" }: StatCardProps) {
  return (
    <article className="group relative min-h-32 overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md sm:min-h-36 sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground sm:text-xs">
            {label}
          </p>
          <p className="font-dashboard-display mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            {value}
          </p>
          {trend && (
            <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground sm:text-xs">{trend}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform duration-200 group-hover:scale-105 sm:h-10 sm:w-10",
            ACCENTS[accent],
          )}
          aria-hidden="true"
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
    </article>
  );
}
