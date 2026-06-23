"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackEvent, type AnalyticsEventName } from "@/lib/analytics";

type Props = ComponentProps<typeof Link> & {
  event: AnalyticsEventName;
};

export function TrackedLink({ event, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackEvent(event);
        onClick?.(e);
      }}
    />
  );
}
