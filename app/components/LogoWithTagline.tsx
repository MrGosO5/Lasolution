import Image from "next/image";

const LOGO_SRC = "/icon/LOGO-SOLUTION-DECL.png";
const INTRINSIC_W = 237;
const INTRINSIC_H = 168;

export function LogoWithTagline() {
  return (
    <div className="flex justify-center w-full mb-0 px-4 transition-opacity duration-500 ease-out">
      <Image
        src={LOGO_SRC}
        alt="La Solution"
        width={INTRINSIC_W}
        height={INTRINSIC_H}
        className="h-auto w-[180px] max-w-full select-none object-contain sm:w-[210px] lg:w-[240px]"
        style={{ height: "auto" }}
        sizes="(max-width: 640px) 180px, (max-width: 1024px) 210px, 240px"
        priority
      />
    </div>
  );
}
