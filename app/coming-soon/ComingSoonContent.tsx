"use client";

import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/app/components/Logo";
import { CheckCircle } from "iconoir-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import { comingSoonCopy as C } from "./copy";
import { ComingSoonHeroFrame84 } from "./ComingSoonHeroFrame84";
import { ComingSoonWaitlistForm } from "./ComingSoonWaitlistForm";
import {
  easeOut,
  HeroEnter,
  listStaggerChild,
  listStaggerParent,
  Reveal,
  StaggerGroup,
  StaggerItem,
} from "./Reveal";

const socialTap = { scale: 0.96 };
const socialHover = { scale: 1.06, y: -2 };

function apiErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const e = (data as { error: unknown }).error;
    if (typeof e === "string" && e.trim()) return e;
    if (e != null && typeof e !== "object") return String(e);
  }
  return fallback;
}

function SocialLinks({ className }: { className?: string }) {
  const ring =
    "flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-gray-700 shadow-sm transition-colors hover:border-rose-300 hover:text-[color:var(--coming-soon-accent)]";
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <motion.a
        href="#"
        aria-label="Facebook"
        className={ring}
        whileHover={socialHover}
        whileTap={socialTap}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
      >
        <span className="text-xs font-bold">f</span>
      </motion.a>
      <motion.a
        href="#"
        aria-label="Instagram"
        className={ring}
        whileHover={socialHover}
        whileTap={socialTap}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
      >
        <span className="text-xs font-bold">◎</span>
      </motion.a>
      <motion.a
        href="#"
        aria-label="LinkedIn"
        className={ring}
        whileHover={socialHover}
        whileTap={socialTap}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
      >
        <span className="text-xs font-bold">in</span>
      </motion.a>
      <motion.a
        href="#"
        aria-label="X"
        className={ring}
        whileHover={socialHover}
        whileTap={socialTap}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
      >
        <span className="text-xs font-bold">𝕏</span>
      </motion.a>
    </div>
  );
}

function ReasonsList({ bullets }: { bullets: readonly string[] }) {
  const reduce = useReducedMotion();
  const itemClass = "flex gap-3 text-left text-gray-700";
  if (reduce) {
    return (
      <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
        {bullets.map((r) => (
          <li key={r} className={itemClass}>
            <CheckCircle
              className="mt-0.5 h-6 w-6 shrink-0 text-[color:var(--coming-soon-accent)]"
              strokeWidth={1.5}
            />
            <span className="text-sm font-medium leading-snug md:text-base">{r}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <motion.ul
      className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-32px 0px", amount: 0.12 }}
      variants={listStaggerParent}
    >
      {bullets.map((r) => (
        <motion.li key={r} variants={listStaggerChild} className={itemClass}>
          <CheckCircle
            className="mt-0.5 h-6 w-6 shrink-0 text-[color:var(--coming-soon-accent)]"
            strokeWidth={1.5}
          />
          <span className="text-sm font-medium leading-snug md:text-base">{r}</span>
        </motion.li>
      ))}
    </motion.ul>
  );
}

export function ComingSoonContent() {
  const formRef = useRef<HTMLElement | null>(null);
  const [newsOk, setNewsOk] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onNewsletterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("newsletter") ?? "").trim();

    setNewsLoading(true);
    setNewsError(null);
    try {
      const res = await fetch("/api/coming-soon-newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setNewsError(apiErrorMessage(data, C.footer.newsletterError));
        return;
      }
      setNewsOk(true);
    } catch {
      setNewsError(C.footer.newsletterNetworkError);
    } finally {
      setNewsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <motion.header
        className="bg-white/95 backdrop-blur-sm"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: easeOut }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="focus-ring rounded-xl">
            <span className="sr-only">La Solution — accueil</span>
            <Logo />
          </Link>
          <SocialLinks />
        </div>
      </motion.header>

      <main>
        <section className="relative overflow-hidden bg-white pb-16 pt-12 text-center font-sans md:min-h-[600px] md:pt-[108px]">
          {/* Figma Frame 84 : tuiles LOGO-SOLUTION (Group 3 + Group 4 miroir) */}
          <ComingSoonHeroFrame84 />
          <div className="relative z-10 mx-auto max-w-6xl px-6">
          <HeroEnter className="mx-auto flex max-w-[1032px] flex-col items-center gap-[22px]">
            <StaggerItem className="flex w-full flex-col items-center gap-3 self-stretch">
              <p className="w-full text-center text-[24px] font-bold leading-[140%] text-[color:var(--coming-soon-hero-kicker)]">
                {C.hero.kicker}
              </p>
              <h1 className="w-full text-balance text-center text-[clamp(1.75rem,4.5vw,3.25rem)] font-bold leading-snug text-[color:var(--coming-soon-hero-magenta)] lg:text-[52px] lg:leading-[68px]">
                {C.hero.title}
              </h1>
            </StaggerItem>
            <StaggerItem className="flex w-full max-w-[580px] flex-col items-center gap-6 self-center">
              <p className="w-full text-center text-base font-medium leading-[140%] text-[color:var(--coming-soon-hero-subtitle)]">
                {C.hero.subtitle}
              </p>
              <motion.button
                type="button"
                onClick={scrollToForm}
                className="focus-ring inline-flex h-[38px] min-w-[194px] items-center justify-center rounded-[20px] bg-[color:var(--coming-soon-hero-cta-bg)] px-4 py-2 text-base font-medium leading-[140%] text-white transition-colors hover:bg-[#404040]"
                whileHover={{ scale: 1.03, boxShadow: "0 12px 28px rgba(0,0,0,0.18)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
              >
                {C.hero.cta}
              </motion.button>
            </StaggerItem>
          </HeroEnter>

          <StaggerGroup className="mt-14 flex flex-wrap items-center justify-center gap-3 md:gap-4" stagger={0.06}>
            {C.hero.retailerIcons.map((icon) => (
              <StaggerItem key={icon.src}>
                <motion.div
                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full shadow-md shadow-black/12 ring-2 ring-[#F9A8D4]/90 md:h-16 md:w-16 md:ring-[3px]"
                  whileHover={{ scale: 1.08, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 380, damping: 20 }}
                >
                  <Image
                    src={icon.src}
                    alt={icon.alt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 56px, 64px"
                  />
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerGroup>
          </div>
        </section>

        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">{C.offers.sectionTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-3 max-w-2xl text-center" delay={0.08}>
              <p className="text-gray-600">{C.offers.sectionLead}</p>
            </Reveal>
            <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2" stagger={0.1}>
              {C.offers.cards.map((o, i) => {
                const img = C.offers.cardImages[i];
                return (
                  <StaggerItem key={o.title}>
                    <motion.article
                      className="overflow-hidden rounded-2xl border-2 border-[#D12E5E]/25 bg-white shadow-sm"
                      whileHover={{
                        y: -8,
                        boxShadow: "0 20px 40px rgba(209, 46, 94, 0.12)",
                        borderColor: "rgba(209, 46, 94, 0.45)",
                      }}
                      transition={{ duration: 0.28, ease: easeOut }}
                    >
                      <motion.div
                        className="relative aspect-[4/3] w-full bg-gray-100"
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.45, ease: easeOut }}
                      >
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          className="object-cover object-center"
                          sizes="(max-width: 640px) 100vw, (max-width: 1152px) 50vw, 560px"
                          priority={i < 2}
                        />
                      </motion.div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900">{o.title}</h3>
                        {o.body ? (
                          <p className="mt-2 text-sm leading-relaxed text-gray-600">{o.body}</p>
                        ) : null}
                      </div>
                    </motion.article>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </div>
        </section>

        <section className="bg-gray-50 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal>
              <motion.div
                className="rounded-3xl border border-black/[0.06] bg-white p-8 shadow-sm md:p-12"
                whileHover={{ boxShadow: "0 12px 40px rgba(0,0,0,0.06)" }}
                transition={{ duration: 0.35, ease: easeOut }}
              >
                <h2 className="text-center text-2xl font-bold text-gray-900 md:text-3xl">
                  {C.reasons.sectionTitle}
                </h2>
                <ReasonsList bullets={C.reasons.bullets} />
              </motion.div>
            </Reveal>
          </div>
        </section>

        <section ref={formRef} id="waitlist" className="relative bg-[#FAFAFA] py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal delay={0.12} y={32}>
              <ComingSoonWaitlistForm withFrame />
            </Reveal>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">{C.testimonials.sectionTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-3 max-w-xl text-center" delay={0.07}>
              <p className="text-gray-600">{C.testimonials.sectionLead}</p>
            </Reveal>
            <StaggerGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
              {C.testimonials.items.map((t) => (
                <StaggerItem key={t.name}>
                  <motion.figure
                    className="h-full rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm"
                    whileHover={{ y: -5, boxShadow: "0 16px 36px rgba(0,0,0,0.08)" }}
                    transition={{ duration: 0.3, ease: easeOut }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--coming-soon-accent)] text-sm font-bold text-white"
                        whileHover={{ scale: 1.08, rotate: [0, -4, 4, 0] }}
                        transition={{ duration: 0.45 }}
                      >
                        {t.name.charAt(0)}
                      </motion.div>
                      <div>
                        <figcaption className="text-sm font-semibold text-gray-900">{t.name}</figcaption>
                        <p className="text-xs text-gray-500">{t.location}</p>
                      </div>
                    </div>
                    <blockquote className="mt-3 text-xs leading-relaxed text-gray-600 md:text-sm">
                      « {t.quote} »
                    </blockquote>
                  </motion.figure>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      </main>

      <motion.footer
        className="bg-gray-50 py-14"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.55, ease: easeOut }}
      >
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm font-medium text-gray-800">{C.footer.newsletterTitle}</p>
          <AnimatePresence mode="wait">
            {newsOk ? (
              <motion.p
                key="news-ok"
                role="status"
                className="mt-4 text-sm font-medium text-emerald-700"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
              >
                {C.footer.newsletterSuccess}
              </motion.p>
            ) : (
              <motion.form
                key="news-form"
                onSubmit={onNewsletterSubmit}
                className="mx-auto mt-5 flex max-w-md flex-col gap-3"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    required
                    type="email"
                    name="newsletter"
                    placeholder={C.footer.emailPlaceholder}
                    disabled={newsLoading}
                    className="h-12 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none ring-[#D12E5E]/20 transition-shadow focus:ring-2 disabled:opacity-60"
                  />
                  <motion.button
                    type="submit"
                    disabled={newsLoading}
                    className="coming-soon-btn-primary focus-ring h-12 shrink-0 rounded-xl px-6 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    whileHover={newsLoading ? undefined : { scale: 1.03 }}
                    whileTap={newsLoading ? undefined : { scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  >
                    {newsLoading ? C.form.submitSending : C.footer.subscribe}
                  </motion.button>
                </div>
                {newsError ? (
                  <p className="text-center text-sm font-medium text-red-600" role="alert">
                    {newsError}
                  </p>
                ) : null}
              </motion.form>
            )}
          </AnimatePresence>
          <div className="mt-10 flex justify-center">
            <SocialLinks />
          </div>
          <p className="mt-8 text-xs text-gray-500">{C.footer.legal}</p>
          <p className="mt-4">
            <Link href="/" className="text-sm font-medium text-[color:var(--coming-soon-accent)] hover:underline">
              {C.footer.backToSite}
            </Link>
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
