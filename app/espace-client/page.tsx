import { redirect } from "next/navigation";

/** Ancienne URL — hub client unifié sous /mon-espace */
export default function EspaceClientRedirectPage() {
  redirect("/mon-espace");
}
