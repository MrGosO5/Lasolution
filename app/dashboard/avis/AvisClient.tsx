"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { testimonialPhotoUrl } from "@/lib/testimonial-media";

export type AdminTestimonialRow = {
  id: string;
  orderId: string;
  clientName: string;
  city: string;
  country: string;
  message: string;
  rating: number | null;
  photoUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectReason: string | null;
  createdAt: string;
  user?: { email: string | null; name: string | null };
  order?: { id: string; status: string };
};

const STATUS_TABS = [
  { id: "", label: "Tous", countKey: "all" as const },
  { id: "PENDING", label: "En attente", countKey: "PENDING" as const },
  { id: "APPROVED", label: "Validés", countKey: "APPROVED" as const },
  { id: "REJECTED", label: "Refusés", countKey: "REJECTED" as const },
] as const;

export type TestimonialTabCounts = {
  all: number;
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
};

function statusBadge(status: AdminTestimonialRow["status"]) {
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-800";
  if (status === "REJECTED") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

function statusText(status: AdminTestimonialRow["status"]) {
  if (status === "APPROVED") return "Validé";
  if (status === "REJECTED") return "Refusé";
  return "En attente";
}

export function AvisClient({
  rows,
  total,
  counts,
  page,
  pageSize,
  statusFilter,
  search,
}: {
  rows: AdminTestimonialRow[];
  total: number;
  counts: TestimonialTabCounts;
  page: number;
  pageSize: number;
  statusFilter: string;
  search: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<AdminTestimonialRow | null>(null);
  const [rejectReason, setRejectReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function patchStatus(id: string, status: "APPROVED" | "REJECTED", reason?: string) {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = { status };
      if (status === "REJECTED") body.rejectReason = reason || "";
      const res = await fetch(`/api/admin/testimonials/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      setSelected(null);
      setRejectReason("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex flex-row rounded-lg overflow-hidden border border-figma-tableBorder bg-figma-tableHeader">
            {STATUS_TABS.map((tab) => (
              <Link
                key={tab.id || "all"}
                href={`/dashboard/avis?${new URLSearchParams({
                  ...(tab.id ? { status: tab.id } : {}),
                  ...(search ? { q: search } : {}),
                }).toString()}`}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  (statusFilter || "") === tab.id
                    ? "bg-figma-activeMenu text-figma-activeMenuText"
                    : "text-figma-headerTitle hover:bg-figma-tableRowHover"
                }`}
              >
                {tab.label} ({counts[tab.countKey]})
              </Link>
            ))}
          </div>
          <p className="text-sm text-figma-adminSub">{total} avis</p>
        </div>

        <div className="border border-figma-tableBorder rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-figma-tableHeader border-b border-figma-tableBorder">
                <Th>Client</Th>
                <Th>Lieu</Th>
                <Th>Note</Th>
                <Th>Commande</Th>
                <Th>Date</Th>
                <Th>Statut</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 px-3 text-center text-sm text-figma-adminSub">
                    Aucun avis pour ce filtre.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-figma-tableRowBorder last:border-0 bg-white hover:bg-figma-tableRowHover"
                  >
                    <Td>
                      <span className="font-medium text-figma-headerTitle">{row.clientName}</span>
                      {row.user?.email ? (
                        <span className="block text-xs text-figma-adminSub">{row.user.email}</span>
                      ) : null}
                    </Td>
                    <Td>
                      {row.city}, {row.country}
                    </Td>
                    <Td>{row.rating != null ? `${row.rating}/5` : "—"}</Td>
                    <Td>
                      <Link
                        href={`/dashboard/commandes/${row.orderId}`}
                        className="text-figma-activeMenuText hover:underline text-xs font-mono"
                      >
                        #{row.orderId.slice(0, 8)}
                      </Link>
                    </Td>
                    <Td>{new Date(row.createdAt).toLocaleDateString("fr-FR")}</Td>
                    <Td>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(row.status)}`}
                      >
                        {statusText(row.status)}
                      </span>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        className="text-sm font-medium text-figma-activeMenuText hover:underline"
                        onClick={() => {
                          setSelected(row);
                          setRejectReason("");
                          setError(null);
                        }}
                      >
                        Consulter
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2 pt-2">
            {page > 1 ? (
              <Link
                href={`/dashboard/avis?${new URLSearchParams({
                  page: String(page - 1),
                  ...(statusFilter ? { status: statusFilter } : {}),
                  ...(search ? { q: search } : {}),
                }).toString()}`}
                className="text-sm text-figma-activeMenuText hover:underline"
              >
                ← Précédent
              </Link>
            ) : null}
            <span className="text-sm text-figma-adminSub">
              Page {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/dashboard/avis?${new URLSearchParams({
                  page: String(page + 1),
                  ...(statusFilter ? { status: statusFilter } : {}),
                  ...(search ? { q: search } : {}),
                }).toString()}`}
                className="text-sm text-figma-activeMenuText hover:underline"
              >
                Suivant →
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl border border-figma-tableBorder p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-figma-headerTitle">Détail de l’avis</h3>
              <button
                type="button"
                className="text-figma-adminSub hover:text-figma-headerTitle"
                onClick={() => setSelected(null)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {error ? <p className="mt-3 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</p> : null}

            <div className="mt-4 flex gap-4">
              {selected.photoUrl ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-figma-tableBorder">
                  <Image
                    src={testimonialPhotoUrl(selected.photoUrl) || ""}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                </div>
              ) : null}
              <div className="text-sm text-figma-headerTitle min-w-0">
                <p className="font-semibold">{selected.clientName}</p>
                <p className="text-figma-adminSub">
                  {selected.city}, {selected.country}
                  {selected.rating != null ? ` · ${selected.rating}/5` : ""}
                </p>
                <p className="mt-2 text-figma-adminSub leading-relaxed">“{selected.message}”</p>
              </div>
            </div>

            {selected.status === "REJECTED" && selected.rejectReason ? (
              <p className="mt-3 text-sm text-red-800 bg-red-50 rounded-lg px-3 py-2">
                Motif du refus : {selected.rejectReason}
              </p>
            ) : null}

            {selected.status === "PENDING" ? (
              <div className="mt-4">
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-figma-headerTitle">Motif de refus (obligatoire si refus)</span>
                  <textarea
                    className="min-h-[80px] rounded-lg border border-figma-tableBorder px-3 py-2"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Expliquez brièvement pour le client…"
                  />
                </label>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {selected.status !== "APPROVED" ? (
                <button
                  type="button"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                  onClick={() => void patchStatus(selected.id, "APPROVED")}
                >
                  Valider
                </button>
              ) : null}
              {selected.status !== "REJECTED" ? (
                <button
                  type="button"
                  disabled={loading || !rejectReason.trim()}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  onClick={() => void patchStatus(selected.id, "REJECTED", rejectReason.trim())}
                >
                  Refuser
                </button>
              ) : null}
              <Link
                href={`/dashboard/commandes/${selected.orderId}`}
                className="px-4 py-2 rounded-lg border border-figma-tableBorder text-sm font-medium text-figma-headerTitle hover:bg-figma-tableRowHover"
              >
                Voir la commande
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left text-xs font-semibold text-figma-adminSub uppercase tracking-wide py-3 px-3">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-3 px-3 text-sm text-figma-headerTitle align-top">{children}</td>;
}
