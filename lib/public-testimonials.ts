export type PublicTestimonial = {
  id: string;
  clientName: string;
  city: string;
  country: string;
  message: string;
  rating: number | null;
  photoUrl: string | null;
};

export function publicTestimonialsApiBase(): string {
  return (
    process.env.INTERNAL_AUTH_API_URL ||
    process.env.AUTH_API_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");
}

/** Tag Next.js — invalidé quand un admin valide / refuse un avis. */
export const PUBLIC_TESTIMONIALS_CACHE_TAG = "public-testimonials";

/** Avis validés (public) — pour pages SSR accueil / coming soon. */
export async function fetchApprovedTestimonials(limit = 12): Promise<PublicTestimonial[]> {
  try {
    const res = await fetch(`${publicTestimonialsApiBase()}/public/testimonials?limit=${limit}`, {
      cache: "no-store",
      next: { tags: [PUBLIC_TESTIMONIALS_CACHE_TAG] },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: PublicTestimonial[] };
    return json.data || [];
  } catch {
    return [];
  }
}
