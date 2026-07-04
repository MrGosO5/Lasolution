"use client";

import * as React from "react";
import { FieldLabel } from "@/app/site/components/Form";
import { phoneDialOptions } from "@/lib/phone-dial-options";
import { dialFromCountry, formatPhoneValue, parsePhoneValue } from "@/lib/phone-country";

const inputClass =
  "h-11 w-full rounded-xl bg-white/80 ring-1 ring-black/10 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[rgb(214_54_78/0.25)]";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Pays connu (ex. Bénin, France) : l’indicatif est fixé automatiquement. */
  country?: string;
};

export function PhoneInput({ label, value, onChange, country, className, placeholder = "01 02 03 04 05", ...rest }: Props) {
  const lockedDial = dialFromCountry(country);
  const parsed = parsePhoneValue(value);
  const dial = lockedDial ?? parsed.dial;
  const national = parsed.national;

  React.useEffect(() => {
    if (!lockedDial) return;
    const { national: n } = parsePhoneValue(value);
    const next = formatPhoneValue(lockedDial, n);
    if (next !== value) onChange(next);
  }, [lockedDial, value, onChange]);

  function updateDial(nextDial: string) {
    onChange(formatPhoneValue(nextDial, national));
  }

  function updateNational(nextNational: string) {
    onChange(formatPhoneValue(dial, nextNational));
  }

  return (
    <label className={["grid gap-2", className ?? ""].join(" ")}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <div className="flex gap-2">
        {lockedDial ? (
          <span className="inline-flex h-11 shrink-0 items-center rounded-xl bg-white/80 px-3 text-sm font-semibold tabular-nums text-gray-900 ring-1 ring-black/10">
            {lockedDial}
          </span>
        ) : (
          <select
            aria-label="Indicatif téléphonique"
            value={dial}
            onChange={(e) => updateDial(e.target.value)}
            className="h-11 w-[7.5rem] shrink-0 rounded-xl bg-white/80 px-2 text-sm font-semibold tabular-nums text-gray-900 ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-[rgb(214_54_78/0.25)]"
          >
            {phoneDialOptions.map((o) => (
              <option key={`${o.iso}-${o.dial}`} value={o.dial}>
                {o.dial}
              </option>
            ))}
          </select>
        )}
        <input
          {...rest}
          type="tel"
          autoComplete="tel-national"
          className={inputClass}
          placeholder={placeholder}
          value={national}
          onChange={(e) => updateNational(e.target.value)}
        />
      </div>
    </label>
  );
}
