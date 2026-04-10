"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Reveal } from "@/app/site/components/Reveal";
import { TextInput } from "@/app/site/components/Form";
import { PageHeader } from "@/app/site/components/UI";
import { cartSubtotal, clearCart, loadCart, type Cart } from "@/app/site/cart";
import { clearCheckoutDelivery, loadCheckoutDelivery, type CheckoutDeliveryDraft } from "@/app/site/checkout-delivery";

type CreateOrderOut = {
  id: string;
};

function apiBase() {
  return (process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000").replace(/\/$/, "");
}

export default function CheckoutPaiementPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = session?.user?.accessToken;

  const [cart, setCart] = useState<Cart>({ items: [] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"AIR" | "SEA">("AIR");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [deliveryDraft, setDeliveryDraft] = useState<CheckoutDeliveryDraft | null>(null);

  useEffect(() => {
    setCart(loadCart());
    const d = loadCheckoutDelivery();
    if (d) {
      setDeliveryDraft(d);
      setDeliveryMode(d.deliveryMode);
    }
  }, []);

  const subtotal = useMemo(() => cartSubtotal(cart), [cart]);
  const productCount = cart.items.reduce((acc, i) => acc + i.quantity, 0);

  async function createOrder() {
    setError(null);
    if (!accessToken) {
      setError("Veuillez vous connecter pour finaliser le paiement.");
      return;
    }
    if (cart.items.length === 0) {
      setError("Votre panier est vide.");
      return;
    }
    if (!photoDataUrl) {
      setError("Photo obligatoire pour valider votre commande.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: "CONCIERGE_PURCHASE",
          currency: "EUR",
          deliveryMode,
          photoDataUrl,
          lines: cart.items.map((i) => ({
            description: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            currency: i.currency,
          })),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as CreateOrderOut;
      clearCart();
      clearCheckoutDelivery();
      router.push(`/mes-commandes/${data.id}`);
    } catch (e) {
      setError("Paiement/commande impossible. Vérifiez que la base et l’API backend sont OK, puis réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="Checkout"
          title="Paiement"
          subtitle="Saisissez vos informations de carte en toute sécurité pour finaliser votre achat. Toutes les transactions sont protégées."
        />
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_0.85fr]">
        <Reveal>
          <form className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-sm p-6 md:p-7 grid gap-4">
            {error ? <p className="text-sm text-red-700 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">{error}</p> : null}

            <div className="card bg-white/80 p-5">
              <p className="text-xs font-semibold tracking-wide text-gray-700 uppercase">Type de livraison</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className={
                    deliveryMode === "AIR"
                      ? "btn btn-primary"
                      : "btn btn-ghost"
                  }
                  onClick={() => setDeliveryMode("AIR")}
                >
                  Aérien
                </button>
                <button
                  type="button"
                  className={
                    deliveryMode === "SEA"
                      ? "btn btn-primary"
                      : "btn btn-ghost"
                  }
                  onClick={() => setDeliveryMode("SEA")}
                >
                  Maritime
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-600">
                <span className="font-semibold text-gray-900">Photo obligatoire</span> pour valider la commande (aérien et maritime).
              </p>
            </div>

            <div className="card bg-white/80 p-5">
              <p className="text-sm font-semibold text-gray-900">Photo du colis / produits (obligatoire)</p>
              <p className="mt-1 text-sm text-gray-600">Formats acceptés: JPG, PNG. Taille max: 5MB.</p>
              <input
                type="file"
                accept="image/jpeg,image/png"
                aria-label="Photo obligatoire de commande"
                className="mt-4 block w-full text-sm text-gray-700"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setPhotoDataUrl(null);
                    return;
                  }
                  if (!["image/jpeg", "image/png"].includes(file.type)) {
                    setError("Format invalide. Utilisez JPG ou PNG.");
                    setPhotoDataUrl(null);
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setError("Image trop grande. Max 5MB.");
                    setPhotoDataUrl(null);
                    return;
                  }
                  const dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result || ""));
                    reader.onerror = () => reject(new Error("READ_ERROR"));
                    reader.readAsDataURL(file);
                  }).catch(() => "");
                  setPhotoDataUrl(dataUrl || null);
                  setError(null);
                }}
              />
              {photoDataUrl ? (
                <div className="mt-4 grid gap-3">
                  <p className="text-xs font-semibold text-emerald-800">✔ Photo ajoutée</p>
                  <div className="relative h-40 w-full overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoDataUrl} alt="Aperçu photo" className="h-full w-full object-contain" />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs font-semibold text-red-700">Photo obligatoire</p>
              )}
            </div>

            <TextInput label="Numéro de carte" placeholder="1234 5678 9012 3456" inputMode="numeric" />
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Exp" placeholder="06/27" inputMode="numeric" />
              <TextInput label="CVV" placeholder="123" inputMode="numeric" />
            </div>
            <button
              type="button"
              disabled={loading || cart.items.length === 0 || !photoDataUrl}
              className="mt-2 btn btn-primary disabled:opacity-70 disabled:pointer-events-none"
              onClick={createOrder}
            >
              {loading
                ? "Paiement en cours..."
                : `Payer maintenant - ${subtotal.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`}
            </button>
            <p className="text-xs text-gray-500 leading-relaxed">
              Toutes vos transactions sont cryptées et protégées grâce à des protocoles de sécurité de niveau bancaire.
            </p>
          </form>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-6 md:p-7">
            <h2 className="text-sm font-semibold text-gray-900">Détails du panier</h2>
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
                <span className="text-gray-700 font-semibold">Total à payer</span>
                <span className="text-gray-900 font-extrabold">
                  {subtotal.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €
                </span>
              </div>
            </div>

            {deliveryDraft ? (
              <div className="mt-4 rounded-2xl bg-emerald-50/80 ring-1 ring-emerald-200/60 px-4 py-3 text-xs text-emerald-900">
                <p className="font-semibold">Livraison enregistrée</p>
                <p className="mt-1 text-emerald-800/90">
                  {deliveryDraft.country}
                  {deliveryDraft.address ? ` — ${deliveryDraft.address.slice(0, 80)}${deliveryDraft.address.length > 80 ? "…" : ""}` : ""}
                </p>
                <Link className="mt-2 inline-block font-semibold text-emerald-900 underline underline-offset-2" href="/checkout/expedition-livraison">
                  Modifier
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-xs text-gray-600">
                Vous pouvez{" "}
                <Link className="font-semibold text-gray-900 underline underline-offset-2" href="/checkout/expedition-livraison">
                  renseigner l’expédition et la livraison
                </Link>{" "}
                avant de payer (recommandé).
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <Link className="btn btn-ghost" href="/panier">
                Retour panier
              </Link>
              {!accessToken ? (
                <Link className="btn btn-dark" href="/connexion">
                  Se connecter
                </Link>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

