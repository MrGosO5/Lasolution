/** URL absolue pour une photo d’avis servie par l’API Express (/uploads/...). */
export function testimonialPhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) return photoUrl;
  const base = (
    process.env.NEXT_PUBLIC_AUTH_API_URL ||
    process.env.INTERNAL_AUTH_API_URL ||
    process.env.AUTH_API_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");
  return `${base}${photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`}`;
}
