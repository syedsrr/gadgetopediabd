import { Link } from "@tanstack/react-router";

import logoAsset from "@/assets/gadgetopedia-logo.webp.asset.json";

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <Link
      to="/"
      className="block shrink-0"
      aria-label="gadgetOpedia n' Lifestyle home"
    >
      <img
        src={logoAsset.url}
        alt="gadgetOpedia n' Lifestyle"
        width={1025}
        height={400}
        className={tone === "dark" ? "h-14 w-auto sm:h-16" : "h-10 w-auto sm:h-12"}
        decoding="async"
      />
    </Link>
  );
}
