import { Link } from "@tanstack/react-router";

const SOCIALS = ["WhatsApp", "Facebook", "Instagram", "X (Twitter)", "TikTok", "Website"];

export function Masthead({ dateLine }: { dateLine?: string }) {
  return (
    <header className="border-b border-ink/80 pb-4">
      <div className="flex flex-col items-center gap-1 pt-8">
        <Link to="/" className="masthead text-5xl sm:text-6xl">
          <span className="text-ink">Ife</span>
          <span className="text-brand">Today</span>
        </Link>
        <p className="font-serif text-sm italic text-muted-foreground sm:text-base">
          The Voice of the Ancient City
        </p>
        <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {dateLine ? `${dateLine} · ` : ""}
          <span className="text-brand">Free Forever</span>
        </p>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink/80 py-8">
      <p className="masthead text-2xl">
        <span className="text-ink">Ife</span>
        <span className="text-brand">Today</span>
      </p>
      <p className="mt-1 font-serif text-sm italic text-muted-foreground">
        The Voice of the Ancient City
      </p>
      <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-3">
        {SOCIALS.map((s) => (
          <li key={s}>
            {s} — <span className="font-semibold text-brand">Coming Soon</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Ife Today. Free forever.
      </p>
    </footer>
  );
}