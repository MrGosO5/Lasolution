import Link from "next/link";
import { Logo } from "@/app/components/Logo";
import { Facebook, Instagram, Linkedin, Tiktok } from "iconoir-react";

type SocialLink = {
  label: string;
  href: string;
};

type ComingSoonVeigaProps = {
  title?: string;
  subtitle?: string;
  socialLinks?: SocialLink[];
};

const defaultSocialLinks: SocialLink[] = [
  { label: "Facebook", href: "https://www.facebook.com/people/La-Solution/100068659887379/#" },
  { label: "Instagram", href: "https://www.instagram.com/_la_solution" },
  { label: "TikTok", href: "https://www.tiktok.com/@_lasolution_" },
  { label: "X", href: "https://x.com/La__solution" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/104746862" },
];

function SocialIcon({ label }: { label: string }) {
  const normalized = label.trim().toLowerCase();
  if (normalized === "instagram") return <Instagram className="h-4 w-4" aria-hidden />;
  if (normalized === "facebook") return <Facebook className="h-4 w-4" aria-hidden />;
  if (normalized === "tiktok") return <Tiktok className="h-4 w-4" aria-hidden />;
  if (normalized === "linkedin") return <Linkedin className="h-4 w-4" aria-hidden />;
  return null;
}

export function ComingSoonVeiga({
  title = "La Solution",
  subtitle = "Achetez dans le monde, livrez en Afrique, chez vous.",
  socialLinks = defaultSocialLinks,
}: ComingSoonVeigaProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-7">
        <Logo />
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">{title}</h1>
        <p className="text-sm text-gray-600 md:text-base">{subtitle}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {socialLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900"
            >
              <SocialIcon label={link.label} />
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export function ComingSoonVeigaSection({
  title = "La Solution",
  subtitle = "Achetez dans le monde, livrez en Afrique, chez vous.",
  socialLinks = defaultSocialLinks,
}: ComingSoonVeigaProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-10 md:pt-14">
      <div className="rounded-3xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm md:px-10 md:py-12">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
          <Logo />
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">{title}</h2>
          <p className="text-sm text-gray-600 md:text-base">{subtitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {socialLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-900 hover:text-gray-900"
              >
                <SocialIcon label={link.label} />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
