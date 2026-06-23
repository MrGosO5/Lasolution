import Image from "next/image";
import { BRAND_LOGO_SRC } from "@/lib/brand-logo";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`relative aspect-[1565/306] h-11 w-auto shrink-0 sm:h-12 ${className ?? ""}`}>
      <Image
        src={BRAND_LOGO_SRC}
        alt="La Solution"
        fill
        className="object-contain object-left"
        sizes="(max-width: 640px) 220px, 260px"
        priority
      />
    </div>
  );
}
