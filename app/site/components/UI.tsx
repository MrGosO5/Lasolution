import Link from "next/link";
import * as React from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-sm md:text-base text-gray-600 leading-relaxed">
            {subtitle}
          </p>
        ) : null}
      </div>
      {right ? <div className="flex gap-3">{right}</div> : null}
    </div>
  );
}

export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="btn btn-primary"
    >
      {children}
    </Link>
  );
}

export function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="btn btn-ghost"
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "card",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

