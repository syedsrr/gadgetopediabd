import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://www.gadgetopedia.shop";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop", changefreq: "daily", priority: "0.9" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
          { path: "/contact", changefreq: "monthly", priority: "0.5" },
          { path: "/track-order", changefreq: "monthly", priority: "0.3" },
        ];

        const { createClient } = await import("@supabase/supabase-js");
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              // Opaque sb_ keys are not JWTs; send apikey without the default bearer.
              if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) {
                headers.delete("Authorization");
              }
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            },
          },
        });

        const { data: categories, error: catError } = await supabase
          .from("categories")
          .select("slug")
          .eq("is_active", true);
        if (catError) throw catError;
        entries.push(
          ...(categories ?? [])
            .filter((c) => c.slug)
            .map((c) => ({
              path: `/category/${encodeURIComponent(c.slug)}`,
              changefreq: "weekly" as const,
              priority: "0.7",
            })),
        );

        const pageSize = 1000;
        for (let offset = 0; ; offset += pageSize) {
          const { data, error } = await supabase
            .from("products")
            .select("slug, updated_at")
            .eq("is_active", true)
            .eq("status", "published")
            .order("id")
            .range(offset, offset + pageSize - 1);
          if (error) throw error;
          entries.push(
            ...(data ?? [])
              .filter((p) => p.slug)
              .map((p) => ({
                path: `/product/${encodeURIComponent(p.slug)}`,
                changefreq: "weekly" as const,
                priority: "0.8",
              })),
          );
          if ((data ?? []).length < pageSize) break;
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
