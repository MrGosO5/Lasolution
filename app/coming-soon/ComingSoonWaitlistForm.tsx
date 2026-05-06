"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { comingSoonCopy as C } from "./copy";
import { PhoneDialSelect } from "./PhoneDialSelect";
import { ComingSoonFormFrame74 } from "./ComingSoonFormFrame74";

type ComingSoonWaitlistFormProps = {
  /**
   * Sur la page Coming Soon, le formulaire est encapsulé dans le cadre rose (Frame 74).
   * Sur l’accueil on veut un style “site” sans ce cadre.
   */
  withFrame?: boolean;
  className?: string;
};

function apiErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const e = (data as { error: unknown }).error;
    if (typeof e === "string" && e.trim()) return e;
    if (e != null && typeof e !== "object") return String(e);
  }
  return fallback;
}

export function ComingSoonWaitlistForm({ withFrame = true, className }: ComingSoonWaitlistFormProps) {
  const [tab, setTab] = useState<"buyer" | "pro">("buyer");
  const [waitlistOk, setWaitlistOk] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  async function onWaitlistSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const profile = (fd.get("profile") as string) === "pro" ? "pro" : "buyer";
    const payload = {
      profile,
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phoneDial: String(fd.get("phoneDial") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      articleUrl: profile === "buyer" ? String(fd.get("articleUrl") ?? "").trim() : "",
    };

    setWaitlistLoading(true);
    setWaitlistError(null);
    try {
      const res = await fetch("/api/coming-soon-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setWaitlistError(apiErrorMessage(data, C.form.submitError));
        return;
      }
      setWaitlistOk(true);
    } catch {
      setWaitlistError(C.form.submitNetworkError);
    } finally {
      setWaitlistLoading(false);
    }
  }

  const FormShell = withFrame ? ComingSoonFormFrame74 : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <div className={className}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">{C.form.title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">{C.form.subtitle}</p>
      </div>

      <div className="mt-10">
        <FormShell>
          <div className={withFrame ? "w-full rounded-2xl bg-white p-5 shadow-sm" : ""}>
            <div className="flex flex-col gap-4">
              <div className="flex w-full gap-2 rounded-xl bg-[#F8F8F8] p-2">
                <motion.button
                  type="button"
                  onClick={() => setTab("buyer")}
                  className={`min-h-[38px] flex-1 rounded-lg px-3 py-2 text-base font-medium leading-[22px] transition-colors ${
                    tab === "buyer" ? "bg-[#333333] text-white" : "bg-transparent text-black"
                  }`}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                >
                  {C.form.tabBuyer}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setTab("pro")}
                  className={`min-h-[38px] flex-1 rounded-lg px-3 py-2 text-base font-medium leading-[22px] transition-colors ${
                    tab === "pro" ? "bg-[#333333] text-white" : "bg-transparent text-black"
                  }`}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                >
                  {C.form.tabPro}
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {waitlistOk ? (
                  <motion.p
                    key="waitlist-success"
                    role="status"
                    className="text-center text-sm font-medium text-emerald-700"
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  >
                    {C.form.success}
                  </motion.p>
                ) : (
                  <motion.div
                    key="waitlist-form"
                    className="flex flex-col gap-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={tab}
                        className="text-left text-[14px] font-normal leading-[19px] text-[#444444]"
                        initial={{ opacity: 0, x: tab === "buyer" ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: tab === "buyer" ? 8 : -8 }}
                        transition={{ duration: 0.22 }}
                      >
                        {tab === "buyer" ? C.form.instruction : C.form.instructionPro}
                      </motion.p>
                    </AnimatePresence>

                    <form onSubmit={onWaitlistSubmit} className="flex flex-col gap-5">
                      <div className="flex flex-col gap-3">
                        {tab === "buyer" ? (
                          <label className="flex flex-col gap-2 text-left">
                            <span className="text-base font-semibold leading-[22px] text-black">{C.form.urlLabel}</span>
                            <input
                              required
                              name="articleUrl"
                              type="url"
                              className="box-border h-[46px] w-full rounded-lg border border-[#999999] bg-white px-3 text-base text-gray-900 outline-none focus:ring-2 focus:ring-[#C32353]/25"
                              placeholder={C.form.urlPlaceholder}
                            />
                          </label>
                        ) : null}

                        <label className="flex flex-col gap-2 text-left">
                          <span className="text-base font-semibold leading-[22px] text-black">{C.form.nameLabel}</span>
                          <input
                            required
                            name="name"
                            className="box-border h-[46px] w-full rounded-lg border border-[#999999] bg-white px-3 text-base text-gray-900 outline-none focus:ring-2 focus:ring-[#C32353]/25"
                            placeholder={C.form.namePlaceholder}
                          />
                        </label>

                        <label className="flex flex-col gap-2 text-left">
                          <span className="text-base font-semibold leading-[22px] text-black">{C.form.emailLabel}</span>
                          <input
                            required
                            type="email"
                            name="email"
                            className="box-border h-[46px] w-full rounded-lg border border-[#999999] bg-white px-3 text-base text-gray-900 outline-none focus:ring-2 focus:ring-[#C32353]/25"
                            placeholder={C.form.emailPlaceholder}
                          />
                        </label>

                        <div className="flex flex-col gap-2 text-left">
                          <span className="text-base font-semibold leading-[22px] text-black" id="waitlist-phone-label">
                            {C.form.phoneLabel}
                          </span>
                          <div
                            className={`relative z-10 flex w-full overflow-visible rounded-lg border border-[#999999] bg-white focus-within:ring-2 focus-within:ring-[#C32353]/25 ${
                              tab === "pro" ? "h-[44px]" : "h-[46px]"
                            }`}
                          >
                            <div className="flex h-full shrink-0 items-stretch rounded-l-lg border-r border-[#999999]/70 bg-white">
                              <PhoneDialSelect name="phoneDial" ariaLabel={C.form.phoneDialAria} defaultDial="+229" />
                            </div>
                            <input
                              required
                              name="phone"
                              type="tel"
                              autoComplete="tel-national"
                              aria-labelledby="waitlist-phone-label"
                              className="min-w-0 flex-1 rounded-r-lg border-0 bg-transparent px-3 text-base text-gray-900 outline-none"
                              placeholder="01 02 03 04 05"
                            />
                          </div>
                        </div>
                      </div>

                      <input type="hidden" name="profile" value={tab} readOnly />

                      {waitlistError ? (
                        <p className="text-center text-sm font-medium text-red-600" role="alert">
                          {waitlistError}
                        </p>
                      ) : null}

                      <motion.button
                        type="submit"
                        disabled={waitlistLoading}
                        className="focus-ring h-[46px] w-full rounded-lg bg-[#C32353] text-center text-base font-semibold leading-[22px] text-white disabled:cursor-not-allowed disabled:opacity-60"
                        whileHover={waitlistLoading ? undefined : { scale: 1.01, filter: "brightness(1.05)" }}
                        whileTap={waitlistLoading ? undefined : { scale: 0.985 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      >
                        {waitlistLoading ? C.form.submitSending : C.form.submit}
                      </motion.button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </FormShell>
      </div>
    </div>
  );
}

