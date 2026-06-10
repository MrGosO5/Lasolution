import { Reveal } from "@/app/site/components/Reveal";
import { TrackedLink } from "@/app/site/components/landing/TrackedLink";
import { LANDING_FEATURES_HEADLINE, SITE_FEATURES } from "@/lib/site-features";

export function LandingFeaturesSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-14 md:py-16">
      <Reveal>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{LANDING_FEATURES_HEADLINE}</h2>
      </Reveal>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {SITE_FEATURES.map((c, idx) => (
          <Reveal key={c.title} delayMs={80 * idx}>
            <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 transition-smooth hover:shadow-lg hover:shadow-gray-200/40 hover:-translate-y-0.5">
              <p className="text-sm font-semibold text-gray-900">{c.title}</p>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{c.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delayMs={160}>
        <div className="mt-10">
          <TrackedLink href="/services" className="btn btn-ghost" event="landing_cta_services">
            En savoir plus sur nos services
          </TrackedLink>
        </div>
      </Reveal>
    </section>
  );
}
