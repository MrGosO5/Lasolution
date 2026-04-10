import Link from "next/link";
import { Logo } from "@/app/components/Logo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function SiteFooter() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const isAuthed = Boolean(session?.user?.id);
  const isClient = role === "client";
  const isAdmin = role === "admin";
  const accountHref = isAdmin ? "/dashboard" : isAuthed ? "/mon-espace" : "/connexion";
  const accountLabel = isAdmin ? "Dashboard" : isAuthed ? "Mon espace" : "Se connecter";

  return (
    <footer className="mt-16 border-t border-black/5 bg-white/60 backdrop-blur-sm">
      <div className="site-container py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
              Votre passerelle logistique vous offre l’opportunité de faire des achats et
              expéditions sans gêne.
            </p>
            <p className="text-xs text-gray-500">© 2025 La Solution – Tous droits réservés.</p>
          </div>

          <nav aria-label="Plan du site" className="grid gap-2 text-sm">
            <p className="text-xs font-semibold tracking-wide text-gray-900 uppercase">Navigation</p>
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

          <nav aria-label="Liens utiles" className="grid gap-2 text-sm">
            <p className="text-xs font-semibold tracking-wide text-gray-900 uppercase">Liens</p>
            <Link className="text-gray-700 hover:text-gray-900" href={accountHref}>
              {accountLabel}
            </Link>
            {isAuthed && isClient ? (
              <Link className="text-gray-700 hover:text-gray-900" href="/mes-commandes">
                Mes commandes
              </Link>
            ) : null}
            <Link className="text-gray-700 hover:text-gray-900" href="/politique-de-confidentialite">
              Politique de confidentialité
            </Link>
            {isAuthed && isClient ? (
              <Link className="text-gray-700 hover:text-gray-900" href="/carte">
                Carte de paiement
              </Link>
            ) : null}
            <Link className="text-gray-700 hover:text-gray-900" href="/support">
              Support client
            </Link>
            <Link className="text-gray-700 hover:text-gray-900" href="/prise-de-contact">
              Prise de contact
            </Link>
            <Link className="text-gray-700 hover:text-gray-900" href="/devenir-point-relai">
              Devenir Partenaire Point Relai
            </Link>
            <Link className="text-gray-700 hover:text-gray-900" href="/devenir-solupacker">
              Devenir SoluPacker
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

