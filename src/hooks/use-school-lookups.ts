import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Shared, cached lookups (same query keys everywhere → one request per session window).
const LOOKUP_STALE = 5 * 60_000;

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    staleTime: LOOKUP_STALE,
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id,name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSections() {
  return useQuery({
    queryKey: ["sections"],
    staleTime: LOOKUP_STALE,
    queryFn: async () => {
      const { data, error } = await supabase.from("sections").select("id,name,class_id");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAcademicYears() {
  return useQuery({
    queryKey: ["academic-years"],
    staleTime: LOOKUP_STALE,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("id,name,is_current")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects", "lookup"],
    staleTime: LOOKUP_STALE,
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id,name,code").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
