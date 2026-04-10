import type { AppRole } from "@/types/app-role";

export const partnerPathByRole: Partial<Record<AppRole, string>> = {
  relais: "/partenaire/relais",
  solupacker: "/partenaire/packer",
  solu_livreur: "/partenaire/livreur",
  ambassadeur: "/partenaire/ambassadeur",
};

export function roleForPartnerSpace(space: string): AppRole | null {
  switch (space) {
    case "relais":
      return "relais";
    case "packer":
      return "solupacker";
    case "livreur":
      return "solu_livreur";
    case "ambassadeur":
      return "ambassadeur";
    default:
      return null;
  }
}

export function titleForPartnerSpace(space: string): string {
  switch (space) {
    case "relais":
      return "Espace relais";
    case "packer":
      return "Espace Solupacker";
    case "livreur":
      return "Espace Solu livreur";
    case "ambassadeur":
      return "Espace ambassadeur";
    default:
      return "Espace partenaire";
  }
}
