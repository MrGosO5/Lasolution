/**
 * Templates HTML des emails transactionnels La Solution.
 * Chaque fonction retourne { subject, html, text }.
 */

const BRAND_COLOR = "#4F46E5";
const BASE_URL = () => (process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || "https://lasolution.org").replace(/\/$/, "");

function layout(content) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>La Solution</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:${BRAND_COLOR};padding:24px 32px;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:-0.5px;">La Solution</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #E4E4E7;background:#FAFAFA;">
            <p style="margin:0;font-size:12px;color:#71717A;line-height:1.6;">
              Cet email a été envoyé automatiquement par La Solution.<br/>
              <a href="${BASE_URL()}" style="color:${BRAND_COLOR};text-decoration:none;">${BASE_URL()}</a>
              &nbsp;·&nbsp;
              <a href="mailto:customercare@lasolution.org" style="color:${BRAND_COLOR};text-decoration:none;">customercare@lasolution.org</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(href, label) {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;">${label}</a>`;
}

function h1(text) {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#18181B;">${text}</h1>`;
}

function p(text) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#3F3F46;line-height:1.6;">${text}</p>`;
}

function badge(label, color = "#4F46E5", bg = "#EEF2FF") {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${bg};color:${color};font-weight:bold;font-size:13px;">${label}</span>`;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Email de bienvenue après inscription.
 */
function welcomeEmail({ name }) {
  const subject = "Bienvenue sur La Solution 🎉";
  const html = layout(`
    ${h1(`Bienvenue, ${name} !`)}
    ${p("Votre compte La Solution a bien été créé. Vous pouvez dès maintenant passer vos premières commandes et suivre leur acheminement en temps réel.")}
    ${p("Si vous avez des questions, notre équipe est disponible à <a href='mailto:customercare@lasolution.org' style='color:${BRAND_COLOR}'>customercare@lasolution.org</a>.")}
    ${btn(BASE_URL() + "/mon-espace", "Accéder à mon espace")}
  `);
  const text = `Bienvenue ${name} !\n\nVotre compte La Solution a été créé avec succès.\n\nConnectez-vous : ${BASE_URL()}/mon-espace\n\nL'équipe La Solution`;
  return { subject, html, text };
}

/**
 * Confirmation de commande (statut AWAITING_PAYMENT ou PAID).
 */
function orderConfirmationEmail({ name, orderId, status, lines = [] }) {
  const ref = orderId.slice(0, 8).toUpperCase();
  const statusLabels = {
    AWAITING_PAYMENT: { label: "En attente de paiement", color: "#C09A00", bg: "#FFF9CA" },
    PAID: { label: "Payée", color: "#1565C0", bg: "#E3F2FD" },
  };
  const s = statusLabels[status] || { label: status, color: "#4F46E5", bg: "#EEF2FF" };

  const linesHtml = lines.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #E4E4E7;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#F4F4F5;">
          <th style="text-align:left;padding:10px 14px;font-size:12px;color:#71717A;font-weight:600;">Produit</th>
          <th style="text-align:right;padding:10px 14px;font-size:12px;color:#71717A;font-weight:600;">Qté</th>
          <th style="text-align:right;padding:10px 14px;font-size:12px;color:#71717A;font-weight:600;">Prix unit.</th>
        </tr></thead>
        <tbody>
          ${lines.map((l) => `<tr style="border-top:1px solid #E4E4E7;">
            <td style="padding:10px 14px;font-size:14px;color:#18181B;">${l.description}</td>
            <td style="padding:10px 14px;font-size:14px;color:#3F3F46;text-align:right;">${l.quantity}</td>
            <td style="padding:10px 14px;font-size:14px;color:#3F3F46;text-align:right;">${Number(l.unitPrice).toFixed(2)} ${l.currency}</td>
          </tr>`).join("")}
        </tbody>
      </table>`
    : "";

  const subject = `Commande #${ref} — La Solution`;
  const html = layout(`
    ${h1(`Votre commande #${ref}`)}
    ${p(`Bonjour ${name},`)}
    ${p("Votre commande a bien été enregistrée. Retrouvez ci-dessous son récapitulatif.")}
    <p style="margin:0 0 16px;">Statut : ${badge(s.label, s.color, s.bg)}</p>
    ${linesHtml}
    ${btn(BASE_URL() + "/mes-commandes/" + orderId, "Suivre ma commande")}
  `);
  const text = `Commande #${ref}\n\nBonjour ${name},\n\nVotre commande a été enregistrée avec le statut : ${s.label}.\n\nSuivez-la ici : ${BASE_URL()}/mes-commandes/${orderId}\n\nL'équipe La Solution`;
  return { subject, html, text };
}

/**
 * Notification de changement de statut commande.
 */
function orderStatusEmail({ name, orderId, status }) {
  const ref = orderId.slice(0, 8).toUpperCase();
  const statusMap = {
    AWAITING_PAYMENT: { label: "En attente de paiement", color: "#C09A00", bg: "#FFF9CA", msg: "Finalisez votre paiement pour lancer la préparation de votre colis." },
    PAID: { label: "Payée", color: "#1565C0", bg: "#E3F2FD", msg: "Votre paiement a été confirmé. Votre commande est en cours de préparation." },
    DELIVERED: { label: "Livrée", color: "#218922", bg: "#B4FFB5", msg: "Votre commande a été livrée. Merci de confirmer la réception si ce n'est pas encore fait." },
    CANCELLED: { label: "Annulée", color: "#A31F1F", bg: "#FFB4B4", msg: "Votre commande a été annulée. Contactez-nous si vous avez des questions." },
  };
  const s = statusMap[status] || { label: status, color: "#4F46E5", bg: "#EEF2FF", msg: "Le statut de votre commande a été mis à jour." };

  const subject = `Mise à jour commande #${ref} — ${s.label}`;
  const html = layout(`
    ${h1(`Mise à jour de votre commande`)}
    ${p(`Bonjour ${name},`)}
    ${p(s.msg)}
    <p style="margin:0 0 16px;">Commande <strong>#${ref}</strong> — Nouveau statut : ${badge(s.label, s.color, s.bg)}</p>
    ${btn(BASE_URL() + "/mes-commandes/" + orderId, "Voir ma commande")}
  `);
  const text = `Mise à jour commande #${ref}\n\nBonjour ${name},\n\n${s.msg}\n\nStatut : ${s.label}\n\nVoir la commande : ${BASE_URL()}/mes-commandes/${orderId}\n\nL'équipe La Solution`;
  return { subject, html, text };
}

/**
 * Email de réinitialisation de mot de passe.
 */
function passwordResetEmail({ resetLink }) {
  const subject = "Réinitialisation de votre mot de passe — La Solution";
  const html = layout(`
    ${h1("Réinitialisez votre mot de passe")}
    ${p("Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien est valable <strong>1 heure</strong>.")}
    ${btn(resetLink, "Choisir un nouveau mot de passe")}
    ${p("<small style='color:#71717A;'>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message. Votre mot de passe reste inchangé.</small>")}
  `);
  const text = `Réinitialisation de mot de passe\n\nCliquez sur ce lien (valable 1 heure) :\n${resetLink}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\nL'équipe La Solution`;
  return { subject, html, text };
}

/**
 * Email de vérification d'adresse.
 */
function emailVerificationEmail({ name, verifyLink }) {
  const subject = "Confirmez votre adresse email — La Solution";
  const html = layout(`
    ${h1("Confirmez votre email")}
    ${p(`Bonjour ${name || ""},`)}
    ${p("Merci de votre inscription. Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et pouvoir passer commande. Ce lien est valable <strong>24 heures</strong>.")}
    ${btn(verifyLink, "Confirmer mon email")}
    ${p("<small style='color:#71717A;'>Si vous n'avez pas créé de compte, ignorez ce message.</small>")}
  `);
  const text = `Confirmez votre email\n\nBonjour ${name || ""},\n\nCliquez sur ce lien (valable 24 h) :\n${verifyLink}\n\nL'équipe La Solution`;
  return { subject, html, text };
}

module.exports = { welcomeEmail, orderConfirmationEmail, orderStatusEmail, passwordResetEmail, emailVerificationEmail };
