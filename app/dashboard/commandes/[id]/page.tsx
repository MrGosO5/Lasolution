import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { DashboardHeader } from "../../components/DashboardHeader";
import { mapApiOrderToDetailData } from "../order-detail-data";
import { CommandeDetailClient } from "./CommandeDetailClient";

export default async function CommandeDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const orderId = params?.id;
  if (!orderId) notFound();

  let raw: Record<string, unknown>;
  try {
    raw = await lasolutionFetchJson<Record<string, unknown>>(`/orders/${encodeURIComponent(orderId)}`);
  } catch {
    notFound();
  }

  const initialData = mapApiOrderToDetailData(raw);

  return (
    <>
      <DashboardHeader
        title={`Commande #${initialData.id.slice(0, 8)}`}
        session={session}
        rightSlot={
          <Link
            href="/dashboard/commandes"
            className="inline-flex items-center gap-2 rounded-lg border border-figma-tableBorder bg-white px-3 py-2 text-sm font-medium text-figma-headerTitle hover:bg-figma-tableHeader"
          >
            ← Liste des commandes
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 md:pl-[23px] md:pt-[26px]">
        <div className="flex flex-col gap-5 max-w-[1150px]">
          <CommandeDetailClient initialData={initialData} />
        </div>
      </div>
    </>
  );
}
