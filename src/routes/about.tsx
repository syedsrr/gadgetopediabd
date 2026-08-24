import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, HeartHandshake, Sparkles, Truck } from "lucide-react";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About us — gadgetOpedia n' Lifestyle" },
      {
        name: "description",
        content:
          "gadgetOpedia n' Lifestyle curates genuine gadgets and lifestyle gear for Bangladesh, with honest pricing and dependable after-sales support.",
      },
      { property: "og:title", content: "About gadgetOpedia n' Lifestyle" },
      {
        property: "og:description",
        content: "Why we curate genuine gadgets and lifestyle gear for Bangladesh.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <section className="bg-canopy text-canopy-foreground">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <span className="eyebrow text-accent">Our story</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">
            Gadgets worth keeping, chosen by people who use them.
          </h1>
          <p className="mt-5 text-canopy-foreground/80">
            gadgetOpedia n' Lifestyle started with a simple frustration: too many shops selling
            look-alike gadgets with no accountability. We decided to stock fewer products, test each
            one, and stand behind everything we sell.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            {
              icon: Sparkles,
              title: "Curated, not crowded",
              text: "Every item earns its place in the catalogue after real hands-on testing.",
            },
            {
              icon: BadgeCheck,
              title: "Genuine sourcing",
              text: "We buy from official distributors and authorised channels only.",
            },
            {
              icon: Truck,
              title: "Reliable delivery",
              text: "24–48 hours inside Dhaka and 2–4 days nationwide, cash on delivery.",
            },
            {
              icon: HeartHandshake,
              title: "Support that answers",
              text: "Real humans on the phone for warranty, replacement and setup help.",
            },
          ].map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <v.icon className="h-6 w-6 text-moss" />
              <h2 className="mt-3 font-display text-lg font-bold">{v.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-secondary/70 p-8 text-center">
          <h2 className="font-display text-2xl font-bold">Ready to upgrade your everyday?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse the full catalogue and find your next favourite device.
          </p>
          <Button className="mt-6" size="lg" asChild>
            <Link to="/shop">Shop now</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
