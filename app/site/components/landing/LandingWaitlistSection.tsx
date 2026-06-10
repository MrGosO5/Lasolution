"use client";

import { ComingSoonWaitlistForm } from "@/app/coming-soon/ComingSoonWaitlistForm";
import { Reveal } from "@/app/site/components/Reveal";
import { trackEvent } from "@/lib/analytics";

export function LandingWaitlistSection() {
  return (
    <section className="relative z-20 mx-auto w-full max-w-6xl px-6 pb-16">
      <Reveal>
        <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-10 overflow-visible">
          <div className="mx-auto w-full max-w-[720px] mb-8 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Besoin d’aide pour votre premier achat ?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Le service est disponible — laissez vos coordonnées si vous souhaitez un accompagnement personnalisé.
            </p>
          </div>
          <ComingSoonWaitlistForm
            withFrame={false}
            className="mx-auto w-full max-w-[720px]"
            onSubmitSuccess={() => trackEvent("landing_waitlist_submit")}
          />
        </div>
      </Reveal>
    </section>
  );
}
