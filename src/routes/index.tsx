import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AdvertSlot } from "@/components/AdvertSlot";
import { Masthead, SiteFooter } from "@/components/Masthead";
import {
  advertsQuery,
  articlesQuery,
  categoryLabel,
  excerpt,
  formatEditionDate,
  formatToday,
  resolveMediaUrl,
  statusesQuery,
  type Article,
} from "@/lib/news";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ife Today — Daily News for Ile-Ife" },
      {
        name: "description",
        content:
          "Few, well-chosen daily stories for the people of Ife: local, Osun State, national and global news. Free forever.",
      },
      { property: "og:title", content: "Ife Today — Daily News for Ile-Ife" },
      {
        property: "og:description",
        content: "Local, state, national and global news for the ancient city. Free forever.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(articlesQuery),
      context.queryClient.ensureQueryData(advertsQuery),
      context.queryClient.ensureQueryData(statusesQuery),
    ]);
  },
  component: Index,
});

function StoryMeta({ article }: { article: Article }) {
  return (
    <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {article.is_breaking && <span className="text-brand">Breaking · </span>}
      {categoryLabel(article.category)} — {formatEditionDate(article.edition_date)}
    </p>
  );
}

function LeadStory({ article }: { article: Article }) {
  const imageUrl = resolveMediaUrl(article.image_url);
  return (
    <article className="pt-8">
      {imageUrl && (
        <Link to="/story/$slug" params={{ slug: article.slug }}>
          <img src={imageUrl} alt={article.title} className="mb-6 w-full object-cover" />
        </Link>
      )}
      <StoryMeta article={article} />
      <h1 className="masthead text-3xl sm:text-[2.75rem]">
        <Link to="/story/$slug" params={{ slug: article.slug }} className="hover:text-brand">
          {article.title}
        </Link>
      </h1>
      {article.dek && <p className="mt-3 font-sans text-lg text-muted-foreground">{article.dek}</p>}
      <p className="mt-4 text-base leading-relaxed text-foreground/90">
        {excerpt(article.body, 260)}
      </p>
      <Link
        to="/story/$slug"
        params={{ slug: article.slug }}
        className="mt-4 inline-block border-b-2 border-brand pb-0.5 text-xs font-bold uppercase tracking-[0.2em] text-brand"
      >
        Continue reading
      </Link>
    </article>
  );
}

function StoryRow({ article }: { article: Article }) {
  const imageUrl = resolveMediaUrl(article.image_url);
  return (
    <article className="border-t border-border py-8">
      <StoryMeta article={article} />
      <div className="flex gap-4">
        <div className="flex-1">
          <h2 className="masthead text-xl sm:text-2xl">
            <Link to="/story/$slug" params={{ slug: article.slug }} className="hover:text-brand">
              {article.title}
            </Link>
          </h2>
          {article.dek && (
            <p className="mt-2 text-sm text-muted-foreground">{article.dek}</p>
          )}
          <p className="mt-3 text-[0.95rem] leading-relaxed text-foreground/90">
            {excerpt(article.body, 150)}
          </p>
          <Link
            to="/story/$slug"
            params={{ slug: article.slug }}
            className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.2em] text-brand"
          >
            Continue reading
          </Link>
        </div>
        {imageUrl && (
          <Link
            to="/story/$slug"
            params={{ slug: article.slug }}
            className="hidden w-32 shrink-0 sm:block"
          >
            <img src={imageUrl} alt={article.title} className="h-28 w-full object-cover" />
          </Link>
        )}
      </div>
    </article>
  );
}

function Index() {
  const { data: articles } = useSuspenseQuery(articlesQuery);
  const { data: adverts } = useSuspenseQuery(advertsQuery);
  const { data: statuses } = useSuspenseQuery(statusesQuery);

  const [lead, ...rest] = articles;
  const latestDate = formatToday();

  return (
    <div className="mx-auto max-w-2xl px-5 pb-4">
      <Masthead dateLine={latestDate} />

      {statuses.length > 0 && (
        <div className="mt-4 space-y-2">
          {statuses.map((s) => (
            <p
              key={s.id}
              className="border-l-2 border-brand bg-newsprint px-3 py-2 text-xs leading-relaxed text-muted-foreground"
            >
              {s.message}
            </p>
          ))}
        </div>
      )}

      {lead ? <LeadStory article={lead} /> : <p className="py-16 text-center">No stories yet.</p>}

      <AdvertSlot advert={adverts[0]} />

      {rest.map((article, i) => (
        <div key={article.id}>
          <StoryRow article={article} />
          {adverts[1] && i === 3 && <AdvertSlot advert={adverts[1]} />}
        </div>
      ))}

      <SiteFooter />
    </div>
  );
}
