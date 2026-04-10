import Image from "next/image";

/** Dimensions intrinsèques du fichier (ratio) — la taille à l’écran vient du CSS pour éviter l’avertissement Next/Image */
const INTRINSIC_W = 1545;
const INTRINSIC_H = 364;

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`relative inline-block ${className ?? ""}`}>
      <Image
        src="/icon/LOGO-SOLUTION.png"
        alt="La Solution"
        width={INTRINSIC_W}
        height={INTRINSIC_H}
        className="h-auto w-20 max-w-full object-contain drop-shadow-[0_0_12px_rgba(196,30,58,0.3)]"
        style={{ height: "auto" }}
        sizes="80px"
        priority
      />
    </div>
  );
}
