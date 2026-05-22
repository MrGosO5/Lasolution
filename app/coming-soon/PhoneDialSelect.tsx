"use client";

import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { NavArrowDown } from "iconoir-react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { phoneDialOptions, type PhoneDialOption } from "@/lib/phone-dial-options";

type MenuPosition = { top: number; left: number; width: number; maxHeight: number };

function flagSrc(iso: string) {
  return `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;
}

function OptionRow({ o, selected, onPick }: { o: PhoneDialOption; selected: boolean; onPick: () => void }) {
  const pick = (e: ReactMouseEvent | ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPick();
  };

  return (
    <li role="presentation">
      <button
        type="button"
        role="option"
        aria-selected={selected}
        className="flex min-h-[44px] w-full touch-manipulation items-center gap-2.5 px-3 py-2.5 text-left text-sm transition active:bg-gray-100"
        onPointerUp={pick}
        onClick={pick}
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

/** Bloque le scroll sans déplacer la page (évite le saut au scrollTo). */
function lockBodyScroll() {
  const html = document.documentElement;
  const prev = { body: document.body.style.overflow, html: html.style.overflow };
  document.body.style.overflow = "hidden";
  html.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = prev.body;
    html.style.overflow = prev.html;
  };
}

function computeMenuPosition(trigger: HTMLElement): MenuPosition {
  const rect = trigger.getBoundingClientRect();
  const menuWidth = Math.min(Math.max(rect.width, 300), window.innerWidth - 16);
  const left = Math.min(Math.max(8, rect.left), window.innerWidth - menuWidth - 8);
  const reserved = 220;
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const spaceAbove = rect.top - 8;
  const openUp = spaceBelow < reserved && spaceAbove > spaceBelow;
  const maxHeight = Math.min(320, openUp ? spaceAbove - 8 : spaceBelow - 8);

  return {
    top: openUp ? Math.max(8, rect.top - maxHeight - 4) : rect.bottom + 4,
    left,
    width: menuWidth,
    maxHeight: Math.max(160, maxHeight),
  };
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
  const [menuPos, setMenuPos] = useState<MenuPosition>({ top: 0, left: 0, width: 300, maxHeight: 320 });
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const frozenMenuPos = useRef<MenuPosition | null>(null);
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
    const pos = computeMenuPosition(containerRef.current);
    frozenMenuPos.current = pos;
    setMenuPos(pos);
  }, [open]);

  useEffect(() => {
    if (!open) {
      frozenMenuPos.current = null;
      return;
    }

    const unlockScroll = lockBodyScroll();
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (!coarsePointer) {
      searchRef.current?.focus({ preventScroll: true });
    }

    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = containerRef.current?.contains(target);
      const inMenu = menuRef.current?.contains(target);
      if (!inTrigger && !inMenu) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      unlockScroll();
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const activePos = frozenMenuPos.current ?? menuPos;

  const handlePick = (nextDial: string) => {
    setOpen(false);
    window.setTimeout(() => setDial(nextDial), 0);
  };

  const menu =
    open && typeof document !== "undefined" ? (
      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        style={{
          position: "fixed",
          top: activePos.top,
          left: activePos.left,
          width: activePos.width,
          maxHeight: activePos.maxHeight,
          zIndex: 9999,
        }}
        className="flex flex-col overflow-hidden rounded-lg border border-[#999999] bg-white shadow-lg overscroll-contain"
      >
        <div className="shrink-0 border-b border-gray-100 p-2">
          <label htmlFor={searchId} className="sr-only">
            Rechercher un pays
          </label>
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un pays…"
            className="w-full rounded-md border border-gray-200 px-2.5 py-2.5 text-base text-gray-900 outline-none focus:border-[#C32353] focus:ring-1 focus:ring-[#C32353]/30"
            autoComplete="off"
          />
        </div>
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 [-webkit-overflow-scrolling:touch]"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm text-gray-500">Aucun pays trouvé.</li>
          ) : (
            filtered.map((o) => (
              <OptionRow
                key={`${o.iso}-${o.dial}`}
                o={o}
                selected={o.dial === dial}
                onPick={() => handlePick(o.dial)}
              />
            ))
          )}
        </ul>
      </div>
    ) : null;

  return (
    <div ref={containerRef} className="relative h-full w-[7.25rem] shrink-0">
      <input type="hidden" name={name} value={dial} readOnly />
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-full min-h-[44px] w-full touch-manipulation items-center gap-2 border-0 bg-transparent py-2 pl-2 pr-8 text-left outline-none"
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
        <span className="inline-block min-w-[3.25rem] text-sm font-normal tabular-nums leading-5 text-black">
          {selected.dial}
        </span>
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
