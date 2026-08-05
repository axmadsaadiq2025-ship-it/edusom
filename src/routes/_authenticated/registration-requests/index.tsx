import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ClipboardList,
  Check,
  X,
  Eye,
  Loader2,
  Search,
  Trash2,
  Building2,
  MapPin,
  User,
  Mail,
  Phone,
  Globe,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { isSuperAdmin } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SCHOOL_TYPE_LABELS, POSITION_LABELS, PLAN_LABELS } from "@/lib/registration-shared";
import {
  approveRegistrationRequest,
  rejectRegistrationRequest,
  deleteRegistrationRequest,
} from "@/lib/registration.functions";

export const Route = createFileRoute("/_authenticated/registration-requests/")({
  head: () => ({
    meta: [
      { title: "Registration Requests — EduSom Cloud" },
      {
        name: "description",
        content:
          "Review, approve or reject school access requests submitted to EduSom Cloud from the Super Admin console.",
      },
      { property: "og:title", content: "Registration Requests — EduSom Cloud" },
      {
        property: "og:description",
        content: "Super Admin console for approving school access requests on EduSom Cloud.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegistrationRequestsPage,
});

type RequestRow = {
  id: string;
  school_name: string;
  school_type: string;
  school_email: string;
  school_phone: string;
  website: string | null;
  country: string;
  state_region: string;
  city: string;
  district: string;
  street_address: string;
  postal_code: string | null;
  admin_full_name: string;
  admin_email: string;
  admin_phone: string;
  admin_position: string;
  estimated_students: number;
  estimated_teachers: number;
  preferred_plan: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  school_id: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RegistrationRequestsPage() {
  const { roles, user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isSuper = isSuperAdmin(roles, user?.email);

  const [status, setStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [from, setFrom] = useState("");
  const [detail, setDetail] = useState<RequestRow | null>(null);
  const [approveTarget, setApproveTarget] = useState<RequestRow | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RequestRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RequestRow | null>(null);
  const [reason, setReason] = useState("");

  const approveFn = useServerFn(approveRegistrationRequest);
  const rejectFn = useServerFn(rejectRegistrationRequest);
  const deleteFn = useServerFn(deleteRegistrationRequest);

  const { data, isLoading } = useQuery({
    queryKey: ["registration-requests"],
    enabled: isSuper,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_registration_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RequestRow[];
    },
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (country && !r.country.toLowerCase().includes(country.toLowerCase())) return false;
      if (city && !r.city.toLowerCase().includes(city.toLowerCase())) return false;
      if (from && new Date(r.created_at) < new Date(from)) return false;
      if (
        q &&
        ![r.school_name, r.admin_full_name, r.admin_email, r.school_email, r.city, r.country]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [data, status, search, country, city, from]);

  const counts = useMemo(() => {
    const all = data ?? [];
    return {
      pending: all.filter((r) => r.status === "pending").length,
      approved: all.filter((r) => r.status === "approved").length,
      rejected: all.filter((r) => r.status === "rejected").length,
    };
  }, [data]);

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveFn({ data: { id } }),
    onSuccess: (res: { schoolCode?: string | null }) => {
      toast.success(`Approved — school created${res?.schoolCode ? ` (${res.schoolCode})` : ""}.`);
      toast.message("Welcome email and SMS queued (placeholder).");
      queryClient.invalidateQueries({ queryKey: ["registration-requests"] });
      setApproveTarget(null);
      setDetail(null);
    },
    onError: (e: Error) => toast.error(e.message || "Approval failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: (v: { id: string; reason: string }) => rejectFn({ data: v }),
    onSuccess: () => {
      toast.success("Request rejected.");
      queryClient.invalidateQueries({ queryKey: ["registration-requests"] });
      setRejectTarget(null);
      setReason("");
      setDetail(null);
    },
    onError: (e: Error) => toast.error(e.message || "Rejection failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Request deleted.");
      queryClient.invalidateQueries({ queryKey: ["registration-requests"] });
      setDeleteTarget(null);
      setDetail(null);
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed"),
  });

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSuper) {
    return (
      <Card className="mx-auto max-w-lg rounded-2xl">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Super Admin only</h1>
          <p className="text-sm text-muted-foreground">
            You don't have permission to view registration requests.
          </p>
          <Button className="rounded-xl" onClick={() => navigate({ to: "/dashboard" })}>
            Back to dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Registration Requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve or reject schools requesting access to EduSom Cloud.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Badge variant="outline" className={STATUS_STYLES["pending"]}>
            {counts.pending} pending
          </Badge>
          <Badge variant="outline" className={STATUS_STYLES["approved"]}>
            {counts.approved} approved
          </Badge>
          <Badge variant="outline" className={STATUS_STYLES["rejected"]}>
            {counts.rejected} rejected
          </Badge>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
          <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search school, owner, email…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Input
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Country</TableHead>
                <TableHead className="hidden lg:table-cell">City</TableHead>
                <TableHead className="hidden sm:table-cell">Students</TableHead>
                <TableHead className="hidden sm:table-cell">Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-12 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No requests match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.school_name}
                      <div className="text-xs text-muted-foreground">
                        {SCHOOL_TYPE_LABELS[r.school_type] ?? r.school_type}
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.admin_full_name}
                      <div className="text-xs text-muted-foreground">
                        {POSITION_LABELS[r.admin_position] ?? r.admin_position}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{r.admin_email}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{r.admin_phone}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{r.country}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{r.city}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {r.estimated_students}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {PLAN_LABELS[r.preferred_plan] ?? r.preferred_plan}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[r.status]}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {fmtDate(r.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="View request"
                          onClick={() => setDetail(r)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {r.status === "pending" && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Approve request"
                              className="text-emerald-600"
                              onClick={() => setApproveTarget(r)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="Reject request"
                              className="text-destructive"
                              onClick={() => {
                                setReason("");
                                setRejectTarget(r);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete request"
                          className="text-muted-foreground"
                          onClick={() => setDeleteTarget(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Details side panel */}
      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{detail?.school_name}</SheetTitle>
          </SheetHeader>
          {detail && (
            <div className="mt-4 flex flex-col gap-6 pb-8">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={STATUS_STYLES[detail.status]}>
                  {detail.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Submitted {fmtDate(detail.created_at)}
                </span>
              </div>

              <section className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4 text-primary" /> School
                </h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd>{SCHOOL_TYPE_LABELS[detail.school_type] ?? detail.school_type}</dd>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="break-all">{detail.school_email}</dd>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{detail.school_phone}</dd>
                  <dt className="text-muted-foreground">Website</dt>
                  <dd className="break-all">{detail.website ?? "—"}</dd>
                </dl>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-primary" /> Location
                </h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">Country</dt>
                  <dd>{detail.country}</dd>
                  <dt className="text-muted-foreground">State / Region</dt>
                  <dd>{detail.state_region}</dd>
                  <dt className="text-muted-foreground">City</dt>
                  <dd>{detail.city}</dd>
                  <dt className="text-muted-foreground">District</dt>
                  <dd>{detail.district}</dd>
                  <dt className="text-muted-foreground">Street</dt>
                  <dd>{detail.street_address}</dd>
                  <dt className="text-muted-foreground">Postal code</dt>
                  <dd>{detail.postal_code ?? "—"}</dd>
                </dl>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <User className="h-4 w-4 text-primary" /> Administrator
                </h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{detail.admin_full_name}</dd>
                  <dt className="text-muted-foreground">Position</dt>
                  <dd>{POSITION_LABELS[detail.admin_position] ?? detail.admin_position}</dd>
                  <dt className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3 w-3" /> Email
                  </dt>
                  <dd className="break-all">{detail.admin_email}</dd>
                  <dt className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-3 w-3" /> Phone
                  </dt>
                  <dd>{detail.admin_phone}</dd>
                </dl>
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Globe className="h-4 w-4 text-primary" /> Plan & size
                </h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">Students</dt>
                  <dd>{detail.estimated_students}</dd>
                  <dt className="text-muted-foreground">Teachers</dt>
                  <dd>{detail.estimated_teachers}</dd>
                  <dt className="text-muted-foreground">Preferred plan</dt>
                  <dd>{PLAN_LABELS[detail.preferred_plan] ?? detail.preferred_plan}</dd>
                </dl>
              </section>

              {(detail.rejection_reason || detail.reviewed_at) && (
                <section className="flex flex-col gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <CalendarDays className="h-4 w-4 text-primary" /> Review
                  </h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">Reviewed at</dt>
                    <dd>{fmtDate(detail.reviewed_at)}</dd>
                    {detail.rejection_reason && (
                      <>
                        <dt className="text-muted-foreground">Reason</dt>
                        <dd>{detail.rejection_reason}</dd>
                      </>
                    )}
                  </dl>
                </section>
              )}

              {detail.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-gradient-primary rounded-xl text-primary-foreground"
                    onClick={() => setApproveTarget(detail)}
                  >
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl text-destructive"
                    onClick={() => {
                      setReason("");
                      setRejectTarget(detail);
                    }}
                  >
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Approve confirmation */}
      <AlertDialog open={!!approveTarget} onOpenChange={(v) => !v && setApproveTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {approveTarget?.school_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This creates the school, generates a School ID, activates the{" "}
              {PLAN_LABELS[approveTarget?.preferred_plan ?? ""] ?? ""} subscription, and enables the
              administrator account for {approveTarget?.admin_email}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={approveMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (approveTarget) approveMutation.mutate(approveTarget.id);
              }}
            >
              {approveMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(v) => !v && setRejectTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject request</DialogTitle>
            <DialogDescription>
              Tell {rejectTarget?.admin_full_name} why this request was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Rejection reason *</Label>
            <Textarea
              id="reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Could not verify the school's registration documents."
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || rejectMutation.isPending}
              onClick={() =>
                rejectTarget && rejectMutation.mutate({ id: rejectTarget.id, reason })
              }
            >
              {rejectMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this request?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the request{" "}
              {deleteTarget?.status === "pending"
                ? " and the pending administrator account that has not been approved yet."
                : "."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              {deleteMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
