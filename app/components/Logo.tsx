import Image from "next/image";
import { BRAND_LOGO_SRC, BRAND_LOGO_WIDTH, BRAND_LOGO_HEIGHT } from "@/lib/brand-logo";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src={BRAND_LOGO_SRC}
      alt="La Solution"
      width={BRAND_LOGO_WIDTH}
      height={BRAND_LOGO_HEIGHT}
      priority
      sizes="(max-width: 640px) 225px, 250px"
      className={`h-11 w-auto shrink-0 select-none object-contain sm:h-12 ${className ?? ""}`}
    />
  );
}
