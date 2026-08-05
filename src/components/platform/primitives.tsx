import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { isSuperAdmin } from "@/lib/roles";
import { cn } from "@/lib/utils";

/** Redirects non Super Admins back to the school dashboard. */
export function usePlatformGuard() {
  const { roles, user, loading } = useAuth();
  const navigate = useNavigate();
  const isSuper = isSuperAdmin(roles, user?.email);

  useEffect(() => {
    if (!loading && !isSuper) navigate({ to: "/dashboard", replace: true });
  }, [loading, isSuper, navigate]);

  return { isSuper, loading };
}

export function PlatformHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="bg-gradient-primary shadow-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Platform
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PlatformPanel({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass rounded-2xl p-6 shadow-sm", className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function PlatformEmpty({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="bg-gradient-primary shadow-glow flex h-12 w-12 items-center justify-center rounded-2xl">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
