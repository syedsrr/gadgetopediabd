import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

export function Logo({
  tone = "light",
  compact = false,
}: {
  tone?: "light" | "dark";
  compact?: boolean;
}) {
  const main = tone === "dark" ? "text-canopy-foreground" : "text-primary";
  const sub = tone === "dark" ? "text-accent" : "text-moss";

  return (
    <Link to="/" className="group flex min-w-0 flex-col leading-none" aria-label="gadgetOpedia n' Lifestyle home">
      <span
        className={cn(
          "truncate font-display font-extrabold transition-all duration-300 sm:text-[1.35rem]",
          compact ? "text-[1rem]" : "text-[1.2rem]",
          main,
        )}
      >
        gadget<span className={sub}>Opedia</span>
      </span>
      <span className={cn("eyebrow mt-1 sm:block", compact ? "hidden" : "block", sub)}>
        n&rsquo; Lifestyle
      </span>
    </Link>
  );
}
