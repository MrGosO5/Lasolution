/**
 * Figma Frame 84 : deux colonnes (199.95px), gap 710px, tuiles LOGO-SOLUTION @ 5 %.
 * Group 4 = miroir horizontal (matrix -1,0,0,1) — équivalent aux rotations Figma côté droit.
 */
const MARK_CLASSES = [
  "coming-soon-hero-g3-mark--a",
  "coming-soon-hero-g3-mark--b",
  "coming-soon-hero-g3-mark--c",
  "coming-soon-hero-g3-mark--d",
  "coming-soon-hero-g3-mark--e",
] as const;

export function ComingSoonHeroFrame84() {
  return (
    <div className="coming-soon-hero-frame84-wrap" aria-hidden>
      <div className="coming-soon-hero-frame84">
        <div className="coming-soon-hero-g3">
          {MARK_CLASSES.map((c) => (
            <span key={c} className={`coming-soon-hero-g3-mark ${c}`} />
          ))}
        </div>
        <div className="coming-soon-hero-g4">
          {MARK_CLASSES.map((c) => (
            <span key={`m-${c}`} className={`coming-soon-hero-g3-mark ${c}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
