import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { ProductForm, type ProductFormInitial } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { adminCategoriesQuery, productForEditQuery } from "@/lib/adminCatalog";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const { data: product, isPending, isError } = useQuery(productForEditQuery(id));
  const { data: categories = [] } = useQuery(adminCategoriesQuery);

  if (isPending) {
    return <p className="text-sm text-muted-foreground">Loading product…</p>;
  }

  if (isError || !product) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">This product could not be found.</p>
        <Button asChild variant="secondary">
          <Link to="/admin/products">Back to products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to products">
            <Link to="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">{product.name}</h1>
            <p className="text-xs text-muted-foreground">
              {product.sku ?? "no SKU"} · /{product.slug}
            </p>
          </div>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link to="/product/$slug" params={{ slug: product.slug }} target="_blank">
            <ExternalLink className="mr-1.5 h-4 w-4" /> View in store
          </Link>
        </Button>
      </div>

      <ProductForm
        key={product.id}
        categories={categories}
        initial={product as unknown as ProductFormInitial}
      />
    </div>
  );
}
