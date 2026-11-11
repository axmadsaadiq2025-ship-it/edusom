import { Link, getRouteApi } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
const authenticated = getRouteApi("/_authenticated");
export function TrialBanner() {
  const { trial } = authenticated.useRouteContext();
  if (!trial?.startedAt || trial.status !== "trialing") return null;
  return <section aria-label="Free trial" className="rounded-lg border border-primary/25 bg-primary/5 p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-primary" />Welcome to EduSom! Your 7-day free trial is now active.</h2><p className="mt-2 text-sm text-muted-foreground">Started {new Date(trial.startedAt).toLocaleDateString()} · Expires {trial.expiresAt ? new Date(trial.expiresAt).toLocaleString() : "—"} · {trial.daysRemaining} days remaining</p>{trial.daysRemaining <= 3 && <p role="status" className="mt-2 text-sm font-medium text-primary">Your trial expires in {trial.daysRemaining} {trial.daysRemaining === 1 ? "day" : "days"}. Choose a plan to keep access.</p>}</div><Button asChild className="shrink-0"><Link to="/subscription">Upgrade plan</Link></Button></div></section>;
}