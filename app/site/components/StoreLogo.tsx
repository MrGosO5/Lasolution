import Image from "next/image";

export function StoreLogo({
  name,
  src,
}: {
  name: string;
  src?: string;
}) {
  if (!src) {
    return (
      <span className="inline-flex items-center justify-center rounded-xl bg-black/5 px-3 py-2 text-xs font-semibold text-gray-900">
        {name}
      </span>
    );
  }

  return (
    <div className="relative h-8 w-28">
      <Image
        src={src}
        alt={name}
        fill
        sizes="112px"
        className="object-contain"
        priority={false}
      />
    </div>
  );
}

