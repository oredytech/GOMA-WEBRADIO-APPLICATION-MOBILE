import { createFileRoute, redirect } from "@tanstack/react-router";

// Deep links coming from gomawebradio.com/news/<slug> open the article in the app.
export const Route = createFileRoute("/news/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/articles/$slug", params: { slug: params.slug }, replace: true });
  },
});
