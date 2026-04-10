const KEY = "lasolution_checkout_delivery_v1";

export type CheckoutDeliveryDraft = {
  deliveryMode: "AIR" | "SEA";
  country: string;
  phone: string;
  address: string;
  instructions: string;
};

export function saveCheckoutDelivery(d: CheckoutDeliveryDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(d));
}

export function loadCheckoutDelivery(): CheckoutDeliveryDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const x = o as Record<string, unknown>;
    const mode = x.deliveryMode === "SEA" ? "SEA" : "AIR";
    return {
      deliveryMode: mode,
      country: typeof x.country === "string" ? x.country : "",
      phone: typeof x.phone === "string" ? x.phone : "",
      address: typeof x.address === "string" ? x.address : "",
      instructions: typeof x.instructions === "string" ? x.instructions : "",
    };
  } catch {
    return null;
  }
}

export function clearCheckoutDelivery() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
