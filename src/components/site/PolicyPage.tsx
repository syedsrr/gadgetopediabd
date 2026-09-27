import type { ReactNode } from "react";

import { SiteLayout } from "@/components/site/SiteLayout";

export function PolicyPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { heading: string; body: ReactNode }[];
}) {
  return (
    <SiteLayout>
      <section className="bg-canopy text-canopy-foreground">
        <div className="mx-auto max-w-3xl px-5 py-14">
          <span className="eyebrow text-accent">{eyebrow}</span>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">{title}</h1>
          <p className="mt-4 text-canopy-foreground/80">{intro}</p>
        </div>
      </section>
      <div className="mx-auto max-w-3xl space-y-8 px-5 py-12">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-lg font-bold">{s.heading}</h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc">
              {s.body}
            </div>
          </section>
        ))}
        <p className="rounded-2xl bg-secondary p-5 text-sm">
          Questions? WhatsApp or call{" "}
          <a href="tel:+8801771923776" className="font-semibold text-primary">
            +880 1771 923776
          </a>{" "}
          or email{" "}
          <a href="mailto:gadgetopedia.bd@gmail.com" className="font-semibold text-primary">
            gadgetopedia.bd@gmail.com
          </a>
          .
        </p>
      </div>
    </SiteLayout>
  );
}
