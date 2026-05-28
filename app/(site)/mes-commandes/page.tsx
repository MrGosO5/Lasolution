import Link from "next/link";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { MesCommandesOrdersTable, type MesCommandeRow } from "./MesCommandesOrdersTable";

export default async function MesCommandesPage() {
  let rows: MesCommandeRow[] = [];
  let loadError: string | null = null;
  try {
    const res = await lasolutionFetchJson<{ data: MesCommandeRow[] }>("/orders?page=1&pageSize=50");
    rows = res.data ?? [];
  } catch (e) {
    rows = [];
    loadError = e instanceof Error ? e.message : "Impossible de charger vos commandes.";
  }

  const total = rows.length;
  const inProgress = rows.filter((r) => !["DELIVERED", "CANCELLED"].includes(String(r.status))).length;

  return (
    <main className="site-container site-section">
      <Reveal>
        <PageHeader
          eyebrow="Client"
          title="Mes commandes"
          subtitle="Recherchez et suivez vos commandes. Les statuts et étapes apparaissent sur la page de détails."
          right={
            <Link href="/mes-avis" className="btn btn-ghost">
              Mes avis
            </Link>
          }
        />
      </Reveal>

      <div className="mt-10 grid gap-4">
        <Reveal>
          <div className="card p-6 md:p-7">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-semibold text-gray-900">Commandes totales</p>
                <p className="text-3xl font-extrabold text-gray-900">{total}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-sm font-semibold text-gray-900">Commandes en cours</p>
                <p className="text-3xl font-extrabold text-gray-900">{inProgress}</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          {loadError ? (
            <div className="card p-6 md:p-7 ring-1 ring-amber-200 bg-amber-50/80">
              <p className="text-sm font-semibold text-amber-950">Chargement impossible</p>
              <p className="mt-2 text-sm text-amber-900 leading-relaxed">{loadError}</p>
              <p className="mt-2 text-sm text-amber-900">
                Déconnectez-vous puis reconnectez-vous si le message mentionne un jeton expiré ou absent.
              </p>
            </div>
          ) : null}
          {!loadError && rows.length === 0 ? (
            <div className="card p-6 md:p-7">
              <p className="text-sm font-semibold text-gray-900">Aucune commande pour le moment</p>
              <p className="mt-1 text-sm text-gray-600">
                Ajoutez un produit au panier, puis finalisez le checkout pour créer votre première commande.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Link href="/boutiques" className="btn btn-primary">
                  Aller aux boutiques
                </Link>
                <Link href="/panier" className="btn btn-ghost">
                  Voir le panier
                </Link>
              </div>
            </div>
          ) : !loadError ? (
            <MesCommandesOrdersTable orders={rows} />
          ) : null}
        </Reveal>
      </div>
    </main>
  );
}
