import type { Metadata } from "next";
import { ComingSoonVeiga } from "@/app/site/components/ComingSoonVeiga";

export const metadata: Metadata = {
  title: "Site bientot disponible",
  description: "Page de transition en attendant la mise en ligne du nouveau site.",
};

export default function ComingSoonVeigaPage() {
  return <ComingSoonVeiga />;
}
