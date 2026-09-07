import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import {
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Store,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw redirect({ to: "/auth" });

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      toast.error("You don't have access to the admin area.");
      throw redirect({ to: "/account" });
    }

    return { adminUser: userData.user };
  },
  head: () => ({
    meta: [
      { title: "Store admin — gadgetOpedia n' Lifestyle" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});


const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/import", label: "CSV import", icon: Upload },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }



  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="flex items-center gap-3">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/shop">
                <Store className="mr-1.5 h-4 w-4" /> View store
              </Link>
            </Button>
            <Button variant="secondary" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6 lg:flex-row">
        <nav className="lg:w-56 lg:shrink-0">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: Boolean((item as { exact?: boolean }).exact) }}
                  className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-background hover:text-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
