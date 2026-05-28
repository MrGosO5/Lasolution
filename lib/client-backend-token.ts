"use client";

import { signOut } from "next-auth/react";

type SessionUpdate = (data: {
  accessToken: string;
  refreshToken?: string;
}) => Promise<unknown>;

/** Rafraîchit le jeton API court via la route Next.js (refresh stocké dans le JWT httpOnly). */
export async function refreshClientAccessToken(update?: SessionUpdate): Promise<string | null> {
  const res = await fetch("/api/auth/refresh-backend", { method: "POST", cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as { accessToken?: string; refreshToken?: string };
  if (!data.accessToken) return null;

  if (update) {
    await update({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  }

  return data.accessToken;
}

export async function fetchWithBackendAuth(
  input: string,
  init: RequestInit & { accessToken?: string | null; update?: SessionUpdate } = {},
): Promise<Response> {
  const { accessToken: initialToken, update, ...fetchInit } = init;
  let token = initialToken;
  const headers = new Headers(fetchInit.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(input, { ...fetchInit, headers });

  if (res.status === 401) {
    token = await refreshClientAccessToken(update);
    if (!token) {
      await signOut({ callbackUrl: "/connexion" });
      return res;
    }
    headers.set("Authorization", `Bearer ${token}`);
    res = await fetch(input, { ...fetchInit, headers });
  }

  return res;
}
