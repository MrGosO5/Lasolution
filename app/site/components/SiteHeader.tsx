import Link from "next/link";
import { Logo } from "@/app/components/Logo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const isAuthed = Boolean(session?.user?.id);
  const role = session?.user?.role;

  const isClient = role === "client";
  const isAdmin = role === "admin";

  const accountHref = isAdmin ? "/dashboard" : "/mon-espace";
  const accountLabel = isAdmin ? "Dashboard" : "Mon espace";

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/60 backdrop-blur-md">
      <div className="site-container flex items-center justify-between py-4">
        <Link href="/" className="focus-ring rounded-xl">
          <span className="sr-only">La Solution</span>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Navigation principale">
          <Link className="text-gray-700 hover:text-gray-900" href="/">
            Accueil
          </Link>
          <Link className="text-gray-700 hover:text-gray-900" href="/services">
            Services
          </Link>
          <Link className="text-gray-700 hover:text-gray-900" href="/boutiques">
            Boutiques
          </Link>
          <Link className="text-gray-700 hover:text-gray-900" href="/faq">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {isAuthed ? (
            <>
              <Link href={accountHref} className="hidden btn btn-ghost md:inline-flex">
                {accountLabel}
              </Link>
              {isClient ? (
                <Link href="/mes-commandes" className="hidden btn btn-ghost md:inline-flex">
                  Mes commandes
                </Link>
              ) : null}
              <Link href="/api/auth/signout?callbackUrl=/" className="btn btn-primary">
                Se déconnecter
              </Link>
            </>
          ) : (
            <>
              <Link href="/connexion" className="hidden btn btn-ghost md:inline-flex">
                Se connecter
              </Link>
              <Link href="/inscription" className="btn btn-primary">
                S’inscrire
              </Link>
            </>
          )}

          <details className="relative md:hidden">
            <summary className="list-none cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-black/5 focus-ring">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md ring-1 ring-black/10 shadow-xl">
              <nav className="grid p-2 text-sm" aria-label="Menu mobile">
                {[
                  ["/", "Accueil"],
                  ["/services", "Services"],
                  ["/boutiques", "Boutiques"],
                  ["/faq", "FAQ"],
                  ...(isAuthed ? [[accountHref, accountLabel]] : []),
                  ...(isAuthed && isClient ? [["/mes-commandes", "Mes commandes"]] : []),
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-xl px-3 py-2 font-semibold text-gray-900 hover:bg-black/5"
                  >
                    {label}
                  </Link>
                ))}
                <div className="my-1 h-px bg-black/5" />
                {isAuthed ? (
                  <>
                    <Link href={accountHref} className="rounded-xl px-3 py-2 font-semibold text-gray-900 hover:bg-black/5">
                      {accountLabel}
                    </Link>
                    {isClient ? (
                      <Link href="/mes-commandes" className="rounded-xl px-3 py-2 font-semibold text-gray-900 hover:bg-black/5">
                        Mes commandes
                      </Link>
                    ) : null}
                    <Link
                      href="/api/auth/signout?callbackUrl=/"
                      className="rounded-xl px-3 py-2 font-semibold text-gray-900 hover:bg-black/5"
                    >
                      Se déconnecter
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/connexion" className="rounded-xl px-3 py-2 font-semibold text-gray-900 hover:bg-black/5">
                      Se connecter
                    </Link>
                    <Link href="/inscription" className="rounded-xl px-3 py-2 font-semibold text-gray-900 hover:bg-black/5">
                      S’inscrire
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

