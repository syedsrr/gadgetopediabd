import { createFileRoute } from "@tanstack/react-router";

async function handle({ request, params }: { request: Request; params: { _splat?: string } }) {
  const { handleWoo } = await import("@/lib/woo.server");
  return handleWoo(request, params._splat ?? "");
}

export const Route = createFileRoute("/wp-json/$")({
  server: {
    handlers: { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle, OPTIONS: handle },
  },
});
