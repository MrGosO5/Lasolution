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
    <main className="relative w-full max-w-[1440px] min-h-[1024px] min-h-screen mx-auto font-sans bg-figma-page">
      <div className="flex h-screen max-h-screen min-h-[1024px]">
        <DashboardSidebar pendingTestimonials={pendingTestimonials} />
        <div className="flex-1 flex flex-col overflow-hidden bg-figma-page">
          {children}
        </div>
      </div>
    </main>
  );
}
