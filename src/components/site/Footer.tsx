import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Mail, Phone } from "lucide-react";

import { Logo } from "@/components/site/Logo";
import { categoriesQuery } from "@/lib/catalog";

export function Footer() {
  const { data: categories = [] } = useQuery(categoriesQuery);

  return (
    <footer className="mt-20 bg-canopy text-canopy-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo tone="dark" />
          <p className="max-w-xs text-sm text-canopy-foreground/70">
            Curated gadgets and everyday lifestyle upgrades, delivered across Bangladesh with
            genuine warranty and cash-on-delivery.
          </p>
        </div>

        <div>
          <h3 className="eyebrow mb-4 text-accent">Categories</h3>
          <ul className="space-y-2 text-sm">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="text-canopy-foreground/75 transition-colors hover:text-accent"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4 text-accent">Company</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/shop" className="text-canopy-foreground/75 transition-colors hover:text-accent">
                All products
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-canopy-foreground/75 transition-colors hover:text-accent">
                About us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-canopy-foreground/75 transition-colors hover:text-accent">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/auth" className="text-canopy-foreground/75 transition-colors hover:text-accent">
                Staff login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-4 text-accent">Get in touch</h3>
          <ul className="space-y-3 text-sm text-canopy-foreground/75">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-accent" /> +880 1700 000000
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" /> hello@gadgetopedia.shop
            </li>
            <li className="flex items-center gap-3 pt-1">
              <Facebook className="h-4 w-4 text-accent" />
              <Instagram className="h-4 w-4 text-accent" />
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-canopy-foreground/10 px-5 py-5 text-center text-xs text-canopy-foreground/55">
        © {new Date().getFullYear()} gadgetOpedia n&rsquo; Lifestyle. All rights reserved.
      </div>
    </footer>
  );
}
