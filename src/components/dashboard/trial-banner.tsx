import { Link, getRouteApi } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
const authenticated = getRouteApi("/_authenticated");
export function TrialBanner() {
  const { trial } = authenticated.useRouteContext();
  const notices = useQuery({ queryKey: ["trial-notifications", trial?.schoolId], enabled: !!trial?.startedAt, queryFn: async () => { const r = await supabase.from("trial_notifications").select("id,message").eq("school_id", trial?.schoolId ?? "").order("created_at", { ascending: false }); if (r.error) throw r.error; return r.data; } });
  if (!trial?.startedAt || trial.status !== "trialing") return null;
  return <section aria-label="Free trial" className="rounded-lg border border-primary/25 bg-primary/5 p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 shrink-0 text-primary" />Welcome to EduSom! Your 7-day free trial is now active.</h2><p className="mt-2 text-sm text-muted-foreground">Started {new Date(trial.startedAt).toLocaleDateString()} · Expires {trial.expiresAt ? new Date(trial.expiresAt).toLocaleString() : "—"} · {trial.daysRemaining} days remaining</p>{trial.daysRemaining <= 3 && <p role="status" className="mt-2 text-sm font-medium text-primary">Your trial expires in {trial.daysRemaining} {trial.daysRemaining === 1 ? "day" : "days"}. Choose a plan to keep access.</p>}{notices.data?.slice(0, 1).map(n => <p key={n.id} className="mt-2 text-sm text-muted-foreground">{n.message}</p>)}</div><Button asChild className="shrink-0"><Link to="/subscription">Upgrade plan</Link></Button></div></section>;
}