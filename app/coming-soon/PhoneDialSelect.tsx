"use client";

import Image from "next/image";
import { NavArrowDown } from "iconoir-react";
import { useEffect, useId, useRef, useState } from "react";
import { comingSoonPhoneDialOptions } from "./copy";

function flagSrc(iso: string) {
  return `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;
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
  const options = comingSoonPhoneDialOptions;
  const [open, setOpen] = useState(false);
  const [dial, setDial] = useState(defaultDial);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.dial === dial) ?? options[0];

  useEffect(() => {
    if (!open) return;
    // pointerdown en phase capture : évite qu’un blur / autre handler ferme avant le clic sur une option
    const onDoc = (e: PointerEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div ref={containerRef} className="relative h-full min-w-[6.75rem] shrink-0">
      <input type="hidden" name={name} value={dial} readOnly />
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open ? "true" : "false"}
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
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-[calc(100%+4px)] z-[100] max-h-60 min-w-[min(100vw-2rem,280px)] overflow-auto rounded-lg border border-[#999999] bg-white py-1 shadow-lg"
        >
          {options.map((o) => (
            <li key={o.dial} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={o.dial === dial ? "true" : "false"}
                className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-sm transition hover:bg-gray-50"
                onClick={() => {
                  setDial(o.dial);
                  setOpen(false);
                }}
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
                <span className="text-[#444444]">{o.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
