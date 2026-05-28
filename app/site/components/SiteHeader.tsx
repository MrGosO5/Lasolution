import Link from "next/link";
import { Logo } from "@/app/components/Logo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeaderNav } from "@/app/site/components/SiteHeaderNav";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const isAuthed = Boolean(session?.user?.id);
  const role = session?.user?.role;
  const isClient = role === "client";

  const accountHref = role === "admin" ? "/dashboard" : "/mon-espace";
  const accountLabel = role === "admin" ? "Tableau de bord" : "Mon espace";

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/60 backdrop-blur-md">
      <div className="site-container flex items-center justify-between py-4">
        <Link href="/" className="focus-ring shrink-0 rounded-xl">
          <span className="sr-only">La Solution</span>
          <Logo />
        </Link>

        <SiteHeaderNav
          isAuthed={isAuthed}
          isClient={isClient}
          accountHref={accountHref}
          accountLabel={accountLabel}
        />
      </div>
    </header>
  );
}
