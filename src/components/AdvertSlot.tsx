import type { Advert } from "@/lib/news";

export function AdvertSlot({ advert }: { advert?: Advert | undefined }) {
  const body = advert?.image_url ? (
    <img
      src={advert.image_url}
      alt={advert.title ?? "Advertisement"}
      className="w-full object-cover"
    />
  ) : (
    <div className="px-4 py-10 text-center">
      <p className="masthead text-3xl text-ink sm:text-5xl">
        {advert?.title ?? "PLACE YOUR"}
      </p>
      {!advert?.title && <p className="masthead text-3xl text-brand sm:text-5xl">ADVERT HERE</p>}
    </div>
  );

  const frame = (
    <div className="border border-dashed border-ink/60 bg-newsprint">{body}</div>
  );

  return (
    <aside className="my-10">
      <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        Advertisement
      </p>
      {advert?.link_url ? (
        <a href={advert.link_url} target="_blank" rel="noreferrer noopener">
          {frame}
        </a>
      ) : (
        frame
      )}
    </aside>
  );
}