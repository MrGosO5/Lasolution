import Link from "next/link";
import { Facebook, Instagram, Linkedin, Tiktok } from "iconoir-react";

type SocialLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const socialLinks: SocialLink[] = [
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@_lasolution_",
    icon: <Tiktok className="h-5 w-5" aria-hidden />,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/_la_solution",
    icon: <Instagram className="h-5 w-5" aria-hidden />,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/people/La-Solution/100068659887379/#",
    icon: <Facebook className="h-5 w-5" aria-hidden />,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/104746862",
    icon: <Linkedin className="h-5 w-5" aria-hidden />,
  },
  {
    label: "X",
    href: "https://x.com/La__solution",
    icon: <span className="text-[15px] font-black leading-none" aria-hidden>𝕏</span>,
  },
];

export function SocialLinksRow({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold tracking-wide text-gray-900 uppercase">Réseaux</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {socialLinks.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:border-gray-900 hover:bg-white"
          >
            {l.icon}
            <span>{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

