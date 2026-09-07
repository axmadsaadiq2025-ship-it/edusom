import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  accent?: "primary" | "success" | "warning" | "destructive";
  index?: number;
}

const ACCENTS: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "from-primary/20 to-primary-glow/10 text-primary",
  success: "from-success/20 to-success/5 text-success",
  warning: "from-warning/25 to-warning/5 text-warning",
  destructive: "from-destructive/20 to-destructive/5 text-destructive",
};

export function StatCard({ label, value, icon: Icon, trend, accent = "primary", index = 0 }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="glass glass-hover group relative overflow-hidden rounded-2xl p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {trend && (
            <p className="mt-1 text-xs font-medium text-muted-foreground">{trend}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br transition-transform group-hover:scale-110",
            ACCENTS[accent],
          )}
          aria-hidden="true"
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {/* Subtle decorative glow */}
      <div 
        className={cn(
          "absolute -right-4 -top-4 h-16 w-16 opacity-0 blur-2xl transition-opacity group-hover:opacity-20",
          accent === 'primary' ? 'bg-primary' : 
          accent === 'success' ? 'bg-success' : 
          accent === 'warning' ? 'bg-warning' : 'bg-destructive'
        )} 
      />
    </motion.div>
  );
}
