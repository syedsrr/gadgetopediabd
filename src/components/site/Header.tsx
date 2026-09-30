import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { MoreVertical, Search, User, X } from "lucide-react";
import { useEffect, useState } from "react";


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
  const [compact, setCompact] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const iconBtn = cn(
    "text-canopy-foreground/85 transition-all duration-300 hover:bg-white/10 hover:text-accent lg:h-11 lg:w-11",
    compact ? "h-9 w-9" : "h-11 w-11",
  );
  const iconSize = cn("transition-all duration-300", compact ? "h-4 w-4" : "h-4 w-4 sm:h-5 sm:w-5");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = term.trim();
    setSearchOpen(false);
    navigate({ to: "/shop", search: q ? { q } : {} });
  }


  return (
    <header className="sticky top-0 z-50 px-2.5 pt-2.5 sm:px-5 sm:pt-4">
      <div className="glass-forest mx-auto max-w-6xl overflow-hidden rounded-2xl text-canopy-foreground sm:rounded-3xl">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3.5 py-2.5 sm:px-5 sm:py-3 lg:flex">
        <div className="min-w-0">
          <Logo tone="dark" />
        </div>


        <nav className="ml-8 hidden items-center gap-6 text-sm font-medium lg:flex">
          <Link
            to="/shop"
            className="text-canopy-foreground/75 transition-colors hover:text-accent"
            activeProps={{ className: "text-accent" }}
          >
            Shop
          </Link>
          <Link
            to="/pre-order"
            className="text-canopy-foreground/75 transition-colors hover:text-accent"
            activeProps={{ className: "text-accent" }}
          >
            Pre-order
          </Link>
          <Link
            to="/sold-out"
            className="text-canopy-foreground/75 transition-colors hover:text-accent"
            activeProps={{ className: "text-accent" }}
          >
            Sold out
          </Link>
          <Link
            to="/about"
            className="text-canopy-foreground/75 transition-colors hover:text-accent"
            activeProps={{ className: "text-accent" }}
          >
            About
          </Link>
          <Link
            to="/track-order"
            className="text-canopy-foreground/75 transition-colors hover:text-accent"
            activeProps={{ className: "text-accent" }}
          >
            Track order
          </Link>
          <Link
            to="/contact"
            className="text-canopy-foreground/75 transition-colors hover:text-accent"
            activeProps={{ className: "text-accent" }}
          >
            Contact
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-0 lg:ml-auto lg:gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-canopy-foreground/85 hover:bg-white/10 hover:text-accent"
            aria-label="Search products"
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Search className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>

          <CartDrawer />

          {session ? (
            <Button variant="ghost" size="icon" className="h-11 w-11 text-canopy-foreground/85 hover:bg-white/10 hover:text-accent" aria-label="My account" asChild>
              <Link to="/account">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-canopy-foreground/85 hover:bg-white/10 hover:text-accent"
              aria-label="Sign in"
              onClick={() => setAuthOpen(true)}
            >
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}


          {/* Categories live behind this three-dot menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 text-canopy-foreground/85 hover:bg-white/10 hover:text-accent" aria-label="Browse categories and menu">
                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="glass-forest w-[19rem] rounded-l-3xl p-0 text-canopy-foreground">
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
        <form onSubmit={submitSearch} className="border-t border-white/10 px-3.5 py-3 sm:px-5">
          <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search watches, earbuds, chargers…"
              className="glass-inset rounded-xl text-canopy-foreground placeholder:text-canopy-foreground/50 focus-visible:ring-accent/50"
            />
            <Button type="submit" className="rounded-xl">Search</Button>
          </div>
        </form>
      )}
      </div>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </header>

  );
}
