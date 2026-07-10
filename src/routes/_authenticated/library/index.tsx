import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Plus, Loader2, Trash2, Search, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/library/")({
  component: LibraryPage,
});

interface Book {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  category: string | null;
  shelf_location: string | null;
  total_copies: number;
  available_copies: number;
}

function LibraryPage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    shelf_location: "",
    total_copies: 1,
    notes: "",
  });

  const booksQ = useQuery({
    queryKey: ["library_books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_books")
        .select(
          "id,title,author,isbn,category,shelf_location,total_copies,available_copies",
        )
        .order("title");
      if (error) throw error;
      return (data ?? []) as Book[];
    },
  });

  const loansQ = useQuery({
    queryKey: ["library_loans_active"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("library_loans")
        .select("id", { count: "exact", head: true })
        .eq("status", "issued");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!profile?.school_id) throw new Error("No school assigned");
      const { error } = await supabase.from("library_books").insert({
        school_id: profile.school_id,
        title: form.title.trim(),
        author: form.author.trim() || null,
        isbn: form.isbn.trim() || null,
        category: form.category.trim() || null,
        shelf_location: form.shelf_location.trim() || null,
        total_copies: form.total_copies,
        available_copies: form.total_copies,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Book added");
      qc.invalidateQueries({ queryKey: ["library_books"] });
      setOpen(false);
      setForm({
        title: "",
        author: "",
        isbn: "",
        category: "",
        shelf_location: "",
        total_copies: 1,
        notes: "",
      });
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("library_books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Book removed");
      qc.invalidateQueries({ queryKey: ["library_books"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const books = (booksQ.data ?? []).filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      (b.author ?? "").toLowerCase().includes(q) ||
      (b.isbn ?? "").toLowerCase().includes(q) ||
      (b.category ?? "").toLowerCase().includes(q)
    );
  });

  const totalCopies = (booksQ.data ?? []).reduce((s, b) => s + b.total_copies, 0);
  const availableCopies = (booksQ.data ?? []).reduce(
    (s, b) => s + b.available_copies,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage books, issue and return copies to students.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/library/loans">
              <ArrowRightLeft className="mr-1.5 h-4 w-4" /> Loans
            </Link>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary shadow-glow">
                <Plus className="mr-1.5 h-4 w-4" /> Add book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add book</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Author</Label>
                  <Input
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>ISBN</Label>
                  <Input
                    value={form.isbn}
                    onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                    className="mt-1.5 font-mono"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Science, Literature…"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Shelf location</Label>
                  <Input
                    value={form.shelf_location}
                    onChange={(e) =>
                      setForm({ ...form, shelf_location: e.target.value })
                    }
                    placeholder="A-12"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Total copies *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.total_copies}
                    onChange={(e) =>
                      setForm({ ...form, total_copies: Number(e.target.value) })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!form.title.trim()) {
                      toast.error("Title is required");
                      return;
                    }
                    create.mutate();
                  }}
                  disabled={create.isPending}
                  className="bg-gradient-primary shadow-glow"
                >
                  {create.isPending && (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  )}
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Titles"
          value={(booksQ.data ?? []).length.toString()}
          icon={BookOpen}
        />
        <StatCard
          label="Copies available"
          value={`${availableCopies} / ${totalCopies}`}
          icon={BookOpen}
        />
        <StatCard
          label="Active loans"
          value={(loansQ.data ?? 0).toString()}
          icon={ArrowRightLeft}
        />
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, ISBN…"
            className="pl-9"
          />
        </div>
      </div>

      {booksQ.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="bg-gradient-primary shadow-glow mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No books found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first book to the catalog.
          </p>
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Author</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
                <TableHead className="hidden lg:table-cell">Shelf</TableHead>
                <TableHead>Copies</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {books.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="font-medium">{b.title}</div>
                    {b.isbn && (
                      <div className="font-mono text-xs text-muted-foreground">
                        {b.isbn}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-sm md:table-cell">
                    {b.author ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {b.category ?? "—"}
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs lg:table-cell">
                    {b.shelf_location ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={b.available_copies > 0 ? "secondary" : "destructive"}
                    >
                      {b.available_copies}/{b.total_copies}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Remove "${b.title}"?`)) remove.mutate(b.id);
                      }}
                      disabled={remove.isPending}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
