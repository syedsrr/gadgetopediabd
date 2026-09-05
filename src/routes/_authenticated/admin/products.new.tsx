import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { adminCategoriesQuery } from "@/lib/adminCatalog";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  component: NewProduct,
});

function NewProduct() {
  const { data: categories = [], isPending } = useQuery(adminCategoriesQuery);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Back to products">
          <Link to="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold">Add product</h1>
      </div>
      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading categories…</p>
      ) : (
        <ProductForm categories={categories} />
      )}
    </div>
  );
}
