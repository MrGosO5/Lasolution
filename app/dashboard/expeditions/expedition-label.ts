import QRCode from "qrcode";
import { formatTransport, type ExpeditionDetailData } from "./expedition-detail-data";

/** Coordonnées du hub relai affichées sur l'étiquette (constantes marque). */
const RELAY_PARTNER = {
  name: "Hub Cotonou - La Solution",
  phone: "+22940108548",
  hours: "Mar-Ven: 10H00 - 17H, Sam-Dim: 10H - 16H",
};

/** URL encodée dans le QR code (réseaux / avis). */
function qrTargetUrl(): string {
  const base =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) || "https://lasolution.org";
  return `${String(base).replace(/\/$/, "")}/mes-avis`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Sépare un nom complet en Nom (1er mot) + Prénom (reste). */
function splitName(full: string | null | undefined): { last: string; first: string } {
  const parts = String(full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { last: "", first: "" };
  if (parts.length === 1) return { last: parts[0], first: "" };
  return { last: parts[0], first: parts.slice(1).join(" ") };
}

function fieldLine(label: string, value: string): string {
  return `
    <div class="field">
      <span class="field-label">${escapeHtml(label)} :</span>
      <span class="field-value">${escapeHtml(value) || "—"}</span>
    </div>`;
}

function labelDocumentHtml(data: ExpeditionDetailData, qrDataUrl: string): string {
  const meta = data.meta || {};
  const sender = splitName(meta.senderName);
  const recipient = splitName(meta.recipientName);
  const tracking = meta.labelTrackingNumber || meta.trackingNumber || `LASOL-${data.id.slice(0, 12).toUpperCase()}`;
  const transport = formatTransport(meta.transportMode);
  const transportBadge = transport === "Aérien" ? "Transport Aérien" : transport === "Maritime" ? "Transport Maritime" : "Transport";
  const departure = meta.pickupAddress || "—";
  const destination = [meta.destinationCountry, meta.destinationAddress].filter(Boolean).join(" · ") || "—";
  const weight = meta.weightKg ? `${meta.weightKg} KG` : "—";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Étiquette ${escapeHtml(tracking)}</title>
<style>
  * { box-sizing: border-box; }
  @page { size: A5 portrait; margin: 10mm; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .label {
    width: 148mm;
    margin: 0 auto;
    padding: 4mm 6mm;
  }
  .brand { text-align: center; }
  .brand h1 { color: #d8232a; font-size: 22px; margin: 0 0 4px; font-weight: 800; }
  .brand p { color: #d8232a; font-size: 15px; margin: 0 0 10px; font-weight: 700; }
  .tracking-box {
    border: 2px solid #111;
    border-radius: 8px;
    text-align: center;
    padding: 10px 8px;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 1px;
    margin: 0 0 14px;
    word-break: break-all;
  }
  .section-title {
    font-size: 16px;
    font-weight: 800;
    text-decoration: underline;
    text-underline-offset: 3px;
    margin: 12px 0 6px;
  }
  .field { font-size: 12.5px; margin: 3px 0; }
  .field-label { font-weight: 700; }
  .badge {
    display: inline-block;
    background: #dbeafe;
    color: #1e3a8a;
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 11px;
    font-weight: 600;
  }
  .badge-grey {
    display: inline-block;
    background: #e5e7eb;
    color: #374151;
    border-radius: 999px;
    padding: 3px 12px;
    font-size: 11px;
    font-weight: 600;
  }
  .weight {
    font-size: 15px;
    font-weight: 800;
    text-decoration: underline;
    text-underline-offset: 3px;
    margin: 12px 0 4px;
  }
  .weight span { font-weight: 700; text-decoration: none; margin-left: 6px; }
  .social-title {
    font-size: 15px;
    font-weight: 800;
    border-bottom: 1.5px solid #111;
    padding-bottom: 4px;
    margin: 14px 0 8px;
  }
  .social-row { display: flex; align-items: center; gap: 10px; }
  .social-row .text { flex: 1; font-size: 11.5px; line-height: 1.4; }
  .social-row .text .scan { font-size: 15px; margin-top: 6px; }
  .social-row .qr { width: 96px; height: 96px; flex-shrink: 0; }
  .social-row .qr img { width: 100%; height: 100%; }
  table.relay {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5px;
    margin: 14px 0 8px;
  }
  table.relay th, table.relay td {
    border: 1px solid #111;
    padding: 5px 7px;
    text-align: left;
  }
  table.relay th { font-weight: 700; }
  .instruction-title {
    font-size: 13px;
    font-weight: 800;
    text-decoration: underline;
    text-underline-offset: 3px;
    margin: 10px 0 6px;
  }
  @media print {
    .no-print { display: none !important; }
  }
  .toolbar {
    text-align: center;
    padding: 12px;
    background: #f3f4f6;
  }
  .toolbar button {
    background: #d8232a;
    color: #fff;
    border: 0;
    border-radius: 8px;
    padding: 10px 18px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button type="button" onclick="window.print()">Imprimer / Enregistrer en PDF</button>
  </div>
  <div class="label">
    <div class="brand">
      <h1>La Solution</h1>
      <p>Achetez dans le monde, livrez en Afrique.</p>
    </div>

    <div class="tracking-box">${escapeHtml(tracking)}</div>

    <div class="section-title">ENVOYEUR</div>
    ${fieldLine("Nom de l'envoyeur", sender.last)}
    ${fieldLine("Prénom de l'envoyeur", sender.first)}
    ${fieldLine("Numéro de téléphone de l'envoyeur", meta.senderPhone || "")}
    ${fieldLine("Pays de départ", departure)}
    <div class="field">
      <span class="field-label">Type de transport :</span>
      <span class="badge">${escapeHtml(transportBadge)}</span>
    </div>

    <div class="section-title">DESTINATAIRE</div>
    ${fieldLine("Nom du destinataire", recipient.last)}
    ${fieldLine("Prénom du destinataire", recipient.first)}
    ${fieldLine("Numéro de téléphone du destinataire", meta.recipientPhone || "")}
    ${fieldLine("Pays de Livraison / Ville", destination)}

    <div class="weight">POIDS :<span>${escapeHtml(weight)}</span></div>

    <div class="social-title">Envoi nous ton unboxing , Tag sur nos réseaux</div>
    <div class="social-row">
      <div class="text">
        <strong>Abonne-toi à nos réseaux sociaux !!!</strong><br />
        Donne ton avis et profite jusqu'à 50% de réductions sur tes prochaines factures.
        <div class="scan">Scan moi !!!! ============&gt;</div>
      </div>
      <div class="qr"><img src="${qrDataUrl}" alt="QR code" /></div>
    </div>

    <table class="relay">
      <thead>
        <tr>
          <th>Partenaire Relai</th>
          <th>Numéro de Téléphone</th>
          <th>Horaires d'ouvertures</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${escapeHtml(RELAY_PARTNER.name)}</td>
          <td>${escapeHtml(RELAY_PARTNER.phone)}</td>
          <td>${escapeHtml(RELAY_PARTNER.hours)}</td>
        </tr>
      </tbody>
    </table>

    <div class="instruction-title">Instruction de livraison :</div>
    <span class="badge-grey">Livraison pris en charge par le relai Colis</span>
  </div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 300);
    });
  </script>
</body>
</html>`;
}

/**
 * Génère l'étiquette au format PDF (via le dialogue d'impression du navigateur,
 * option « Enregistrer au format PDF ») dans une nouvelle fenêtre.
 */
export async function openExpeditionLabel(data: ExpeditionDetailData): Promise<void> {
  const qrDataUrl = await QRCode.toDataURL(qrTargetUrl(), {
    margin: 1,
    width: 240,
    errorCorrectionLevel: "M",
  });

  const html = labelDocumentHtml(data, qrDataUrl);
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) {
    throw new Error("Fenêtre bloquée. Autorisez les pop-ups pour générer l'étiquette PDF.");
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
