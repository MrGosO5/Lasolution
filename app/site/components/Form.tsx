"use client";

import * as React from "react";

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold tracking-wide text-gray-700 uppercase">{children}</span>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, className, ...rest } = props;
  return (
    <label className="grid gap-2">
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <input
        {...rest}
        className={[
          "h-11 w-full rounded-xl bg-white/80 ring-1 ring-black/10 px-4 text-sm text-gray-900 placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(214_54_78/0.25)]",
          className ?? "",
        ].join(" ")}
      />
    </label>
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }
) {
  const { label, className, children, ...rest } = props;
  return (
    <label className="grid gap-2">
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <select
        {...rest}
        className={[
          "h-11 w-full rounded-xl bg-white/80 ring-1 ring-black/10 px-4 text-sm text-gray-900",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(214_54_78/0.25)]",
          className ?? "",
        ].join(" ")}
      >
        {children}
      </select>
    </label>
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
) {
  const { label, className, ...rest } = props;
  return (
    <label className="grid gap-2">
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <textarea
        {...rest}
        className={[
          "min-h-28 w-full rounded-2xl bg-white/80 ring-1 ring-black/10 p-4 text-sm text-gray-900 placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(214_54_78/0.25)]",
          className ?? "",
        ].join(" ")}
      />
    </label>
  );
}

export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between gap-4 rounded-2xl bg-white/70 ring-1 ring-black/5 px-5 py-4 text-left transition-smooth hover:shadow-lg hover:shadow-gray-200/40"
    >
      <span className="text-sm font-semibold text-gray-900">{label}</span>
      <span
        aria-hidden
        className={[
          "relative h-6 w-11 rounded-full ring-1 ring-black/10 transition-smooth",
          value ? "bg-[var(--logo-red)]" : "bg-black/10",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-smooth",
            value ? "left-5" : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

