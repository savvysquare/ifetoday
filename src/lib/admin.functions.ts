import { createServerFn } from "@tanstack/react-start";
import {
  decodeBase64,
  getAdminSession,
  mediaPathFor,
  passwordMatches,
  requireAdmin,
  slugify,
} from "./admin.server";

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAdminSession();
  return { authed: session.data.admin === true };
});

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    if (!passwordMatches(data.password ?? "")) return { ok: false as const };
    const session = await getAdminSession();
    await session.update({ admin: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});

export const adminListAll = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [articles, adverts, statuses] = await Promise.all([
    supabaseAdmin
      .from("articles")
      .select("*")
      .order("edition_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("adverts").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("statuses").select("*").order("created_at", { ascending: false }),
  ]);
  return {
    articles: articles.data ?? [],
    adverts: adverts.data ?? [],
    statuses: statuses.data ?? [],
  };
});

export const saveArticle = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      id?: string | null;
      title: string;
      dek?: string | null;
      body: string;
      image_url?: string | null;
      category: string;
      edition_date: string;
      is_lead: boolean;
      is_breaking: boolean;
      published: boolean;
      sources: string[];
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      title: data.title.trim(),
      dek: data.dek?.trim() || null,
      body: data.body,
      image_url: data.image_url || null,
      category: data.category,
      edition_date: data.edition_date,
      is_lead: data.is_lead,
      is_breaking: data.is_breaking,
      published: data.published,
      sources: data.sources.filter((s) => s.trim().length > 0),
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("articles").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true as const };
    }
    const { error } = await supabaseAdmin
      .from("articles")
      .insert({ ...payload, slug: `${slugify(payload.title)}-${Date.now().toString(36).slice(-4)}` });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const saveAdvert = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      id?: string | null;
      title?: string | null;
      image_url?: string | null;
      link_url?: string | null;
      active: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      title: data.title?.trim() || null,
      image_url: data.image_url || null,
      link_url: data.link_url?.trim() || null,
      active: data.active,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("adverts").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("adverts").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteAdvert = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("adverts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const saveStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { id?: string | null; message: string; active: boolean }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { message: data.message.trim(), active: data.active };
    const { error } = data.id
      ? await supabaseAdmin.from("statuses").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("statuses").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const deleteStatus = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("statuses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const uploadImage = createServerFn({ method: "POST" })
  .inputValidator((data: { filename: string; contentType: string; base64: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = decodeBase64(data.base64);
    if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("Image must be smaller than 8MB");
    const path = mediaPathFor(data.filename || "image");
    const { error } = await supabaseAdmin.storage
      .from("media")
      .upload(path, bytes, { contentType: data.contentType || "image/jpeg", upsert: false });
    if (error) throw new Error(error.message);
    return { url: `/api/public/media/${path}` };
  });