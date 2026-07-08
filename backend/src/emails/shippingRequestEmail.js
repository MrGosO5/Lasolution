/**
 * EmailJS a une limite de taille sur la "variables payload" (en pratique, la string photo_html/base64).
 * On évite d'embarquer l'aperçu base64 dans l'email dès que la taille estimée dépasse ~40Ko.
 */
const MAX_INLINE_PHOTO_BASE64_CHARS = 40 * 1024; // base64 chars, hors overhead HTML

function estimateBase64Chars(byteLength) {
  // base64 length = ceil(n/3)*4
  return Math.ceil(byteLength / 3) * 4;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dash(value) {
  const s = String(value ?? "").trim();
  return s || "—";
}

function formatSubmittedAt(date = new Date()) {
  try {
    return date.toLocaleString("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Europe/Paris",
    });
  } catch {
    return date.toISOString();
  }
}

function buildPhotoHtml({ photoBuf, photoMime }) {
  if (!photoBuf || !photoBuf.length) {
    return `<p style="margin:0;font-size:14px;color:#6b7280;">Aucune photo transmise.</p>`;
  }

  const sizeKb = Math.round(photoBuf.length / 1024);
  const base64Chars = estimateBase64Chars(photoBuf.length);
  if (base64Chars > MAX_INLINE_PHOTO_BASE64_CHARS) {
    return `<p style="margin:0;font-size:14px;line-height:1.55;color:#6b7280;">Photo du colis reçue (<strong>${sizeKb}&nbsp;Ko</strong>). Aperçu non inclus dans l’e-mail (limite EmailJS). Consultez le journal d’activité.</p>`;
  }

  const mime = photoMime || "image/jpeg";
  const b64 = photoBuf.toString("base64");
  return `<img src="data:${mime};base64,${b64}" alt="Photo du colis" width="520" style="display:block;max-width:100%;height:auto;border-radius:12px;border:1px solid rgba(196,30,58,0.15);" />`;
}

/**
 * Paramètres EmailJS alignés sur `docs/emailjs/shipping-request.html`.
 */
function buildShippingRequestTemplateParams(payload) {
  const {
    transportMode,
    contactEmail,
    trackingNumber,
    senderName,
    senderPhone,
    pickupAddress,
    recipientName,
    recipientPhone,
    destinationCountry,
    destinationAddress,
    weightKg,
    notes,
    photoBuf,
    photoMime,
  } = payload;

  const transport_mode_label = transportMode === "AIR" ? "Aérien" : "Maritime";
  const contact = dash(contactEmail);
  const photo_html = buildPhotoHtml({ photoBuf, photoMime });

  return {
    transport_mode: transportMode,
    transport_mode_label,
    contact_email: contact,
    contact_email_html: contactEmail
      ? `<a href="mailto:${escapeHtml(contactEmail)}" style="color:#d12e5e;text-decoration:none;font-weight:600;">${escapeHtml(contactEmail)}</a>`
      : "—",
    tracking_number: dash(trackingNumber),
    sender_name: dash(senderName),
    sender_phone: dash(senderPhone),
    pickup_address: escapeHtml(dash(pickupAddress)).replace(/\n/g, "<br />"),
    recipient_name: dash(recipientName),
    recipient_phone: dash(recipientPhone),
    destination_country: dash(destinationCountry),
    destination_address: escapeHtml(dash(destinationAddress)).replace(/\n/g, "<br />"),
    weight_kg: weightKg != null && String(weightKg).trim() !== "" ? String(weightKg) : "—",
    notes: notes ? escapeHtml(String(notes)).replace(/\n/g, "<br />") : "—",
    photo_html,
    photo_size_kb: photoBuf ? String(Math.round(photoBuf.length / 1024)) : "0",
    submitted_at: formatSubmittedAt(),
    reply_to: contactEmail ? String(contactEmail).trim() : "",
  };
}

function buildShippingRequestPlainText(payload) {
  const params = buildShippingRequestTemplateParams(payload);
  const pickup = dash(payload.pickupAddress);
  const destination = dash(payload.destinationAddress);
  const notesRaw = payload.notes ? String(payload.notes).trim() : "—";

  return [
    `Nouvelle demande d'envoi ${params.transport_mode_label} (La Solution).`,
    "",
    `Contact : ${params.contact_email}`,
    `Suivi : ${params.tracking_number}`,
    "",
    `Expéditeur : ${params.sender_name} / ${params.sender_phone}`,
    `Récupération : ${pickup}`,
    "",
    `Destinataire : ${params.recipient_name} / ${params.recipient_phone}`,
    `Pays : ${params.destination_country}`,
    `Adresse : ${destination}`,
    "",
    `Poids (kg) : ${params.weight_kg}`,
    `Notes : ${notesRaw}`,
    "",
    `Reçu le : ${params.submitted_at}`,
  ].join("\n");
}

module.exports = {
  buildShippingRequestTemplateParams,
  buildShippingRequestPlainText,
  escapeHtml,
};
