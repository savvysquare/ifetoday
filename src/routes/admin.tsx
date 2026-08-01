import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { RichTextEditor, insertHtmlAtCursor } from "@/components/RichTextEditor";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, resolveMediaUrl } from "@/lib/news";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Newsroom — Ife Today" },
      { name: "description", content: "Private newsroom for publishing Ife Today." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Newsroom — Ife Today" },
      { property: "og:description", content: "Private newsroom for publishing Ife Today." },
    ],
  }),
  component: Admin,
});

const input =
  "w-full border border-input bg-card px-3 py-2 text-sm outline-none focus:border-brand";
const label = "mb-1 block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-muted-foreground";
const btn =
  "border border-ink bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-background";
const btnGhost =
  "border border-border px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.15em]";

const AUTH_KEY = "ife_admin_authenticated";

function checkIsAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 70)
    .replace(/-+$/, "");
  return base || `story-${Date.now()}`;
}

type ArticleForm = {
  id: string | null;
  title: string;
  dek: string;
  body: string;
  image_url: string;
  category: string;
  edition_date: string;
  is_lead: boolean;
  is_breaking: boolean;
  published: boolean;
  sources: string;
};

const emptyArticle = (): ArticleForm => ({
  id: null,
  title: "",
  dek: "",
  body: "",
  image_url: "",
  category: "local",
  edition_date: new Date().toISOString().slice(0, 10),
  is_lead: false,
  is_breaking: false,
  published: true,
  sources: "",
});

function Admin() {
  const [authed, setAuthed] = useState(checkIsAuthed);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <div className="flex items-center gap-3">
          <img src={crown.url} alt="Ife Today emblem" className="h-12 w-auto" />
          <p className="masthead text-3xl">
            <span className="text-ink">Ife</span>
            <span className="text-brand">Today</span>
          </p>
        </div>
        <h1 className="mt-4 text-xl">Newsroom access</h1>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            if (password === "IfeToday$$$123") {
              sessionStorage.setItem(AUTH_KEY, "true");
              setAuthed(true);
              toast.success("Welcome to Newsroom");
            } else {
              toast.error("Incorrect password");
            }
            setBusy(false);
          }}
        >
          <div>
            <label className={label} htmlFor="pw">
              Password
            </label>
            <input
              id="pw"
              type="password"
              className={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className={btn} disabled={busy}>
            {busy ? "Checking…" : "Enter newsroom"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <Newsroom
      onSignedOut={() => {
        sessionStorage.removeItem(AUTH_KEY);
        setAuthed(false);
      }}
    />
  );
}

function Newsroom({ onSignedOut }: { onSignedOut: () => void }) {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["admin-all"],
    queryFn: async () => {
      const [articlesRes, advertsRes, statusesRes] = await Promise.all([
        supabase
          .from("articles")
          .select("*")
          .order("edition_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase.from("adverts").select("*").order("created_at", { ascending: false }),
        supabase.from("statuses").select("*").order("created_at", { ascending: false }),
      ]);

      if (articlesRes.error) throw articlesRes.error;
      if (advertsRes.error) throw advertsRes.error;
      if (statusesRes.error) throw statusesRes.error;

      return {
        articles: articlesRes.data ?? [],
        adverts: advertsRes.data ?? [],
        statuses: statusesRes.data ?? [],
      };
    },
  });

  const [tab, setTab] = useState<"news" | "adverts" | "status">("news");
  const [form, setForm] = useState<ArticleForm>(emptyArticle());
  const [advert, setAdvert] = useState({
    id: null as string | null,
    title: "",
    image_url: "",
    link_url: "",
    active: true,
  });
  const [statusForm, setStatusForm] = useState({
    id: null as string | null,
    message: "",
    active: true,
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["admin-all"] });
    qc.invalidateQueries({ queryKey: ["articles"] });
    qc.invalidateQueries({ queryKey: ["adverts"] });
    qc.invalidateQueries({ queryKey: ["statuses"] });
  }

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-60);
      const path = `${Date.now()}-${cleanName}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
      if (error) throw new Error(error.message);
      const publicUrl = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
      return publicUrl;
    },
  });

  async function pickImage(): Promise<string | null> {
    return new Promise((resolve) => {
      const el = document.createElement("input");
      el.type = "file";
      el.accept = "image/*";
      el.onchange = async () => {
        const file = el.files?.[0];
        if (!file) return resolve(null);
        try {
          const url = await uploadMutation.mutateAsync(file);
          toast.success("Image uploaded");
          resolve(url);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Upload failed");
          resolve(null);
        }
      };
      el.click();
    });
  }

  const articles = data?.articles ?? [];
  const adverts = data?.adverts ?? [];
  const statuses = data?.statuses ?? [];

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-8">
      <div className="flex items-center justify-between border-b border-ink/80 pb-3">
        <p className="masthead text-2xl">
          <span className="text-ink">Ife</span>
          <span className="text-brand">Today</span>
          <span className="ml-2 font-sans text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Newsroom
          </span>
        </p>
        <button className={btnGhost} onClick={onSignedOut}>
          Sign out
        </button>
      </div>

      <nav className="mt-5 flex gap-2">
        {(
          [
            ["news", "News"],
            ["adverts", "Adverts"],
            ["status", "Statuses"],
          ] as const
        ).map(([key, text]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`${btnGhost} ${tab === key ? "border-brand text-brand" : "text-muted-foreground"}`}
          >
            {text}
          </button>
        ))}
      </nav>

      {tab === "news" && (
        <section className="mt-6 space-y-4">
          <h1 className="text-2xl">{form.id ? "Edit story" : "New story"}</h1>
          <div>
            <label className={label}>Headline</label>
            <input
              className={input}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Sub-headline</label>
            <input
              className={input}
              value={form.dek}
              onChange={(e) => setForm({ ...form, dek: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={label}>Category</label>
              <select
                className={input}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Edition date</label>
              <input
                type="date"
                className={input}
                value={form.edition_date}
                onChange={(e) => setForm({ ...form, edition_date: e.target.value })}
              />
            </div>
            <div className="flex flex-col justify-center gap-1 pt-4 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_lead}
                  onChange={(e) => setForm({ ...form, is_lead: e.target.checked })}
                />
                Lead story
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_breaking}
                  onChange={(e) => setForm({ ...form, is_breaking: e.target.checked })}
                />
                Breaking
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                Published
              </label>
            </div>
          </div>

          <div>
            <label className={label}>Main picture</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={btnGhost}
                onClick={async () => {
                  const url = await pickImage();
                  if (url) setForm((f) => ({ ...f, image_url: url }));
                }}
              >
                Upload picture
              </button>
              {form.image_url && (
                <>
                  <img
                    src={resolveMediaUrl(form.image_url)}
                    alt=""
                    className="h-12 w-20 object-cover"
                  />
                  <button
                    type="button"
                    className={btnGhost}
                    onClick={() => setForm({ ...form, image_url: "" })}
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <label className={label}>Story</label>
            <RichTextEditor
              key={form.id ?? "new"}
              value={form.body}
              onChange={(html) => setForm((f) => ({ ...f, body: html }))}
              onInsertImage={async () => {
                const url = await pickImage();
                if (url) {
                  insertHtmlAtCursor(`<img src="${url}" alt="" />`);
                }
              }}
            />
          </div>

          <div>
            <label className={label}>Sources (one link per line)</label>
            <textarea
              className={`${input} h-24`}
              value={form.sources}
              onChange={(e) => setForm({ ...form, sources: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <button
              className={btn}
              onClick={async () => {
                if (!form.title.trim()) {
                  toast.error("Headline is required");
                  return;
                }
                try {
                  const payload = {
                    title: form.title.trim(),
                    dek: form.dek?.trim() || null,
                    body: form.body,
                    image_url: form.image_url || null,
                    category: form.category,
                    edition_date: form.edition_date,
                    is_lead: form.is_lead,
                    is_breaking: form.is_breaking,
                    published: form.published,
                    sources: form.sources.split("\n").map((s) => s.trim()).filter(Boolean),
                  };

                  if (form.id) {
                    const { error } = await supabase
                      .from("articles")
                      .update(payload)
                      .eq("id", form.id);
                    if (error) throw new Error(error.message);
                  } else {
                    const { error } = await supabase.from("articles").insert({
                      ...payload,
                      slug: `${slugify(payload.title)}-${Date.now().toString(36).slice(-4)}`,
                    });
                    if (error) throw new Error(error.message);
                  }

                  toast.success("Story saved");
                  setForm(emptyArticle());
                  refresh();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not save");
                }
              }}
            >
              {form.id ? "Update story" : "Publish story"}
            </button>
            {form.id && (
              <button className={btnGhost} onClick={() => setForm(emptyArticle())}>
                Cancel
              </button>
            )}
          </div>

          <div className="mt-8 border-t border-border pt-5">
            <h2 className="text-lg">All stories</h2>
            <ul className="mt-3 divide-y divide-border">
              {articles.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                      {a.edition_date} · {a.category} {a.published ? "" : "· draft"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      className={btnGhost}
                      onClick={() =>
                        setForm({
                          id: a.id,
                          title: a.title,
                          dek: a.dek ?? "",
                          body: a.body,
                          image_url: a.image_url ?? "",
                          category: a.category,
                          edition_date: a.edition_date,
                          is_lead: a.is_lead,
                          is_breaking: a.is_breaking,
                          published: a.published,
                          sources: a.sources.join("\n"),
                        })
                      }
                    >
                      Edit
                    </button>
                    <button
                      className={btnGhost}
                      onClick={async () => {
                        if (!window.confirm("Delete this story?")) return;
                        const { error } = await supabase
                          .from("articles")
                          .delete()
                          .eq("id", a.id);
                        if (error) {
                          toast.error(error.message);
                        } else {
                          refresh();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tab === "adverts" && (
        <section className="mt-6 space-y-4">
          <h1 className="text-2xl">{advert.id ? "Edit advert" : "Place advert"}</h1>
          <div>
            <label className={label}>Advert text (used when no picture)</label>
            <input
              className={input}
              value={advert.title}
              onChange={(e) => setAdvert({ ...advert, title: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Link URL</label>
            <input
              className={input}
              value={advert.link_url}
              onChange={(e) => setAdvert({ ...advert, link_url: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={btnGhost}
              onClick={async () => {
                const url = await pickImage();
                if (url) setAdvert((a) => ({ ...a, image_url: url }));
              }}
            >
              Upload advert picture
            </button>
            {advert.image_url && (
              <img
                src={resolveMediaUrl(advert.image_url)}
                alt=""
                className="h-12 w-20 object-cover"
              />
            )}
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={advert.active}
                onChange={(e) => setAdvert({ ...advert, active: e.target.checked })}
              />
              Active
            </label>
          </div>
          <div className="flex gap-2">
            <button
              className={btn}
              onClick={async () => {
                try {
                  const payload = {
                    title: advert.title?.trim() || null,
                    image_url: advert.image_url || null,
                    link_url: advert.link_url?.trim() || null,
                    active: advert.active,
                  };
                  const { error } = advert.id
                    ? await supabase.from("adverts").update(payload).eq("id", advert.id)
                    : await supabase.from("adverts").insert(payload);
                  if (error) throw new Error(error.message);
                  toast.success("Advert saved");
                  setAdvert({ id: null, title: "", image_url: "", link_url: "", active: true });
                  refresh();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not save advert");
                }
              }}
            >
              {advert.id ? "Update advert" : "Save advert"}
            </button>
          </div>
          <ul className="mt-6 divide-y divide-border border-t border-border">
            {adverts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  {a.image_url && (
                    <img
                      src={resolveMediaUrl(a.image_url)}
                      alt=""
                      className="h-10 w-16 object-cover"
                    />
                  )}
                  <p className="text-sm">
                    {a.title || "(picture advert)"}{" "}
                    <span className="text-[0.7rem] uppercase text-muted-foreground">
                      {a.active ? "active" : "hidden"}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    className={btnGhost}
                    onClick={() =>
                      setAdvert({
                        id: a.id,
                        title: a.title ?? "",
                        image_url: a.image_url ?? "",
                        link_url: a.link_url ?? "",
                        active: a.active,
                      })
                    }
                  >
                    Edit
                  </button>
                  <button
                    className={btnGhost}
                    onClick={async () => {
                      const { error } = await supabase.from("adverts").delete().eq("id", a.id);
                      if (error) {
                        toast.error(error.message);
                      } else {
                        refresh();
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "status" && (
        <section className="mt-6 space-y-4">
          <h1 className="text-2xl">{statusForm.id ? "Edit status" : "Add status"}</h1>
          <div>
            <label className={label}>Status message</label>
            <textarea
              className={`${input} h-24`}
              value={statusForm.message}
              onChange={(e) => setStatusForm({ ...statusForm, message: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={statusForm.active}
              onChange={(e) => setStatusForm({ ...statusForm, active: e.target.checked })}
            />
            Active
          </label>
          <button
            className={btn}
            onClick={async () => {
              if (!statusForm.message.trim()) {
                toast.error("Message is required");
                return;
              }
              try {
                const payload = {
                  message: statusForm.message.trim(),
                  active: statusForm.active,
                };
                const { error } = statusForm.id
                  ? await supabase.from("statuses").update(payload).eq("id", statusForm.id)
                  : await supabase.from("statuses").insert(payload);
                if (error) throw new Error(error.message);
                toast.success("Status saved");
                setStatusForm({ id: null, message: "", active: true });
                refresh();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Could not save status");
              }
            }}
          >
            {statusForm.id ? "Update status" : "Add status"}
          </button>
          <ul className="mt-6 divide-y divide-border border-t border-border">
            {statuses.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-3 py-3">
                <p className="text-sm">
                  {s.message}{" "}
                  <span className="text-[0.7rem] uppercase text-muted-foreground">
                    {s.active ? "active" : "hidden"}
                  </span>
                </p>
                <div className="flex shrink-0 gap-1">
                  <button
                    className={btnGhost}
                    onClick={() =>
                      setStatusForm({ id: s.id, message: s.message, active: s.active })
                    }
                  >
                    Edit
                  </button>
                  <button
                    className={btnGhost}
                    onClick={async () => {
                      const { error } = await supabase.from("statuses").delete().eq("id", s.id);
                      if (error) {
                        toast.error(error.message);
                      } else {
                        refresh();
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}