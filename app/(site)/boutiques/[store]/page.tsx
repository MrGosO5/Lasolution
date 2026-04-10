import { notFound } from "next/navigation";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader, PrimaryButton, SecondaryButton } from "@/app/site/components/UI";
import { getStore } from "@/app/site/stores";
import { StoreCatalog } from "./StoreCatalog";

const PRODUCTS = [
  { id: "p1", name: "Baskets", price: 17, rating: 4.5 },
  { id: "p2", name: "Sac à dos", price: 25, rating: 4.5 },
  { id: "p3", name: "Chaise de bureau", price: 39.98, rating: 4.5 },
  { id: "p4", name: "Supor autocuiseur", price: 187.73, rating: 4.5 },
  { id: "p5", name: "MacBook Air M1", price: 296.54, rating: 4.5 },
];

export default function StorePage({ params }: { params: { store: string } }) {
  const store = getStore(params.store);
  if (!store) return notFound();

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="Boutiques"
          title={store.name}
          subtitle={store.heroLine}
          right={
            <>
              <SecondaryButton href="/boutiques">Retour aux boutiques</SecondaryButton>
              <PrimaryButton href="/panier">Panier</PrimaryButton>
            </>
          }
        />
      </Reveal>

      <StoreCatalog store={store} storeSlug={params.store} products={PRODUCTS} />
    </main>
  );
}
