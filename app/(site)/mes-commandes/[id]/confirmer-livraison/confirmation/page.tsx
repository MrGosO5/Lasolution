import { Reveal } from "@/app/site/components/Reveal";
import { PageHeader } from "@/app/site/components/UI";
import { ConfirmReceiptClient } from "./ConfirmReceiptClient";

export default function ConfirmerLivraisonConfirmationPage({ params }: { params: { id: string } }) {
  const id = params.id;
  return (
    <main className="site-container site-section max-w-3xl">
      <Reveal>
        <PageHeader
          eyebrow="Client"
          title="Confirmer la réception"
          subtitle={`Commande #${id.slice(0, 8)}. Cette action marque la commande comme livrée.`}
        />
      </Reveal>

      <Reveal delayMs={120}>
        <ConfirmReceiptClient orderId={id} />
      </Reveal>
    </main>
  );
}
