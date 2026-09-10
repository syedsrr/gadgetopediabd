import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { adminCategoriesQuery } from "@/lib/adminCatalog";
import { PRODUCT_CSV_TEMPLATE, parseCsvObjects } from "@/lib/csv";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/import")({
  component: ImportAdmin,
});

type Parsed = {
  row: number;
  values: Record<string, string>;
  error?: string;
};

function ImportAdmin() {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery(adminCategoriesQuery);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<Parsed[] | null>(null);

  function analyse(raw: string) {
    const rows = parseCsvObjects(raw);
    if (rows.length === 0) {
      toast.error("No rows found in that CSV.");
      setParsed(null);
      return;
    }
    const seen = new Set<string>();
    const result: Parsed[] = rows.map((values, i) => {
      const name = values["name"] ?? values["title"] ?? "";
      const slug = (values["slug"] || slugify(name)).toLowerCase();
      const price = Number(values["price"]);
      const stock = Number(values["stock"] ?? values["stock_quantity"] ?? 0);
      const categoryName = values["category"] ?? "";
      let error: string | undefined;

      if (!name.trim()) error = "Missing product name";
      else if (!Number.isFinite(price) || price <= 0) error = "Price must be a number above 0";
      else if (!Number.isInteger(stock) || stock < 0) error = "Stock must be a whole number";
      else if (seen.has(slug)) error = "Duplicate row for the same product";
      else if (
        categoryName &&
        !categories.some(
          (c) =>
            c.id === categoryName ||
            c.name.toLowerCase() === categoryName.toLowerCase() ||
            c.slug === slugify(categoryName),
        )
      )
        error = `Unknown category “${categoryName}”`;

      seen.add(slug);
      return error ? { row: i + 2, values: { ...values, slug }, error } : { row: i + 2, values: { ...values, slug } };
    });
    setParsed(result);
  }

  const importRows = useMutation({
    mutationFn: async () => {
      const good = (parsed ?? []).filter((p) => !p.error);
      const payload = good.map(({ values }) => {
        const name = values["name"] || values["title"] || "";
        const categoryName = values["category"] ?? "";
        const category = categories.find(
          (c) =>
            c.id === categoryName ||
            c.name.toLowerCase() === categoryName.toLowerCase() ||
            c.slug === slugify(categoryName),
        );
        const description = values["description"] || values["specs_description"] || null;
        const brand = values["brand"] || values["manufacturer"] || null;
        return {
          name,
          title: name,
          slug: values["slug"]!,
          sku: values["sku"] || null,
          brand,
          manufacturer: brand,
          category_id: category?.id ?? null,
          category: category?.name ?? null,
          price: Number(values["price"]),
          sale_price: values["sale_price"] ? Number(values["sale_price"]) : null,
          old_price: values["old_price"] ? Number(values["old_price"]) : null,
          stock: Number(values["stock"] ?? values["stock_quantity"] ?? 0),
          low_stock_threshold: values["low_stock_threshold"]
            ? Number(values["low_stock_threshold"])
            : 5,
          image_url: values["image_url"] || null,
          image_alt: values["image_alt"] || name,
          short_description: values["short_description"] || null,
          description,
          specs_description: description,
          weight_kg: values["weight_kg"] ? Number(values["weight_kg"]) : null,
          status: (values["status"] === "draft" || values["status"] === "archived"
            ? values["status"]
            : "published") as "draft" | "published" | "archived",
          is_active: values["is_active"] ? values["is_active"] !== "false" : true,
          is_featured: values["is_featured"] === "true",
          is_preorder: values["is_preorder"] === "true",
          preorder_release_date: values["preorder_release_date"] || null,
          preorder_note: values["preorder_note"] || null,
        };
      });

      const { error } = await supabase.from("products").upsert(payload, { onConflict: "slug" });
      if (error) throw new Error(error.message);
      return payload.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} product${count === 1 ? "" : "s"} imported`);
      setParsed(null);
      setText("");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function downloadTemplate() {
    const blob = new Blob([PRODUCT_CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gadgetopedia-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const okCount = (parsed ?? []).filter((p) => !p.error).length;
  const badRows = (parsed ?? []).filter((p) => p.error);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Import products from CSV</h1>
          <p className="text-sm text-muted-foreground">
            Rows are matched on the product slug, so re-importing updates existing products.
          </p>
        </div>
        <Button variant="secondary" onClick={downloadTemplate}>
          <Download className="mr-1.5 h-4 w-4" /> Download template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Add your file or paste rows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const raw = await file.text();
              setText(raw);
              analyse(raw);
            }}
            className="block w-full text-sm"
          />
          <Textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PRODUCT_CSV_TEMPLATE}
            className="font-mono text-xs"
          />
          <Button variant="secondary" onClick={() => analyse(text)} disabled={!text.trim()}>
            Check rows
          </Button>
        </CardContent>
      </Card>

      {parsed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              2. Review — {okCount} ready, {badRows.length} with problems
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {badRows.length > 0 && (
              <ul className="space-y-1 rounded-xl border border-border bg-secondary/50 p-4 text-sm">
                {badRows.slice(0, 20).map((r) => (
                  <li key={r.row}>
                    <span className="font-semibold">Row {r.row}:</span> {r.error}
                  </li>
                ))}
                {badRows.length > 20 && <li>…and {badRows.length - 20} more.</li>}
              </ul>
            )}
            <Button disabled={okCount === 0 || importRows.isPending} onClick={() => importRows.mutate()}>
              {importRows.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-4 w-4" />
              )}
              Import {okCount} product{okCount === 1 ? "" : "s"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
