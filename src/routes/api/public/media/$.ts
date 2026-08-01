import { createFileRoute } from "@tanstack/react-router";

// This route previously proxied Supabase storage via a server handler.
// In SPA mode there is no server, so media should be fetched directly
// from Supabase public URLs.  This stub keeps the route tree valid so
// that any old links don't cause a hard router crash.
export const Route = createFileRoute("/api/public/media/$")({
  component: () => null,
});