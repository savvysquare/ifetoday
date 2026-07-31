import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { RichTextEditor, insertHtmlAtCursor } from "@/components/RichTextEditor";
import {
  adminListAll,
  adminLogin,
  adminLogout,
  adminStatus,
  deleteAdvert,
  deleteArticle,
  deleteStatus,
  saveAdvert,
  saveArticle,
  saveStatus,
  uploadImage,
} from "@/lib/admin.functions";
import { CATEGORIES } from "@/lib/news";

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

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function Admin() {
  const status = useServerFn(adminStatus);
  const login = useServerFn(adminLogin);
  const { data, refetch } = useQuery({ queryKey: ["admin-status"], queryFn: () => status({}) });
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!data) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;

  if (!data.authed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <p className="masthead text-3xl">
          <span className="text-ink">Ife</span>
          <span className="text-brand">Today</span>
        </p>
        <h1 className="mt-4 text-xl">Newsroom access</h1>
        <form
          className="mt-5 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const res = await login({ data: { password } });
            setBusy(false);
            if (res.ok) {
              await refetch();
            } else {
              toast.error("Incorrect password");
            }
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

  return <Newsroom onSignedOut={() => refetch()} />;
}

function Newsroom({ onSignedOut }: { onSignedOut: () => void }) {
  const qc = useQueryClient();
  const list = useServerFn(adminListAll);
  const logout = useServerFn(adminLogout);
  const upload = useServerFn(uploadImage);
  const saveArticleFn = useServerFn(saveArticle);
  const deleteArticleFn = useServerFn(deleteArticle);
  const saveAdvertFn = useServerFn(saveAdvert);
  const deleteAdvertFn = useServerFn(deleteAdvert);
  const saveStatusFn = useServerFn(saveStatus);
  const deleteStatusFn = useServerFn(deleteStatus);

  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => list({}) });
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
      const base64 = await readFile(file);
      return upload({
        data: { filename: file.name, contentType: file.type || "image/jpeg", base64 },
      });
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
          const res = await uploadMutation.mutateAsync(file);
          toast.success("Image uploaded");
          resolve(res.url);
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
        <button
          className={btnGhost}
          onClick={async () => {
            await logout({});
            onSignedOut();
          }}
        >
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
                  <img src={form.image_url} alt="" className="h-12 w-20 object-cover" />
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
                if (!form.title.trim()) return toast.error("Headline is required");
                try {
                  await saveArticleFn({
                    data: {
                      id: form.id,
                      title: form.title,
                      dek: form.dek,
                      body: form.body,
                      image_url: form.image_url,
                      category: form.category,
                      edition_date: form.edition_date,
                      is_lead: form.is_lead,
                      is_breaking: form.is_breaking,
                      published: form.published,
                      sources: form.sources.split("\n").map((s) => s.trim()),
                    },
                  });
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
                        await deleteArticleFn({ data: { id: a.id } });
                        refresh();
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
            {advert.image_url && <img src={advert.image_url} alt="" className="h-12 w-20 object-cover" />}
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
                await saveAdvertFn({
                  data: {
                    id: advert.id,
                    title: advert.title,
                    image_url: advert.image_url,
                    link_url: advert.link_url,
                    active: advert.active,
                  },
                });
                toast.success("Advert saved");
                setAdvert({ id: null, title: "", image_url: "", link_url: "", active: true });
                refresh();
              }}
            >
              {advert.id ? "Update advert" : "Save advert"}
            </button>
          </div>
          <ul className="mt-6 divide-y divide-border border-t border-border">
            {adverts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  {a.image_url && <img src={a.image_url} alt="" className="h-10 w-16 object-cover" />}
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
                      await deleteAdvertFn({ data: { id: a.id } });
                      refresh();
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
              if (!statusForm.message.trim()) return toast.error("Message is required");
              await saveStatusFn({
                data: {
                  id: statusForm.id,
                  message: statusForm.message,
                  active: statusForm.active,
                },
              });
              toast.success("Status saved");
              setStatusForm({ id: null, message: "", active: true });
              refresh();
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
                      await deleteStatusFn({ data: { id: s.id } });
                      refresh();
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