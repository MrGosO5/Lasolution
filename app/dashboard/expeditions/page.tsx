import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { DashboardHeader } from "../components/DashboardHeader";
import { ExpeditionsTableClient, type ShippingRequestRow } from "./ExpeditionsTableClient";

type ShippingRequestsListResponse = {
  events: ShippingRequestRow[];
};

export default async function ExpeditionsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  const limit = Math.max(1, Math.min(parseInt(String(searchParams.limit || "50"), 10) || 50, 200));

  if (role !== "admin") {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:pl-[23px] md:pt-[26px]">
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          Accès réservé aux administrateurs.
        </p>
      </div>
    );
  }

  let events: ShippingRequestRow[] = [];
  let loadError: string | null = null;

  try {
    const res = await lasolutionFetchJson<ShippingRequestsListResponse>(`/admin/shipping-requests?limit=${limit}`);
    events = Array.isArray(res.events) ? res.events : [];
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Impossible de charger les expéditions.";
  }

  return (
    <>
      <DashboardHeader title="Expéditions" subtitle="Demandes d'expédition clients" session={session} />

      <div className="flex-1 overflow-y-auto p-6 md:pl-[23px] md:pt-[26px]">
        <div className="flex flex-col gap-5 max-w-[1150px]">
          {loadError ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{loadError}</p>
          ) : null}

          <ExpeditionsTableClient initialRows={events} />
        </div>
      </div>
    </>
  );
}
