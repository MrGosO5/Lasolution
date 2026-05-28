import Image from "next/image";
import { Reveal } from "@/app/site/components/Reveal";
import { testimonialPhotoUrl } from "@/lib/testimonial-media";
import { fetchApprovedTestimonials } from "@/lib/public-testimonials";

function Stars({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  return (
    <p className="mt-2 text-xs text-amber-600" aria-label={`Note ${rating} sur 5`}>
      {"★".repeat(rating)}
      <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
    </p>
  );
}

type Props = {
  sectionTitle?: string;
  sectionLead?: string;
  limit?: number;
  className?: string;
};

export async function PublicTestimonialsSection({
  sectionTitle = "Témoignages",
  sectionLead = "Faites vos achats ou envoyez un colis à vos proches en toute confiance, on s'occupe de tout.",
  limit = 12,
  className = "mx-auto w-full max-w-6xl px-6 pb-20",
}: Props) {
  const items = await fetchApprovedTestimonials(limit);

  return (
    <section className={className}>
      <Reveal>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{sectionTitle}</h2>
        <p className="mt-2 text-sm text-gray-600">{sectionLead}</p>
      </Reveal>

      {items.length === 0 ? (
        <Reveal delayMs={80}>
          <p className="mt-8 text-sm text-gray-500 text-center py-8 rounded-2xl bg-white/50 ring-1 ring-black/5">
            Les témoignages de nos clients apparaîtront ici prochainement.
          </p>
        </Reveal>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((t, idx) => {
            const photo = testimonialPhotoUrl(t.photoUrl);
            const location = [t.city, t.country].filter(Boolean).join(", ");
            return (
              <Reveal key={t.id} delayMs={70 * idx}>
                <figure className="rounded-2xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 transition-smooth hover:shadow-lg hover:shadow-gray-200/40 h-full flex flex-col">
                  {photo ? (
                    <div className="relative h-12 w-12 mb-3 overflow-hidden rounded-full ring-1 ring-black/10">
                      <Image src={photo} alt="" fill className="object-cover" sizes="48px" unoptimized />
                    </div>
                  ) : (
                    <div
                      className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(195,35,83,0.12)] text-sm font-bold text-[var(--logo-red-dark)] ring-1 ring-[var(--logo-red)]/20"
                      aria-hidden
                    >
                      {t.clientName.charAt(0)}
                    </div>
                  )}
                  <blockquote className="text-sm text-gray-700 leading-relaxed flex-1">"{t.message}"</blockquote>
                  <Stars rating={t.rating} />
                  <figcaption className="mt-4 text-sm font-semibold text-gray-900">
                    {t.clientName}{" "}
                    {location ? <span className="font-normal text-gray-500">— {location}</span> : null}
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}
