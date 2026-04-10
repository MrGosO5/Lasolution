"use client";

import { useState } from "react";
import { Card } from "@/app/site/components/UI";
import { addToCart } from "@/app/site/cart";

export type StoreProduct = {
  id: string;
  name: string;
  price: number;
  rating: number;
};

export function StoreProductListClient({ storeSlug, products }: { storeSlug: string; products: StoreProduct[] }) {
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p, idx) => {
        const itemId = `${storeSlug}:${p.id}`;
        const added = justAddedId === itemId;
        return (
          <div key={p.id} className={idx ? "" : ""}>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                <span className="text-xs font-semibold text-gray-700">{String(p.rating).replace(".", ",")}</span>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-gray-900">{p.price.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}€</p>
              <button
                type="button"
                className={`mt-5 w-full btn ${added ? "btn-dark" : "btn-primary"}`}
                onClick={() => {
                  addToCart({
                    id: itemId,
                    name: p.name,
                    unitPrice: p.price,
                    currency: "EUR",
                    store: storeSlug,
                    quantity: 1,
                  });
                  setJustAddedId(itemId);
                  window.setTimeout(() => setJustAddedId(null), 900);
                }}
              >
                {added ? "Ajouté" : "Ajouter au panier"}
              </button>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

