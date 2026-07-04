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

export function PasswordInput(
  props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: string }
) {
  const { label, className, ...rest } = props;
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <label className="grid gap-2">
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <div className="relative">
        <input
          {...rest}
          type={showPassword ? "text" : "password"}
          className={[
            "h-11 w-full rounded-xl bg-white/80 ring-1 ring-black/10 px-4 pr-11 text-sm text-gray-900 placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-[rgb(214_54_78/0.25)]",
            className ?? "",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-600"
          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          <PasswordEyeIcon open={showPassword} />
        </button>
      </div>
    </label>
  );
}

function PasswordEyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
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

