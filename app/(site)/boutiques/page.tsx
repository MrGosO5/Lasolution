import { Reveal } from "@/app/site/components/Reveal";
import { BoutiquesHubClient } from "./BoutiquesHubClient";

export default function BoutiquesPage() {
  return (
    <main className="site-container site-section">
      <Reveal>
        <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Boutiques</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
          Recherchez. Commandez. Recevez, partout en Afrique.
        </h1>
        <p className="mt-4 max-w-2xl text-sm md:text-base text-gray-600 leading-relaxed">
          Choisissez une boutique, trouvez le produit qu’il vous faut, puis on s’occupe du reste.
        </p>
      </Reveal>

      <BoutiquesHubClient />
    </main>
  );
}
