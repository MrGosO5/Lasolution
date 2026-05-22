import Image from "next/image";
import { BRAND_LOGO_HEIGHT, BRAND_LOGO_SRC, BRAND_LOGO_WIDTH } from "@/lib/brand-logo";

export function LogoWithTagline() {
  return (
    <div className="flex justify-center w-full mb-0 px-4 transition-opacity duration-500 ease-out">
      <Image
        src={BRAND_LOGO_SRC}
        alt="La Solution"
        width={BRAND_LOGO_WIDTH}
        height={BRAND_LOGO_HEIGHT}
        className="h-auto w-[min(100%,280px)] max-w-full select-none object-contain sm:w-[320px] lg:w-[380px]"
        style={{ height: "auto" }}
        sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 380px"
        priority
      />
    </div>
  );
}
