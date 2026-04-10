"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Reveal } from "@/app/site/components/Reveal";
import { Card, PageHeader, PrimaryButton, SecondaryButton } from "@/app/site/components/UI";
import { cartSubtotal, clearCart, loadCart, removeFromCart, setQuantity, type Cart } from "@/app/site/cart";

export default function PanierPage() {
  const [cart, setCart] = useState<Cart>({ items: [] });

  useEffect(() => {
    setCart(loadCart());
  }, []);

  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);
  const count = cart.items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="Boutiques"
          title="Votre panier"
          subtitle="Détails des produits de votre panier. Les frais d’expédition et de livraison seront communiqués dès que le produit sera prêt."
          right={
            <>
              <SecondaryButton href="/boutiques">Continuer mes achats</SecondaryButton>
              <SecondaryButton href="/checkout/expedition-livraison">Expédition &amp; livraison</SecondaryButton>
              <PrimaryButton href="/checkout/paiement">Payer</PrimaryButton>
            </>
          }
        />
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_0.85fr]">
        <Reveal>
          <Card className="p-6">
            {cart.items.length === 0 ? (
              <div className="grid gap-4">
                <div className="card p-6">
                  <p className="text-sm font-semibold text-gray-900">Votre panier est vide</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Ajoutez un produit depuis une boutique pour créer votre première commande.
                  </p>
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <Link className="btn btn-primary" href="/boutiques">
                      Aller aux boutiques
                    </Link>
                    <Link className="btn btn-ghost" href="/connexion">
                      Se connecter
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">{count}</span> article(s)
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      clearCart();
                      setCart({ items: [] });
                    }}
                  >
                    Vider le panier
                  </button>
                </div>

                {cart.items.map((item) => {
                  const total = item.unitPrice * item.quantity;
                  return (
                    <div key={item.id} className="card p-5">
                      <div className="flex items-start justify-between gap-6">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            Prix unitaire: {item.unitPrice.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}€
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Qté</p>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const next = setQuantity(item.id, Number(e.target.value || 1));
                              setCart(next);
                            }}
                            aria-label={`Quantité pour ${item.name}`}
                            className="mt-1 h-10 w-20 rounded-xl bg-white/80 ring-1 ring-black/10 px-3 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[rgb(214_54_78/0.25)]"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Sous-total</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900">
                            {total.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}€
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => {
                              const next = removeFromCart(item.id);
                              setCart(next);
                            }}
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
            <h2 className="text-sm font-semibold text-gray-900">Récapitulatif</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-semibold text-gray-900">
                  {subtotal.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}€
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Expédition</span>
                <span className="font-semibold text-gray-900">À préciser</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Livraison</span>
                <span className="font-semibold text-gray-900">À préciser</span>
              </div>
              <div className="h-px bg-black/5" />
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold">Total TTC</span>
                <span className="text-gray-900 font-extrabold">
                  {subtotal.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}€
                </span>
              </div>
            </div>

            <Link
              href="/checkout/expedition-livraison"
              className={`mt-6 w-full btn btn-ghost ${cart.items.length === 0 ? "pointer-events-none opacity-60" : ""}`}
              aria-disabled={cart.items.length === 0}
            >
              Expédition &amp; livraison
            </Link>
            <Link
              href="/checkout/paiement"
              className={`mt-3 w-full btn btn-primary ${cart.items.length === 0 ? "pointer-events-none opacity-60" : ""}`}
              aria-disabled={cart.items.length === 0}
            >
              Payer
            </Link>

            <p className="mt-4 text-xs text-gray-500 leading-relaxed">
              Comment sont calculés les frais ? Les frais d’expédition sont fixés après la pesée du colis une fois le produit
              réceptionné en Europe. Les frais de livraison dépendent de la destination finale.
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

