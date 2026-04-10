import { Reveal } from "@/app/site/components/Reveal";

const FAQ = [
  {
    q: "Comment passer une commande ?",
    a: "Choisissez une boutique, ajoutez vos produits au panier, puis suivez les étapes de paiement et d’expédition.",
  },
  {
    q: "Quels sont les délais de livraison ?",
    a: "Les délais dépendent du mode d’expédition (aérien / maritime) et de la destination. Vous verrez l’estimation dans le suivi.",
  },
  {
    q: "Puis-je suivre ma commande en temps réel ?",
    a: "Oui. Vous recevez des notifications à chaque étape et vous pouvez consulter l’avancement dans “Mes commandes”.",
  },
  {
    q: "Comment sont calculés les frais d’expédition ?",
    a: "Ils sont fixés après réception et pesée du colis en Europe. Les frais de livraison dépendent de la destination finale.",
  },
  {
    q: "Y a-t-il des frais cachés ?",
    a: "Non. Les coûts sont transparents: achat, expédition, livraison. Les frais variables sont communiqués dès qu’ils sont connus.",
  },
  {
    q: "Comment créer un compte ?",
    a: "Rendez-vous sur “S’inscrire”, complétez le formulaire et validez. Vous pourrez ensuite commander et suivre vos colis.",
  },
  {
    q: "Que faire si j’ai oublié mon mot de passe ?",
    a: "Utilisez “Mot de passe oublié ?” sur la page de connexion pour recevoir un code de réinitialisation.",
  },
  {
    q: "Comment puis-je contacter le service client ?",
    a: "Depuis la page Support, ou via l’assistance intégrée dans votre espace, selon votre rôle.",
  },
  {
    q: "Et si j’ai un litige sur une commande ?",
    a: "Contactez le support avec la référence commande et une description. Nous vous guidons sur les étapes de résolution.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 md:py-16">
      <Reveal>
        <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">FAQ</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
          Foire Aux Questions
        </h1>
        <p className="mt-4 text-sm md:text-base text-gray-600 leading-relaxed">
          Les réponses aux questions les plus fréquentes sur l’achat assisté, l’expédition et le suivi.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-3">
        {FAQ.map((item, idx) => (
          <Reveal key={item.q} delayMs={70 * idx}>
            <details className="group rounded-2xl bg-white/70 ring-1 ring-black/5 shadow-sm p-5 transition-smooth hover:shadow-lg hover:shadow-gray-200/40">
              <summary className="cursor-pointer list-none select-none">
                <div className="flex items-start justify-between gap-6">
                  <p className="text-sm font-semibold text-gray-900">{item.q}</p>
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/5 text-gray-900 transition-smooth group-open:rotate-45">
                    +
                  </span>
                </div>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </main>
  );
}

