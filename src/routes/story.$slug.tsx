import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AdvertSlot } from "@/components/AdvertSlot";
import { Masthead, SiteFooter } from "@/components/Masthead";
import {
  advertsQuery,
  articleQuery,
  categoryLabel,
  excerpt,
  formatEditionDate,
  resolveBodyMediaUrls,
  resolveMediaUrl,
} from "@/lib/news";

export const Route = createFileRoute("/story/$slug")({
  loader: async ({ context, params }) => {
    const article = await context.queryClient.ensureQueryData(articleQuery(params.slug));
    if (!article) throw notFound();
    await context.queryClient.ensureQueryData(advertsQuery);
    return { article };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Story unavailable — Ife Today" }, { name: "robots", content: "noindex" }] };
    }
    const { article } = loaderData;
    const description = article.dek ?? excerpt(article.body, 150);
    return {
      meta: [
        { title: `${article.title} — Ife Today` },
        { name: "description", content: description },
        { property: "og:title", content: article.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: Story,
});

function Story() {
  const { slug } = Route.useParams();
  const { data: article } = useSuspenseQuery(articleQuery(slug));
  const { data: adverts } = useSuspenseQuery(advertsQuery);

  if (!article) return null;

  const imageUrl = resolveMediaUrl(article.image_url);

  return (
    <div className="mx-auto max-w-2xl px-5 pb-4">
      <Masthead dateLine={formatEditionDate(article.edition_date)} />

      <article className="pt-8">
        <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {article.is_breaking && <span className="text-brand">Breaking · </span>}
          {categoryLabel(article.category)} — {formatEditionDate(article.edition_date)}
        </p>
        <h1 className="masthead text-3xl sm:text-[2.5rem]">{article.title}</h1>
        {article.dek && (
          <p className="mt-3 font-sans text-lg text-muted-foreground">{article.dek}</p>
        )}
        {imageUrl && (
          <img src={imageUrl} alt={article.title} className="my-6 w-full object-cover" />
        )}
        <div
          className="story-body mt-6"
          dangerouslySetInnerHTML={{ __html: resolveBodyMediaUrls(article.body) }}
        />

        {article.sources.length > 0 && (
          <section className="mt-10 border-t border-border pt-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Sources
            </h2>
            <ul className="mt-3 space-y-1.5">
              {article.sources.map((src) => (
                <li key={src} className="break-all text-xs">
                  <a
                    href={src}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-brand underline"
                  >
                    {src}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <AdvertSlot advert={adverts[0]} />

      <Link
        to="/"
        className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-brand"
      >
        ← All stories
      </Link>

      <SiteFooter />
    </div>
  );
}