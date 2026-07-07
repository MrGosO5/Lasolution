"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileWidgetProps = {
  onToken: (token: string | null) => void;
  className?: string;
};

function ensureScript(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
    return;
  }
  const script = document.createElement("script");
  script.src = SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function TurnstileWidget({ onToken, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      if (process.env.NODE_ENV !== "production") onToken("dev-bypass");
      return;
    }

    ensureScript();

    let cancelled = false;
    const start = Date.now();
    const timer = window.setInterval(() => {
      if (cancelled) return;
      if (window.turnstile) {
        setReady(true);
        window.clearInterval(timer);
      } else if (Date.now() - start > 15000) {
        window.clearInterval(timer);
      }
    }, 150);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [siteKey, onToken]);

  useEffect(() => {
    if (!ready || !siteKey || !containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(null),
      "error-callback": () => onToken(null),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [ready, siteKey, onToken]);

  if (!siteKey) {
    if (process.env.NODE_ENV === "production") {
      return (
        <p className="text-sm text-amber-800 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
          Vérification anti-robot non configurée (TURNSTILE).
        </p>
      );
    }
    return null;
  }

  return <div ref={containerRef} className={className} />;
}
