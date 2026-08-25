import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export type CartLine = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  quantity: number;
  max_stock: number;
};

type CartValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  /** Adds an item, clamped to the product's available stock. */
  addToCart: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  /** Aliases kept for existing call sites. */
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  ready: boolean;
};

const STORAGE_KEY = "gadgetopedia.cart.v1";

const CartContext = createContext<CartValue | null>(null);

function normalize(line: Partial<CartLine>): CartLine {
  return {
    id: String(line.id),
    name: line.name ?? "Product",
    slug: line.slug ?? "",
    price: Number(line.price ?? 0),
    image_url: line.image_url ?? null,
    quantity: Math.max(1, Number(line.quantity ?? 1)),
    max_stock: Number.isFinite(Number(line.max_stock)) ? Number(line.max_stock) : 99,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CartLine>[];
        if (Array.isArray(parsed)) setLines(parsed.map(normalize));
      }
    } catch {
      /* ignore corrupted cart */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable */
    }
  }, [lines, ready]);

  const addToCart = useCallback((line: Omit<CartLine, "quantity">, quantity = 1) => {
    const stock = Number.isFinite(Number(line.max_stock)) ? Number(line.max_stock) : 99;
    if (stock <= 0) {
      toast.error(`${line.name} is out of stock`);
      return;
    }
    setLines((current) => {
      const found = current.find((l) => l.id === line.id);
      const wanted = (found?.quantity ?? 0) + quantity;
      const capped = Math.min(wanted, stock);
      if (found && capped === found.quantity) {
        toast.error(`Only ${stock} left in stock`);
        return current;
      }
      if (capped < wanted) toast.warning(`Only ${stock} in stock — quantity adjusted`);
      if (found) {
        return current.map((l) =>
          l.id === line.id ? { ...l, quantity: capped, max_stock: stock } : l,
        );
      }
      return [...current, normalize({ ...line, max_stock: stock, quantity: capped })];
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => l.id !== id)
        : current.map((l) =>
            l.id === id
              ? { ...l, quantity: Math.min(quantity, Math.max(1, l.max_stock)) }
              : l,
          ),
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setLines((current) => current.filter((l) => l.id !== id));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    return {
      lines,
      count,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      add: addToCart,
      setQuantity: updateQuantity,
      remove: removeFromCart,
      clear: clearCart,
      ready,
    };
  }, [lines, addToCart, updateQuantity, removeFromCart, clearCart, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
