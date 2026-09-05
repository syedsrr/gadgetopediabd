import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCategoriesQuery,
  deleteCategory,
  saveCategory,
} from "@/lib/adminCatalog";
import type { Category } from "@/lib/catalog";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesAdmin,
});

type Draft = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string;
  image_url: string;
  sort_order: string;
  is_active: boolean;
};

const empty: Draft = {
  name: "",
  slug: "",
  description: "",
  parent_id: "",
  image_url: "",
  sort_order: "0",
  is_active: true,
};

function CategoriesAdmin() {
  const queryClient = useQueryClient();
  const { data: categories = [], isPending } = useQuery(adminCategoriesQuery);
  const [draft, setDraft] = useState<Draft>(empty);

  const save = useMutation({
    mutationFn: () =>
      saveCategory({
        ...(draft.id ? { id: draft.id } : {}),
        name: draft.name.trim(),
        slug: (draft.slug.trim() || slugify(draft.name)).toLowerCase(),
        description: draft.description.trim() || null,
        parent_id: draft.parent_id || null,
        image_url: draft.image_url.trim() || null,
        sort_order: Number(draft.sort_order || 0),
        is_active: draft.is_active,
      }),
    onSuccess: () => {
      toast.success(draft.id ? "Category updated" : "Category added");
      setDraft(empty);
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Category removed");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function edit(c: Category) {
    setDraft({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: (c as { description?: string | null }).description ?? "",
      parent_id: (c as { parent_id?: string | null }).parent_id ?? "",
      image_url: c.image_url ?? "",
      sort_order: String(c.sort_order ?? 0),
      is_active: c.is_active,
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Categories drive the store menu, filters and category pages.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardContent className="p-0">
            {isPending ? (
              <p className="p-6 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <ul className="divide-y divide-border">
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        /{c.slug} · order {c.sort_order}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={c.is_active ? "default" : "secondary"}>
                        {c.is_active ? "Visible" : "Hidden"}
                      </Badge>
                      <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => edit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Delete"
                        onClick={() => remove.mutate(c.id)}
                      >
                        <Trash2 className="h-4 w-4 text-sale" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {draft.id ? "Edit category" : "New category"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                className="mt-1.5"
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    name: e.target.value,
                    slug: d.id ? d.slug : slugify(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                className="mt-1.5"
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1.5"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Parent category</Label>
              <Select
                value={draft.parent_id || "none"}
                onValueChange={(v) => setDraft((d) => ({ ...d, parent_id: v === "none" ? "" : v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top level)</SelectItem>
                  {categories
                    .filter((c) => c.id !== draft.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                className="mt-1.5"
                value={draft.image_url}
                onChange={(e) => setDraft((d) => ({ ...d, image_url: e.target.value }))}
              />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                className="mt-1.5"
                inputMode="numeric"
                value={draft.sort_order}
                onChange={(e) => setDraft((d) => ({ ...d, sort_order: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Visible in the store</span>
              <Switch
                checked={draft.is_active}
                onCheckedChange={(v) => setDraft((d) => ({ ...d, is_active: v }))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={save.isPending || draft.name.trim().length < 2}
                onClick={() => save.mutate()}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                {draft.id ? "Save changes" : "Add category"}
              </Button>
              {draft.id && (
                <Button variant="secondary" onClick={() => setDraft(empty)}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
