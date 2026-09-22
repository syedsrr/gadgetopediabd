import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { MoreVertical, Search, User, X } from "lucide-react";
import { useState } from "react";

import { AuthModal } from "@/components/site/AuthModal";
import { CartDrawer } from "@/components/site/CartDrawer";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { categoriesQuery } from "@/lib/catalog";
import { useSession } from "@/lib/useAdmin";

export function Header() {
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();


  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = term.trim();
    setSearchOpen(false);
    navigate({ to: "/shop", search: q ? { q } : {} });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 lg:flex">
        <div className="min-w-0">
          <Logo />
        </div>

        <nav className="ml-8 hidden items-center gap-6 text-sm font-medium lg:flex">
          <Link
            to="/shop"
            className="text-foreground/75 transition-colors hover:text-moss"
            activeProps={{ className: "text-moss" }}
          >
            Shop
          </Link>
          <Link
            to="/pre-order"
            className="text-foreground/75 transition-colors hover:text-moss"
            activeProps={{ className: "text-moss" }}
          >
            Pre-order
          </Link>
          <Link
            to="/sold-out"
            className="text-foreground/75 transition-colors hover:text-moss"
            activeProps={{ className: "text-moss" }}
          >
            Sold out
          </Link>
          <Link
            to="/about"
            className="text-foreground/75 transition-colors hover:text-moss"
            activeProps={{ className: "text-moss" }}
          >
            About
          </Link>
          <Link
            to="/track-order"
            className="text-foreground/75 transition-colors hover:text-moss"
            activeProps={{ className: "text-moss" }}
          >
            Track order
          </Link>
          <Link
            to="/contact"
            className="text-foreground/75 transition-colors hover:text-moss"
            activeProps={{ className: "text-moss" }}
          >
            Contact
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-0 lg:ml-auto lg:gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label="Search products"
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          <CartDrawer />

          {session ? (
            <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="My account" asChild>
              <Link to="/account">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              aria-label="Sign in"
              onClick={() => setAuthOpen(true)}
            >
              <User className="h-5 w-5" />
            </Button>
          )}


          {/* Categories live behind this three-dot menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Browse categories and menu">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[19rem] border-l-0 bg-canopy p-0 text-canopy-foreground">
              <div className="flex h-full flex-col overflow-y-auto px-6 pb-8 pt-6">
                <span className="eyebrow text-accent">Browse</span>
                <h2 className="mt-1 font-display text-xl font-bold">Categories</h2>

                <ul className="mt-5 space-y-1">
                  {categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        to="/category/$slug"
                        params={{ slug: c.slug }}
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium text-canopy-foreground/85 transition-colors hover:bg-canopy-foreground/10 hover:text-accent"
                      >
                        {c.name}
                        {c.tagline && (
                          <span className="mt-0.5 block text-xs font-normal text-canopy-foreground/50">
                            {c.tagline}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 border-t border-canopy-foreground/15 pt-5">
                  <ul className="space-y-1 text-sm">
                    {[
                      { to: "/shop" as const, label: "All products" },
                      { to: "/pre-order" as const, label: "Pre-order" },
                      { to: "/sold-out" as const, label: "Sold out" },
                      { to: "/about" as const, label: "About us" },
                      { to: "/contact" as const, label: "Contact" },
                      { to: "/cart" as const, label: "Your cart" },
                      { to: "/track-order" as const, label: "Track your order" },
                      { to: "/auth" as const, label: "Staff login" },
                    ].map((item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={() => setMenuOpen(false)}
                          className="block rounded-xl px-3 py-2 text-canopy-foreground/70 transition-colors hover:bg-canopy-foreground/10 hover:text-accent"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={submitSearch} className="border-t border-border/70 bg-secondary/60 px-4 py-3 sm:px-5">
          <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search watches, earbuds, chargers…"
              className="bg-card"
            />
            <Button type="submit">Search</Button>
          </div>
        </form>
      )}
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
}
