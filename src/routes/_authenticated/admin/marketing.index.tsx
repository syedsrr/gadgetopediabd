import { createFileRoute, Link } from "@tanstack/react-router";

import { MARKETING_SECTIONS } from "@/lib/marketingSections";

export const Route = createFileRoute("/_authenticated/admin/marketing/")({
  head: () => ({ meta: [{ title: "Marketing intelligence — Admin" }] }),
  component: Overview,
});

function Overview() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-background p-5 text-sm text-muted-foreground">
        No marketing data yet. Modules below are being set up and will show real store numbers once enabled.
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MARKETING_SECTIONS.map((s) => (
          <Link
            key={s.slug}
            to="/admin/marketing/$section"
            params={{ section: s.slug }}
            className="rounded-xl border border-border bg-background p-4 transition hover:border-primary"
          >
            <p className="font-medium">{s.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
            {["sales", "products", "customers"].includes(s.slug) ? (
              <span className="mt-2 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">Live</span>
            ) : (
              <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">Coming soon</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
