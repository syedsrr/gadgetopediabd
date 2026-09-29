import type { ReactNode } from "react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="ambient-field" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <Header />
      <main className="relative z-10 flex-1">{children}</main>
      <Footer />

    </div>
  );
}
