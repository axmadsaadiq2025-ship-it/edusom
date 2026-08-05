import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowLeft, Ban, Building2, Database, GraduationCap, Loader2, Settings, ShieldCheck, Trash2, UserCog, Users, UserSquare2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PlatformHeader, PlatformPanel, usePlatformGuard } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PLAN_LABELS } from "@/lib/registration-shared";

export const Route = createFileRoute("/_authenticated/platform/schools/$schoolId")({
  head: () => ({ meta: [
    { title: "School Details · EduSom Console" },
    { name: "description", content: "Review a school tenant profile, subscription and platform activity." },
    { property: "og:title", content: "School Details · EduSom Console" },
    { property: "og:description", content: "School tenant administration in EduSom." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SchoolDetailsPage,
});

function SchoolDetailsPage() {
  const { schoolId } = Route.useParams();
  const { isSuper } = usePlatformGuard();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("profile");
  const { data, isLoading } = useQuery({
    queryKey: ["platform-school", schoolId], enabled: isSuper,
    queryFn: async () => {
      const [schoolResult, profilesResult, studentsResult, teachersResult, requestResult] = await Promise.all([
        supabase.from("schools").select("*").eq("id", schoolId).maybeSingle(),
        supabase.from("profiles").select("id, full_name, email, phone, is_active, created_at").eq("school_id", schoolId),
        supabase.from("students").select("id, status, created_at").eq("school_id", schoolId),
        supabase.from("teachers").select("id, status, created_at").eq("school_id", schoolId),
        supabase.from("school_registration_requests").select("admin_full_name, admin_email, admin_phone, admin_position, created_at").eq("school_id", schoolId).maybeSingle(),
      ]);
      if (schoolResult.error) throw schoolResult.error;
      if (!schoolResult.data) throw new Error("School not found");
      return { school: schoolResult.data, profiles: profilesResult.data ?? [], students: studentsResult.data ?? [], teachers: teachersResult.data ?? [], owner: requestResult.data };
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (active: boolean) => { const { error } = await supabase.from("schools").update({ is_active: active }).eq("id", schoolId); if (error) throw error; return active; },
    onSuccess: (active) => { toast.success(active ? "School activated" : "School suspended"); queryClient.invalidateQueries({ queryKey: ["platform-school", schoolId] }); queryClient.invalidateQueries({ queryKey: ["platform-schools"] }); },
    onError: (error: Error) => toast.error(error.message),
  });
  const deleteSchool = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("schools").delete().eq("id", schoolId); if (error) throw error; },
    onSuccess: () => { toast.success("School deleted"); queryClient.invalidateQueries({ queryKey: ["platform-schools"] }); navigate({ to: "/platform/schools", replace: true }); },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading || !data) return <div className="space-y-5"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-80 rounded-2xl" /></div>;
  const { school, profiles, students, teachers, owner } = data;
  const activeStudents = students.filter((student) => student.status === "active").length;
  const activeTeachers = teachers.filter((teacher) => teacher.status === "active").length;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2"><Link to="/platform/schools"><ArrowLeft className="h-4 w-4" /> Back to schools</Link></Button>
      <PlatformHeader icon={Building2} title={school.name} description={`${school.school_code ?? school.slug} · ${school.city ?? "Location unavailable"}, ${school.country ?? "Somalia"}`} action={<Badge variant={school.is_active ? "default" : "secondary"}>{school.is_active ? "Active" : "Suspended"}</Badge>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={GraduationCap} label="Students" value={students.length} note={`${activeStudents} active`} />
        <Metric icon={UserSquare2} label="Teachers" value={teachers.length} note={`${activeTeachers} active`} />
        <Metric icon={Users} label="Users" value={profiles.length} note="School accounts" />
        <Metric icon={Wallet} label="Subscription" value={PLAN_LABELS[school.plan] ?? school.plan} note={school.subscription_status} />
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto"><TabsList className="h-auto min-w-max"><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="owner">Owner</TabsTrigger><TabsTrigger value="subscription">Subscription</TabsTrigger><TabsTrigger value="people">Students & Teachers</TabsTrigger><TabsTrigger value="storage">Storage</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList></div>
        <TabsContent value="profile"><PlatformPanel title="School Profile"><InfoGrid rows={[["Name", school.name], ["School code", school.school_code], ["Type", school.school_type], ["Email", school.email], ["Phone", school.phone], ["Website", school.website], ["Address", [school.address, school.district, school.city, school.state_region, school.country].filter(Boolean).join(", ")], ["Timezone", school.timezone], ["Currency", school.currency], ["Created", new Date(school.created_at).toLocaleDateString()]]} /></PlatformPanel></TabsContent>
        <TabsContent value="owner"><PlatformPanel title="Owner Information"><InfoGrid rows={[["Name", owner?.admin_full_name], ["Position", owner?.admin_position], ["Email", owner?.admin_email], ["Phone", owner?.admin_phone], ["Registered", owner?.created_at ? new Date(owner.created_at).toLocaleDateString() : null]]} /></PlatformPanel></TabsContent>
        <TabsContent value="subscription"><PlatformPanel title="Subscription"><InfoGrid rows={[["Plan", PLAN_LABELS[school.plan] ?? school.plan], ["Status", school.subscription_status], ["School access", school.is_active ? "Active" : "Suspended"], ["Started", new Date(school.created_at).toLocaleDateString()]]} /></PlatformPanel></TabsContent>
        <TabsContent value="people"><div className="grid gap-4 md:grid-cols-2"><PlatformPanel title="Students"><p className="text-3xl font-bold text-foreground">{students.length}</p><p className="mt-1 text-sm text-muted-foreground">{activeStudents} currently active</p></PlatformPanel><PlatformPanel title="Teachers"><p className="text-3xl font-bold text-foreground">{teachers.length}</p><p className="mt-1 text-sm text-muted-foreground">{activeTeachers} currently active</p></PlatformPanel></div></TabsContent>
        <TabsContent value="storage"><PlatformPanel title="Storage Usage" description="Storage metering is not available in the current project data model."><div className="flex items-center gap-3 py-5"><Database className="h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">No tenant storage usage has been recorded.</p></div></PlatformPanel></TabsContent>
        <TabsContent value="activity"><PlatformPanel title="Activity"><div className="space-y-4"><ActivityItem label="School created" date={school.created_at} /><ActivityItem label="School profile updated" date={school.updated_at} />{owner?.created_at && <ActivityItem label="Registration approved" date={owner.created_at} />}</div></PlatformPanel></TabsContent>
        <TabsContent value="settings"><PlatformPanel title="School Settings" description="Manage tenant access and high-risk platform actions."><div className="grid gap-3 sm:grid-cols-2"><Button variant="outline" onClick={() => updateStatus.mutate(!school.is_active)} disabled={updateStatus.isPending}>{updateStatus.isPending ? <Loader2 className="animate-spin" /> : school.is_active ? <Ban /> : <ShieldCheck />}{school.is_active ? "Suspend School" : "Activate School"}</Button><Button variant="outline" onClick={() => toast.info("Impersonation requires a secure server-side session exchange and is not enabled.")}><UserCog /> Impersonate School Admin</Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" className="sm:col-span-2"><Trash2 /> Delete School</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {school.name}?</AlertDialogTitle><AlertDialogDescription>This permanently deletes the school and may remove connected tenant data. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteSchool.mutate()} className="bg-destructive text-destructive-foreground">Delete school</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></PlatformPanel></TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof Building2; label: string; value: string | number; note: string }) { return <PlatformPanel><div className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold capitalize text-foreground">{value}</p><p className="text-xs capitalize text-muted-foreground">{note}</p></div></div></PlatformPanel>; }
function InfoGrid({ rows }: { rows: Array<[string, string | null | undefined]> }) { return <dl className="grid gap-5 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label}><dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="mt-1 text-sm capitalize text-foreground">{value || "—"}</dd></div>)}</dl>; }
function ActivityItem({ label, date }: { label: string; date: string }) { return <div className="flex items-center gap-3 border-b border-border/60 pb-4 last:border-0 last:pb-0"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted"><Activity className="h-4 w-4 text-primary" /></div><div><p className="text-sm font-medium text-foreground">{label}</p><p className="text-xs text-muted-foreground">{new Date(date).toLocaleString()}</p></div></div>; }