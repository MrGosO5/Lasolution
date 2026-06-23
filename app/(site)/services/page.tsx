import Link from "next/link";
import { Reveal } from "@/app/site/components/Reveal";
import { Card } from "@/app/site/components/UI";
import { SITE_FEATURES } from "@/lib/site-features";

export default function ServicesPage() {
  return (
    <main className="site-container site-section">
      <Reveal>
        <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Services</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
          Transporter ou acheter depuis l’Europe, sans stress.
        </h1>
        <p className="mt-4 max-w-2xl text-sm md:text-base text-gray-600 leading-relaxed">
          La Solution vous accompagne sur toute la chaîne: sélection du produit, achat assisté, paiement,
          expédition (aérien / maritime), livraison et suivi.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {SITE_FEATURES.map((f, idx) => (
          <Reveal key={f.title} delayMs={80 * idx}>
            <Card className="p-6">
              <p className="text-sm font-semibold text-gray-900">{f.title}</p>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal delayMs={160}>
        <div className="mt-12 rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-8 md:p-10">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Prêt à commencer ?</h2>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">
            Parcourez les boutiques, ajoutez au panier et finalisez votre commande. Pour un envoi de colis, utilisez le
            formulaire d’expédition.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/boutiques"
              className="btn btn-primary"
            >
              Aller aux boutiques
            </Link>
            <Link
              href="/expedier-un-colis"
              className="btn btn-ghost"
            >
              Expédier un colis
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

