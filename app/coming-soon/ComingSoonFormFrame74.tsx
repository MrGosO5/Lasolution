"use client";

import type { ReactNode } from "react";

/**
 * Figma Property 1 = Frame 74 : fond #FFEAEA, radius 32px, filigranes logo @ 15 %.
 * Le calque filigrane est en overflow:hidden pour ne pas couper le dropdown téléphone (shell en overflow-visible).
 */
const W = 923;
const H = 664;

const MARKS: {
  kind: "decl" | "logo";
  left: number;
  top: number;
  rotate?: number;
}[] = [
  { kind: "decl", left: 766, top: 51 },
  { kind: "decl", left: 461, top: 596 },
  { kind: "decl", left: 30, top: 532 },
  { kind: "decl", left: 735, top: 444 },
  { kind: "decl", left: 8, top: 134 },
  { kind: "logo", left: 733.77, top: 233.17, rotate: 14.76 },
  { kind: "logo", left: 282, top: 573, rotate: 14.76 },
  { kind: "logo", left: 789.78, top: 294.13, rotate: -26.04 },
  { kind: "logo", left: 399.77, top: -25.26, rotate: -32.33 },
  { kind: "logo", left: 6.37, top: 288.74, rotate: -20.55 },
  { kind: "logo", left: 0, top: -7, rotate: 31.73 },
];

export function ComingSoonFormFrame74({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate mx-auto mt-10 w-full max-w-[923px] overflow-visible rounded-[32px] bg-[#FFEAEA] md:min-h-[664px]">
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[32px]"
        aria-hidden
      >
        {MARKS.map((m, i) => (
          <span
            key={i}
            className="absolute bg-contain bg-center bg-no-repeat opacity-[0.15]"
            style={{
              width: 120,
              height: 88,
              left: `${(m.left / W) * 100}%`,
              top: `${(m.top / H) * 100}%`,
              transform: m.rotate != null ? `rotate(${m.rotate}deg)` : undefined,
              transformOrigin: "center center",
              backgroundImage:
                m.kind === "decl"
                  ? "url(/icon/LOGO-SOLUTION-DECL.png)"
                  : "url(/icon/LOGO-SOLUTION-DECL.png)",
            }}
          />
        ))}
      </div>
      <div className="relative z-[11] flex justify-center px-6 py-12 md:px-[152px] md:py-12">
        <div className="relative w-full max-w-[619px] overflow-visible">{children}</div>
      </div>
    </div>
  );
}
