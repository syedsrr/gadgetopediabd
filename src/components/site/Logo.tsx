import { Link } from "@tanstack/react-router";

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  const main = tone === "dark" ? "text-canopy-foreground" : "text-primary";
  const sub = tone === "dark" ? "text-accent" : "text-moss";

  return (
    <Link to="/" className="group flex min-w-0 flex-col leading-none" aria-label="gadgetOpedia n' Lifestyle home">
      <span className={`truncate font-display text-[1.2rem] font-extrabold sm:text-[1.35rem] ${main}`}>
        gadget<span className={sub}>Opedia</span>
      </span>
      <span className={`eyebrow mt-1 ${sub}`}>n&rsquo; Lifestyle</span>
    </Link>
  );
}
