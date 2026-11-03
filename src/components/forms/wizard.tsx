import type { ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WizardSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Registration progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200",
                done && "bg-primary text-primary-foreground",
                active && "bg-primary/15 text-primary ring-2 ring-primary",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden truncate text-sm sm:block",
                active ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

export function WizardCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="glass space-y-5 rounded-2xl p-4 shadow-sm sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function FormField({
  label,
  required,
  error,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>*</span>
        ) : (
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        )}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function WizardActions({
  step,
  total,
  onBack,
  onNext,
  onCancel,
  submitting,
  submitLabel,
}: {
  step: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel: string;
}) {
  const last = step === total - 1;
  return (
    <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-between gap-2 border-t border-border/60 bg-background/90 px-1 py-3 backdrop-blur">
      <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
        Cancel
      </Button>
      <div className="flex gap-2">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
            Back
          </Button>
        )}
        <Button type="button" onClick={onNext} disabled={submitting} className="min-w-28">
          {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {last ? (submitting ? "Saving…" : submitLabel) : "Continue"}
        </Button>
      </div>
    </div>
  );
}

export function ReviewList({ items }: { items: [string, string | null | undefined][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="truncate text-sm font-medium text-foreground">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
