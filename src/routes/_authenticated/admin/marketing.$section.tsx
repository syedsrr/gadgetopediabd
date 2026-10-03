import { createFileRoute, notFound } from "@tanstack/react-router";

import { MARKETING_SECTIONS } from "@/lib/marketingSections";

export const Route = createFileRoute("/_authenticated/admin/marketing/$section")({
  loader: ({ params }) => {
    const section = MARKETING_SECTIONS.find((s) => s.slug === params.section);
    if (!section) throw notFound();
    return { label: section.label, desc: section.desc };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.label ?? "Marketing"} — Admin` }] }),
  notFoundComponent: () => <p className="text-sm text-muted-foreground">Section not found.</p>,
  component: Placeholder,
});

function Placeholder() {
  const { label, desc } = Route.useLoaderData();
  return (
    <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
      <h2 className="text-lg font-semibold">{label}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{desc}</p>
      <p className="mt-4 text-xs text-muted-foreground">This module is not active yet.</p>
    </div>
  );
}
