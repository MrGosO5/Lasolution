import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminStats } from "@/lib/admin-stats";
import { DashboardSidebar } from "./components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  const stats = session?.user?.role === "admin" ? await getAdminStats() : null;
  const pendingTestimonials = stats?.pendingTestimonials ?? 0;

  return (
    <main className="relative w-full max-w-[1440px] min-h-screen mx-auto font-sans bg-figma-page">
      <div className="flex flex-col md:flex-row md:h-screen md:max-h-screen">
        <DashboardSidebar pendingTestimonials={pendingTestimonials} />
        <div className="flex-1 flex flex-col md:overflow-hidden bg-figma-page min-w-0">
          {children}
        </div>
      </div>
    </main>
  );
}
