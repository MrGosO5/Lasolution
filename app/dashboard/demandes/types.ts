export type DemandeRow = {
  id: string;
  nom: string;
  prenoms: string;
  email: string;
  phone: string;
  paysResidence: string;
  dateDemande: string;
  typeDemande: string;
  status: string;
  documents: { type: string; label: string }[];
  processedAt: string | null;
};
