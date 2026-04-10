const { createSmtpTransporter, buildMailFrom } = require("../emails/mailer");

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function toBufferFromDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(String(dataUrl || ""));
  if (!m) return null;
  try {
    return Buffer.from(m[2], "base64");
  } catch {
    return null;
  }
}

function normalizeTransportMode(raw) {
  const u = String(raw ?? "SEA").toUpperCase();
  if (u === "AIR" || u === "AERIEN" || u === "AÉRIEN") return "AIR";
  return "SEA";
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function setupShippingRequestRoutes(app, getPrisma) {
  /**
   * Demande d'expédition (aérien ou maritime) quand le client a déjà commandé ailleurs.
   * Photo obligatoire, poids optionnel.
   * Notifie customercare@lasolution.org.
   *
   * `transportMode`: "AIR" | "SEA" (défaut "SEA"). Un seul endpoint pour éviter les 404
   * si un ancien process backend n’a pas encore la route `/shipping-requests/air`.
   */
  async function handleShippingRequest(req, res, forcedMode) {
    const {
      contactEmail,
      senderName,
      senderPhone,
      pickupAddress,
      recipientName,
      recipientPhone,
      destinationCountry,
      destinationAddress,
      trackingNumber,
      weightKg,
      notes,
      photoDataUrl,
      transportMode: bodyMode,
      mode: legacyMode,
    } = req.body || {};

    const transportMode = forcedMode ?? normalizeTransportMode(bodyMode ?? legacyMode);
    const modeLabel = transportMode === "AIR" ? "aérien" : "maritime";

    if (!isNonEmptyString(senderPhone)) {
      return res.status(400).json({ error: "Téléphone expéditeur obligatoire." });
    }
    if (!isNonEmptyString(recipientPhone)) {
      return res.status(400).json({ error: "Téléphone destinataire obligatoire." });
    }
    if (!isNonEmptyString(recipientName)) {
      return res.status(400).json({ error: "Nom complet du destinataire obligatoire." });
    }
    if (!isNonEmptyString(pickupAddress)) {
      return res.status(400).json({ error: "Adresse complète de récupération obligatoire." });
    }
    if (!isNonEmptyString(destinationAddress)) {
      return res.status(400).json({ error: "Adresse complète de destination obligatoire." });
    }

    if (!photoDataUrl) {
      return res.status(400).json({ error: `Photo obligatoire pour un envoi ${modeLabel}.` });
    }

    const photoBuf = toBufferFromDataUrl(photoDataUrl);
    if (!photoBuf) {
      return res.status(400).json({ error: "Photo invalide (data URL base64 attendu)." });
    }
    if (photoBuf.length > MAX_PHOTO_BYTES) {
      return res.status(400).json({ error: "Photo trop volumineuse (max 5 Mo)." });
    }

    const to = process.env.CUSTOMERCARE_EMAIL || "customercare@lasolution.org";
    const transporter = createSmtpTransporter();

    const prisma = typeof getPrisma === "function" ? getPrisma() : null;
    if (prisma) {
      try {
        await prisma.securityEvent.create({
          data: {
            type: "shipping_request",
            email: isNonEmptyString(contactEmail) ? String(contactEmail).trim().slice(0, 320) : null,
            ip: req.ip || null,
            userAgent: (req.get("user-agent") || "").slice(0, 512) || null,
            meta: {
              transportMode,
              trackingNumber: trackingNumber || null,
              senderName: senderName || null,
              senderPhone,
              pickupAddress,
              recipientName,
              recipientPhone,
              destinationCountry: destinationCountry || null,
              destinationAddress,
              weightKg: weightKg != null && weightKg !== "" ? String(weightKg) : null,
              notes: notes ? String(notes).slice(0, 4000) : null,
              photoBytes: photoBuf.length,
            },
          },
        });
      } catch (logErr) {
        console.warn("[shipping-requests] SecurityEvent non enregistré:", logErr?.message || logErr);
      }
    }

    const dest = String(destinationCountry || "").trim() || "Destination";
    const subject = `Nouvelle demande d'envoi ${modeLabel} — ${dest}`;
    const body = [
      `Nouvelle demande d'envoi ${modeLabel} (créée via la plateforme).`,
      ``,
      `Contact email: ${contactEmail || "—"}`,
      ``,
      `Suivi (tracking): ${trackingNumber || "—"}`,
      ``,
      `Expéditeur: ${senderName || "—"} / ${senderPhone || "—"}`,
      `Adresse de récupération: ${pickupAddress || "—"}`,
      ``,
      `Destinataire: ${recipientName || "—"} / ${recipientPhone || "—"}`,
      `Pays destination: ${destinationCountry || "—"}`,
      `Adresse destination: ${destinationAddress || "—"}`,
      ``,
      `Poids approx (kg): ${weightKg != null && weightKg !== "" ? String(weightKg) : "— (non fourni)"}`,
      `Notes: ${notes || "—"}`,
    ].join("\n");

    try {
      await transporter.sendMail({
        from: buildMailFrom(),
        to,
        subject,
        text: body,
        ...(contactEmail ? { replyTo: String(contactEmail) } : {}),
        attachments: [
          {
            filename: "colis.jpg",
            content: photoBuf,
          },
        ],
      });
      res.json({ ok: true, emailed: true });
    } catch (e) {
      console.warn("[shipping-requests] email non envoyé:", e?.message || e);
      res.json({
        ok: true,
        emailed: false,
        warning:
          "Votre demande a bien été enregistrée. L’équipe n’a pas reçu l’e-mail automatique (configuration messagerie).",
      });
    }
  }

  app.post("/shipping-requests/maritime", (req, res) => handleShippingRequest(req, res, undefined));

  /** Alias : même logique, `transportMode` dans le corps. */
  app.post("/shipping-requests", (req, res) => handleShippingRequest(req, res, undefined));

  /** Rétrocompat : force le mode aérien si l’ancien frontend appelle encore cette URL. */
  app.post("/shipping-requests/air", (req, res) => handleShippingRequest(req, res, "AIR"));
}

module.exports = { setupShippingRequestRoutes };

