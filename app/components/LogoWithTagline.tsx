import Image from "next/image";

const INTRINSIC_W = 1545;
const INTRINSIC_H = 364;

export function LogoWithTagline() {
  return (
    <div className="flex justify-center w-full mb-0 px-4 transition-opacity duration-500 ease-out">
      <Image
        src="/icon/LOGO-SOLUTION.png"
        alt="La Solution"
        width={INTRINSIC_W}
        height={INTRINSIC_H}
        className="h-auto w-[240px] max-w-full select-none object-contain sm:w-[280px] lg:w-[320px]"
        style={{ height: "auto" }}
        sizes="(max-width: 640px) 240px, (max-width: 1024px) 280px, 320px"
        priority
      />
    </div>
  );
}
