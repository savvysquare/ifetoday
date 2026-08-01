import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Article = Tables<"articles">;
export type Advert = Tables<"adverts">;
export type Status = Tables<"statuses">;

export const CATEGORIES = [
  { value: "local", label: "Ife & Local" },
  { value: "state", label: "Osun State" },
  { value: "national", label: "National" },
  { value: "global", label: "Global" },
] as const;

export function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function formatEditionDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Today's date, formatted like an edition date line. */
export function formatToday() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function excerpt(html: string, length = 180) {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/api/public/media/")) {
    const path = url.replace("/api/public/media/", "");
    const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || "https://afcyzkilkigruadjpfqb.supabase.co";
    return `${supabaseUrl}/storage/v1/object/public/media/${path}`;
  }
  return url;
}

export function resolveBodyMediaUrls(html: string): string {
  if (!html) return html;
  const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || "https://afcyzkilkigruadjpfqb.supabase.co";
  return html.replace(/\/api\/public\/media\//g, `${supabaseUrl}/storage/v1/object/public/media/`);
}

export const articlesQuery = queryOptions({
  queryKey: ["articles"],
  queryFn: async (): Promise<Article[]> => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("published", true)
      .order("edition_date", { ascending: false })
      .order("is_lead", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

export const advertsQuery = queryOptions({
  queryKey: ["adverts"],
  queryFn: async (): Promise<Advert[]> => {
    const { data, error } = await supabase
      .from("adverts")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

export const statusesQuery = queryOptions({
  queryKey: ["statuses"],
  queryFn: async (): Promise<Status[]> => {
    const { data, error } = await supabase
      .from("statuses")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
});

export function articleQuery(slug: string) {
  return queryOptions({
    queryKey: ["article", slug],
    queryFn: async (): Promise<Article | null> => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}