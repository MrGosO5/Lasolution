import Image from "next/image";

const LOGO_SRC = "/icon/LOGO-SOLUTION-DECL.png";
const INTRINSIC_W = 237;
const INTRINSIC_H = 168;

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`relative inline-block ${className ?? ""}`}>
      <Image
        src={LOGO_SRC}
        alt="La Solution"
        width={INTRINSIC_W}
        height={INTRINSIC_H}
        className="h-auto w-20 max-w-full object-contain"
        style={{ height: "auto" }}
        sizes="80px"
        priority
      />
    </div>
  );
}
