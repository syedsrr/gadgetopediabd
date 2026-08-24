import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact us — gadgetOpedia n' Lifestyle" },
      {
        name: "description",
        content:
          "Call, email or message gadgetOpedia n' Lifestyle for orders, warranty claims and product advice.",
      },
      { property: "og:title", content: "Contact gadgetOpedia n' Lifestyle" },
      { property: "og:description", content: "Reach our team for orders and warranty support." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-5 py-12">
        <span className="eyebrow text-moss">Support</span>
        <h1 className="mt-1 font-display text-3xl font-bold">Contact us</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Questions about an order, warranty or which gadget to pick? Our team replies within one
          business day.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[20rem_1fr]">
          <ul className="space-y-5 text-sm">
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-moss" />
              <div>
                <p className="font-semibold">Phone / WhatsApp</p>
                <p className="text-muted-foreground">+880 1700 000000</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-moss" />
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-muted-foreground">hello@gadgetopedia.shop</p>
              </div>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-moss" />
              <div>
                <p className="font-semibold">Showroom</p>
                <p className="text-muted-foreground">Level 3, Green Tower, Dhanmondi, Dhaka</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-moss" />
              <div>
                <p className="font-semibold">Hours</p>
                <p className="text-muted-foreground">Sat–Thu, 10:00 – 20:00</p>
              </div>
            </li>
          </ul>

          <form
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              toast.success("Thanks! We'll get back to you shortly.");
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cname">Your name</Label>
                <Input id="cname" required maxLength={80} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cphone">Phone or email</Label>
                <Input id="cphone" required maxLength={80} placeholder="How we reach you" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cmsg">Message</Label>
              <Textarea id="cmsg" required rows={5} maxLength={600} placeholder="How can we help?" />
            </div>
            <Button type="submit" size="lg" disabled={sent}>
              {sent ? "Message sent" : "Send message"}
            </Button>
          </form>
        </div>
      </div>
    </SiteLayout>
  );
}
