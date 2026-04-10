"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Reveal } from "@/app/site/components/Reveal";
import { StoreLogo } from "@/app/site/components/StoreLogo";
import { STORES, type Store } from "@/app/site/stores";
import { Card } from "@/app/site/components/UI";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesStore(store: Store, q: string) {
  if (!q) return true;
  const n = normalize(q);
  return (
    normalize(store.name).includes(n) ||
    normalize(store.subtitle).includes(n) ||
    normalize(store.heroLine).includes(n) ||
    normalize(store.id).includes(n)
  );
}

export function BoutiquesHubClient() {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => STORES.filter((s) => matchesStore(s, query.trim())), [query]);

  return (
    <>
      <Reveal delayMs={40}>
        <div className="mt-8 max-w-xl">
          <label className="grid gap-2">
            <span className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Rechercher une boutique</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Amazon, mode, AliExpress…"
              className="h-11 w-full rounded-xl bg-white/80 ring-1 ring-black/10 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[rgb(214_54_78/0.25)]"
            />
          </label>
          {query.trim() ? (
            <p className="mt-2 text-xs text-gray-500">
              {visible.length} boutique(s) —{" "}
              <button type="button" className="font-semibold text-gray-800 underline underline-offset-2" onClick={() => setQuery("")}>
                effacer
              </button>
            </p>
          ) : null}
        </div>
      </Reveal>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {visible.length === 0 ? (
          <Reveal>
            <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 p-6 text-sm text-gray-600 md:col-span-2">
              Aucune boutique ne correspond à « {query.trim()} ».
            </div>
          </Reveal>
        ) : (
          visible.map((s, idx) => (
            <Reveal key={s.id} delayMs={80 * idx}>
              <Link href={`/boutiques/${s.id}`} className="group block focus-ring">
                <Card className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <StoreLogo name={s.name} src={s.logoSrc} />
                        <p className="text-lg font-bold text-gray-900">{s.name}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{s.subtitle}</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 text-gray-900 transition-smooth group-hover:bg-black/10">
                      →
                    </span>
                  </div>
                  <div className="mt-4 h-px w-full bg-black/5" />
                  <p className="mt-4 text-sm text-gray-700">
                    Parcourir <span className="font-semibold">{s.name}</span>
                  </p>
                </Card>
              </Link>
            </Reveal>
          ))
        )}
      </div>

      <Reveal delayMs={160}>
        <div className="mt-12 rounded-3xl bg-gradient-to-br from-white/85 to-white/55 ring-1 ring-black/5 shadow-xl shadow-gray-200/40 p-8 md:p-10">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Vous avez déjà votre lien produit ?</h2>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">
            Collez l’URL dans la boutique concernée ou ajoutez l’article au panier depuis le catalogue démo. Les intégrations
            catalogue temps réel suivront.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href="/panier" className="btn btn-dark">
              Voir le panier
            </Link>
            <Link href="/services" className="btn btn-ghost">
              Comprendre le service
            </Link>
          </div>
        </div>
      </Reveal>
    </>
  );
}
