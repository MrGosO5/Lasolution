"use client";

import Image from "next/image";
import { NavArrowDown } from "iconoir-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { phoneDialOptions, type PhoneDialOption } from "@/lib/phone-dial-options";

function flagSrc(iso: string) {
  return `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;
}

function OptionRow({ o, selected, onPick }: { o: PhoneDialOption; selected: boolean; onPick: () => void }) {
  return (
    <li role="presentation">
      <button
        type="button"
        role="option"
        aria-selected={selected}
        className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-sm transition hover:bg-gray-50"
        onClick={onPick}
      >
        <span className="relative h-[15px] w-5 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/10">
          <Image
            src={flagSrc(o.iso)}
            alt=""
            width={20}
            height={15}
            className="h-full w-full object-cover"
            sizes="20px"
          />
        </span>
        <span className="tabular-nums text-black">{o.dial}</span>
        <span className="truncate text-[#444444]">{o.name}</span>
      </button>
    </li>
  );
}

export function PhoneDialSelect({
  name,
  ariaLabel,
  defaultDial = "+229",
}: {
  name: string;
  ariaLabel: string;
  defaultDial?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dial, setDial] = useState(defaultDial);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 280 });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const searchId = useId();

  const selected = phoneDialOptions.find((o) => o.dial === dial) ?? phoneDialOptions[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return phoneDialOptions;
    return phoneDialOptions.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.dial.includes(q) ||
        o.iso.toLowerCase().includes(q),
    );
  }, [query]);

  useLayoutEffect(() => {
    if (!open || !containerRef.current) return;

    const updatePosition = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 300),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const onDoc = (e: PointerEvent) => {
      const target = e.target as Node;
      const inTrigger = containerRef.current?.contains(target);
      const inMenu = menuRef.current?.contains(target);
      if (!inTrigger && !inMenu) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const menu =
    open && typeof document !== "undefined" ? (
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          top: menuPos.top,
          left: menuPos.left,
          minWidth: menuPos.width,
          zIndex: 9999,
        }}
        className="overflow-hidden rounded-lg border border-[#999999] bg-white shadow-lg"
      >
        <div className="border-b border-gray-100 p-2">
          <label htmlFor={searchId} className="sr-only">
            Rechercher un pays
          </label>
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un pays…"
            className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-sm text-gray-900 outline-none focus:border-[#C32353] focus:ring-1 focus:ring-[#C32353]/30"
            autoComplete="off"
          />
        </div>
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="max-h-60 overflow-auto py-1"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">Aucun pays trouvé.</li>
          ) : (
            filtered.map((o) => (
              <OptionRow
                key={`${o.iso}-${o.dial}`}
                o={o}
                selected={o.dial === dial}
                onPick={() => {
                  setDial(o.dial);
                  setOpen(false);
                }}
              />
            ))
          )}
        </ul>
      </div>
    ) : null;

  return (
    <div ref={containerRef} className="relative h-full min-w-[6.75rem] shrink-0">
      <input type="hidden" name={name} value={dial} readOnly />
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-full w-full items-center gap-2 border-0 bg-transparent py-2 pl-2 pr-8 text-left outline-none"
      >
        <span className="relative h-[15px] w-5 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/10">
          <Image
            src={flagSrc(selected.iso)}
            alt=""
            width={20}
            height={15}
            className="h-full w-full object-cover"
            sizes="20px"
          />
        </span>
        <span className="text-sm font-normal tabular-nums leading-5 text-black">{selected.dial}</span>
        <NavArrowDown
          className="pointer-events-none absolute right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black"
          strokeWidth={2}
          aria-hidden
        />
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
