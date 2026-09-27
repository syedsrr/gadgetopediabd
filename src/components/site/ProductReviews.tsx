import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthModal } from "@/components/site/AuthModal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  user_id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const reviewsQuery = (productId: string) => ({
  queryKey: ["reviews", productId],
  queryFn: async (): Promise<Review[]> => {
    const { data, error } = await db
      .from("product_reviews")
      .select("id,user_id,author_name,rating,comment,created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(size, i <= Math.round(value) ? "fill-accent text-accent" : "text-border")}
        />
      ))}
    </span>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const { data: reviews = [], isPending } = useQuery(reviewsQuery(productId));
  const [userId, setUserId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const mine = reviews.find((r) => r.user_id === userId);
  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment ?? "");
    }
  }, [mine?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const counts = [5, 4, 3, 2, 1].map((n) => reviews.filter((r) => r.rating === n).length);

  async function submit() {
    if (!userId) {
      setAuthOpen(true);
      return;
    }
    if (rating < 1) {
      toast.error("Please choose a star rating");
      return;
    }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,email")
        .eq("id", userId)
        .maybeSingle();
      const name = (
        profile?.full_name ||
        u.user?.user_metadata?.['full_name'] ||
        (profile?.email ?? u.user?.email ?? "Customer").split("@")[0]
      ).slice(0, 60);
      const payload = {
        product_id: productId,
        user_id: userId,
        author_name: name,
        rating,
        comment: comment.trim().slice(0, 1000) || null,
      };
      const { error } = mine
        ? await db.from("product_reviews").update(payload).eq("id", mine.id)
        : await db.from("product_reviews").insert(payload);
      if (error) throw error;
      toast.success(mine ? "Review updated" : "Thanks for your review!");
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
    } catch {
      toast.error("Could not save your review");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const { error } = await db.from("product_reviews").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete review");
      return;
    }
    setRating(0);
    setComment("");
    qc.invalidateQueries({ queryKey: ["reviews", productId] });
  }

  return (
    <section className="mt-14 max-w-3xl" id="reviews">
      <h2 className="font-display text-xl font-bold">Customer reviews</h2>

      <div className="mt-4 grid gap-6 rounded-2xl border border-border p-5 sm:grid-cols-[auto_1fr]">
        <div className="text-center sm:pr-6">
          <div className="font-display text-4xl font-extrabold">{avg ? avg.toFixed(1) : "–"}</div>
          <Stars value={avg} />
          <p className="mt-1 text-xs text-muted-foreground">
            {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((n, i) => (
            <div key={n} className="flex items-center gap-2 text-xs">
              <span className="w-3">{n}</span>
              <Star className="h-3 w-3 fill-accent text-accent" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-moss"
                  style={{ width: reviews.length ? `${((counts[i] ?? 0) / reviews.length) * 100}%` : 0 }}
                />
              </div>
              <span className="w-6 text-right text-muted-foreground">{counts[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-secondary p-5">
        <h3 className="font-semibold">{mine ? "Edit your review" : "Write a review"}</h3>
        <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(i)}
              onClick={() => setRating(i)}
              className="flex h-10 w-10 items-center justify-center"
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  i <= (hover || rating) ? "fill-accent text-accent" : "text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
        <Textarea
          className="mt-3 bg-card"
          placeholder="Share your experience with this product (optional)"
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={submit} disabled={busy}>
            {userId ? (mine ? "Update review" : "Submit review") : "Sign in to review"}
          </Button>
          {mine && (
            <Button variant="outline" onClick={() => remove(mine.id)}>
              Delete my review
            </Button>
          )}
        </div>
      </div>

      <ul className="mt-6 divide-y divide-border">
        {isPending && <li className="py-4 text-sm text-muted-foreground">Loading reviews…</li>}
        {!isPending && reviews.length === 0 && (
          <li className="py-4 text-sm text-muted-foreground">No reviews yet — be the first!</li>
        )}
        {reviews.map((r) => (
          <li key={r.id} className="py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{r.author_name}</p>
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} size="h-3.5 w-3.5" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
              {r.user_id === userId && (
                <button
                  aria-label="Delete review"
                  onClick={() => remove(r.id)}
                  className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {r.comment && (
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{r.comment}</p>
            )}
          </li>
        ))}
      </ul>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </section>
  );
}
