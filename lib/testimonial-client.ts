export type TestimonialStatus = "PENDING" | "APPROVED" | "REJECTED";

export function testimonialStatusLabel(status: TestimonialStatus): string {
  if (status === "APPROVED") return "Publié sur le site";
  if (status === "REJECTED") return "À modifier";
  return "En attente de validation";
}

export function testimonialStatusClass(status: TestimonialStatus): string {
  if (status === "APPROVED") return "bg-emerald-50 ring-emerald-200 text-emerald-900";
  if (status === "REJECTED") return "bg-red-50 ring-red-200 text-red-900";
  return "bg-amber-50 ring-amber-200 text-amber-900";
}

/** Commande considérée livrée (aligné backend). */
export function isOrderDelivered(order: {
  status?: string | null;
  parcels?: { status?: string | null }[] | null;
}): boolean {
  if (!order) return false;
  if (String(order.status || "").toUpperCase() === "DELIVERED") return true;
  const parcels = order.parcels || [];
  if (parcels.length === 0) return false;
  return parcels.every((p) => String(p.status || "").toUpperCase() === "DELIVERED");
}
