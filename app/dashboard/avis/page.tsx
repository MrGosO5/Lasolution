import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { lasolutionFetchJson } from "@/lib/lasolution-api";
import { DashboardHeader } from "../components/DashboardHeader";
import { AvisClient, type AdminTestimonialRow } from "./AvisClient";

type TestimonialCounts = {
  all: number;
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
};

type ListResponse = {
  data: AdminTestimonialRow[];
  pagination: { page: number; pageSize: number; total: number };
  counts?: TestimonialCounts;
};

export default async function AvisPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  const page = Math.max(1, parseInt(String(searchParams.page || "1"), 10) || 1);
  const q = String(searchParams.q || "").trim();
  const status = String(searchParams.status || "").trim().toUpperCase();

  const qs = new URLSearchParams({ page: String(page), pageSize: "25" });
  if (q) qs.set("search", q);
  if (["PENDING", "APPROVED", "REJECTED"].includes(status)) qs.set("status", status);

  let rows: AdminTestimonialRow[] = [];
  let total = 0;
  let counts: TestimonialCounts = { all: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
  const pageSize = 25;

  async function fetchTabTotal(statusFilter?: string): Promise<number> {
    const tabQs = new URLSearchParams({ page: "1", pageSize: "1" });
    if (q) tabQs.set("search", q);
    if (statusFilter) tabQs.set("status", statusFilter);
    const tabRes = await lasolutionFetchJson<ListResponse>(`/admin/testimonials?${tabQs}`);
    return tabRes.pagination?.total ?? 0;
  }

  try {
    const res = await lasolutionFetchJson<ListResponse>(`/admin/testimonials?${qs}`);
    rows = res.data || [];
    total = res.pagination?.total ?? 0;

    const fromApi = res.counts;
    const apiLooksValid =
      fromApi &&
      (fromApi.all > 0 ||
        fromApi.PENDING > 0 ||
        fromApi.APPROVED > 0 ||
        fromApi.REJECTED > 0 ||
        total === 0);

    if (apiLooksValid) {
      counts = fromApi;
    } else {
      const [all, pending, approved, rejected] = await Promise.all([
        fetchTabTotal(),
        fetchTabTotal("PENDING"),
        fetchTabTotal("APPROVED"),
        fetchTabTotal("REJECTED"),
      ]);
      counts = { all, PENDING: pending, APPROVED: approved, REJECTED: rejected };
    }
  } catch {
    /* backend indisponible */
  }

  return (
    <>
      <DashboardHeader
        title="Avis clients"
        subtitle="Modérez les témoignages avant publication sur le site"
        session={session}
        rightSlot={
          <form method="GET" className="flex gap-2">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <label className="flex items-center gap-2 px-3 py-2 rounded-input border border-figma-tableBorder bg-white min-w-[220px] max-w-[300px] shadow-card focus-within:ring-2 focus-within:ring-figma-activeMenuText/20">
              <SearchIcon className="w-4 h-4 text-[#777]" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Rechercher un avis"
                className="flex-1 bg-transparent text-sm text-figma-headerTitle placeholder:text-figma-adminSub outline-none"
              />
            </label>
          </form>
        }
      />

      <div className="p-6">
        <AvisClient
          rows={rows}
          total={total}
          counts={counts}
          page={page}
          pageSize={pageSize}
          statusFilter={status}
          search={q}
        />
      </div>
    </>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
