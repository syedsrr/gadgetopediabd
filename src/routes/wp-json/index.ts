import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/wp-json/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { discovery } = await import("@/lib/woo.server");
        return discovery(new URL(request.url).origin);
      },
      OPTIONS: async () => {
        const { options } = await import("@/lib/woo.server");
        return options();
      },
    },
  },
});
