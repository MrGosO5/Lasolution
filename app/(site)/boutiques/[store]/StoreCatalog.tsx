"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Reveal } from "@/app/site/components/Reveal";
import { StoreLogo } from "@/app/site/components/StoreLogo";
import { Card } from "@/app/site/components/UI";
import { StoreProductListClient, type StoreProduct } from "@/app/site/components/StoreProductListClient";
import type { Store } from "@/app/site/stores";

export function StoreCatalog({
  store,
  storeSlug,
  products,
}: {
  store: Store;
  storeSlug: string;
  products: StoreProduct[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <>
      <Reveal delayMs={120}>
        <div className="mt-10 grid gap-6 md:grid-cols-[1fr_0.85fr]">
          <Card className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StoreLogo name={store.name} src={store.logoSrc} />
                <p className="text-sm font-semibold text-gray-900">Trouvez le produit qu’il vous faut</p>
              </div>
              <Link className="text-sm font-semibold text-gray-900 hover:underline" href="/panier">
                Voir le panier
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un produit"
                className="h-11 w-full rounded-xl bg-white/80 ring-1 ring-black/10 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[rgb(214_54_78/0.25)]"
                aria-label="Rechercher un produit"
              />
              <button
                type="button"
                className="h-11 rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white shadow-lg shadow-black/15 transition-smooth hover:bg-black"
                onClick={() => setQuery("")}
              >
                Réinitialiser
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {filtered.length === products.length
                ? `${products.length} produit(s) affiché(s).`
                : `${filtered.length} résultat(s) sur ${products.length}.`}
            </p>
          </Card>

          <div className="relative overflow-hidden rounded-3xl ring-1 ring-black/5 shadow-xl shadow-gray-200/40 bg-white/70 p-6">
            <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Inspiration</p>
            <p className="mt-2 text-sm text-gray-700">
              Exemples de produits – vous pouvez les ajouter au panier pour créer une vraie commande.
            </p>
            <div className="mt-5 relative h-28 w-full">
              <Image
                src="/icon/imgherolasolution.png"
                alt="Produits"
                fill
                sizes="(max-width: 768px) 100vw, 520px"
                className="object-contain"
                priority={false}
              />
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <h2 className="mt-12 text-xl font-bold text-gray-900">Les plus populaires</h2>
      </Reveal>

      <StoreProductListClient storeSlug={storeSlug} products={filtered} />
    </>
  );
}
