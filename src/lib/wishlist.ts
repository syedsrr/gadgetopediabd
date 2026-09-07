import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/useAdmin";

export type WishlistRow = {
  id: string;
  product_id: string;
  created_at: string;
};

/** Wish list ids for the signed-in buyer (RLS keeps rows private per user). */
export function useWishlist() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const items = useQuery({
    queryKey: ["wishlist", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id, product_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WishlistRow[];
    },
  });

  const ids = new Set((items.data ?? []).map((row) => row.product_id));

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!userId) throw new Error("sign-in-required");
      if (ids.has(productId)) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("product_id", productId);
        if (error) throw error;
        return { saved: false };
      }
      const { error } = await supabase
        .from("wishlist_items")
        .insert({ user_id: userId, product_id: productId });
      if (error) throw error;
      return { saved: true };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist", userId] }),
  });

  return { items, ids, toggle, isSignedIn: Boolean(userId) };
}
