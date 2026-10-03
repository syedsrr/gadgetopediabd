import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { MARKETING_SECTIONS } from "@/lib/marketingSections";

export const Route = createFileRoute("/_authenticated/admin/marketing")({
  component: MarketingLayout,
});

function MarketingLayout() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Marketing intelligence</h1>
        <p className="text-sm text-muted-foreground">Foundation for analytics, AI insights and campaign tools.</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto pb-1">
        <Link
          to="/admin/marketing"
          activeOptions={{ exact: true }}
          className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
        >
          Overview
        </Link>
        {MARKETING_SECTIONS.map((s) => (
          <Link
            key={s.slug}
            to="/admin/marketing/$section"
            params={{ section: s.slug }}
            className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
          >
            {s.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
