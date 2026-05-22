import Image from "next/image";
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH } from "@/lib/brand-logo";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`relative inline-block ${className ?? ""}`}>
      <Image
        src={BRAND_LOGO_SRC}
        alt="La Solution"
        width={BRAND_LOGO_WIDTH}
        height={BRAND_LOGO_HEIGHT}
        className="h-10 w-auto max-w-[200px] object-contain object-left"
        style={{ height: "auto" }}
        sizes="(max-width: 768px) 160px, 200px"
        priority
      />
    </div>
  );
}
