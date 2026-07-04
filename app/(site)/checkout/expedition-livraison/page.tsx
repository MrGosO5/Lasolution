"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Reveal } from "@/app/site/components/Reveal";
import { Select, TextArea, TextInput } from "@/app/site/components/Form";
import { PhoneInput } from "@/app/site/components/PhoneInput";
import { PageHeader } from "@/app/site/components/UI";
import { cartSubtotal, loadCart, type Cart } from "@/app/site/cart";
import { loadCheckoutDelivery, saveCheckoutDelivery } from "@/app/site/checkout-delivery";

export default function ExpeditionLivraisonPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [deliveryMode, setDeliveryMode] = useState<"AIR" | "SEA">("AIR");
  const [country, setCountry] = useState("Bénin");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCart(loadCart());
    const prev = loadCheckoutDelivery();
    if (prev) {
      setDeliveryMode(prev.deliveryMode);
      setCountry(prev.country || "Bénin");
      setPhone(prev.phone);
      setAddress(prev.address);
      setInstructions(prev.instructions);
    }
  }, []);

  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);
  const productCount = cart.items.reduce((acc, i) => acc + i.quantity, 0);

  function confirm() {
    setError(null);
    if (cart.items.length === 0) {
      setError("Votre panier est vide. Ajoutez des articles avant de continuer.");
      return;
    }
    if (!phone.trim() || !address.trim()) {
      setError("Indiquez au minimum votre téléphone et votre adresse de livraison.");
      return;
    }
    saveCheckoutDelivery({
      deliveryMode,
      country: country.trim(),
      phone: phone.trim(),
      address: address.trim(),
      instructions: instructions.trim(),
    });
    router.push("/checkout/paiement");
  }

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="Checkout"
          title="Expédition et livraison"
          subtitle="Choisissez le mode de transport et indiquez où livrer le colis. Ces informations seront reprises au paiement."
          right={
            <div className="flex flex-wrap gap-2 justify-end">
              <Link href="/panier" className="btn btn-ghost">
                Retour panier
              </Link>
              <Link href="/checkout/paiement" className="btn btn-ghost">
                Passer au paiement
              </Link>
            </div>
          }
        />
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_0.85fr]">
        <Reveal>
          <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7 grid gap-4">
            {error ? <p className="text-sm text-red-700 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">{error}</p> : null}

            <div className="grid gap-2">
              <p className="text-xs font-semibold tracking-wide text-gray-700 uppercase">Mode de transport</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className={deliveryMode === "AIR" ? "btn btn-primary h-12 rounded-2xl" : "btn btn-ghost h-12 rounded-2xl"}
                  onClick={() => setDeliveryMode("AIR")}
                >
                  Aérien
                </button>
                <button
                  type="button"
                  className={deliveryMode === "SEA" ? "btn btn-primary h-12 rounded-2xl" : "btn btn-ghost h-12 rounded-2xl"}
                  onClick={() => setDeliveryMode("SEA")}
                >
                  Maritime
                </button>
              </div>
            </div>

            <div className="mt-2 grid gap-4 md:grid-cols-2">
              <Select label="Pays" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option>Bénin</option>
                <option>Togo</option>
                <option>Sénégal</option>
                <option>Côte d&apos;Ivoire</option>
                <option>Autre (préciser dans l&apos;adresse)</option>
              </Select>
              <PhoneInput label="Numéro de téléphone" value={phone} onChange={setPhone} country={country} />
            </div>

            <TextInput
              label="Adresse de livraison"
              placeholder="Numéro, rue, quartier, ville"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <TextArea
              label="Instructions (optionnel)"
              placeholder="Ex. : disponible après 18h, code d’accès, point de repère…"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />

            <button type="button" className="mt-2 btn btn-dark" onClick={confirm} disabled={cart.items.length === 0}>
              Enregistrer et continuer vers le paiement
            </button>
            <p className="text-xs text-gray-500">
              Les frais d’expédition et de livraison sont communiqués après réception et pesée du colis en Europe, comme indiqué sur le panier.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
            <h2 className="text-sm font-semibold text-gray-900">Récapitulatif</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Nombre de produits</span>
                <span className="font-semibold text-gray-900">{productCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-semibold text-gray-900">
                  {subtotal.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €
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
                <span className="text-gray-700 font-semibold">Total TTC (hors frais)</span>
                <span className="text-gray-900 font-extrabold">
                  {subtotal.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
