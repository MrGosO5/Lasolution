export type CartItem = {
  id: string;
  name: string;
  unitPrice: number;
  currency: "EUR";
  quantity: number;
  store?: string;
};

export type Cart = {
  items: CartItem[];
};

const KEY = "lasolution_cart_v1";

function safeParse(raw: string | null): Cart | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as unknown;
    if (!obj || typeof obj !== "object") return null;
    const items = (obj as any).items;
    if (!Array.isArray(items)) return null;
    return {
      items: items
        .map((i: any) => ({
          id: String(i.id ?? ""),
          name: String(i.name ?? ""),
          unitPrice: Number(i.unitPrice ?? 0),
          currency: "EUR" as const,
          quantity: Math.max(1, Number(i.quantity ?? 1)),
          store: i.store ? String(i.store) : undefined,
        }))
        .filter((i: CartItem) => i.id && i.name),
    };
  } catch {
    return null;
  }
}

export function loadCart(): Cart {
  if (typeof window === "undefined") return { items: [] };
  const parsed = safeParse(window.localStorage.getItem(KEY));
  return parsed ?? { items: [] };
}

export function saveCart(cart: Cart) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(cart));
}

export function clearCart() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }) {
  const cart = loadCart();
  const qty = Math.max(1, item.quantity ?? 1);
  const existing = cart.items.find((x) => x.id === item.id);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.items.push({ ...item, quantity: qty });
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(id: string) {
  const cart = loadCart();
  cart.items = cart.items.filter((x) => x.id !== id);
  saveCart(cart);
  return cart;
}

export function setQuantity(id: string, quantity: number) {
  const cart = loadCart();
  const q = Math.max(1, Math.floor(quantity));
  const item = cart.items.find((x) => x.id === id);
  if (item) item.quantity = q;
  saveCart(cart);
  return cart;
}

export function cartSubtotal(cart: Cart) {
  return cart.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
}

