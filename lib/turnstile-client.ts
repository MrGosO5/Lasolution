/** True when Cloudflare Turnstile site key is baked into the Next.js build. */
export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}
