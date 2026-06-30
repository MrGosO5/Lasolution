const crypto = require("crypto");
const { Prisma } = require("@prisma/client");
const { hashPassword } = require("../auth/password");
const { createSmtpTransporter, buildMailFrom } = require("../emails/mailer");
const {
  APPLICATION_TYPES,
  PARTNER_ROLES,
  PROCESSED_STATUSES,
  roleFromApplicationType,
  documentsForRole,
  requiredDocumentsForRole,
  isApplicationType,
} = require("../constants/applications");
const {
  saveApplicationDocument,
  deleteApplicationDocumentsDir,
  readApplicationDocument,
} = require("../utils/mediaProof");

class ApplicationError extends Error {
  constructor(message, statusCode = 400, code = "APPLICATION_ERROR") {
    super(message);
    this.name = "ApplicationError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function generateTempPassword(length = 14) {
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += TEMP_PASSWORD_ALPHABET[crypto.randomInt(TEMP_PASSWORD_ALPHABET.length)];
  }
  return pwd;
}

function loginUrl() {
  const base = (process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || "http://localhost:3001").replace(/\/$/, "");
  return `${base}/connexion`;
}

function sanitizeMetaBody(body) {
  const copy = { ...body };
  delete copy.documents;
  return copy;
}

function buildPartnerProfile(meta, role) {
  const base = {
    phone: String(meta.phone || "").slice(0, 80) || null,
    address: String(meta.address || "").slice(0, 500) || null,
    nationality: String(meta.nationality || "").slice(0, 80) || null,
    mustChangePassword: true,
  };
  if (role === PARTNER_ROLES.RELAY) {
    return {
      ...base,
      relayName: String(meta.relayName || "").slice(0, 200) || null,
      relayAddress: String(meta.relayAddress || "").slice(0, 500) || null,
      openTime: String(meta.openTime || "").slice(0, 20) || null,
      closeTime: String(meta.closeTime || "").slice(0, 20) || null,
      city: String(meta.city || "").slice(0, 120) || null,
      country: String(meta.country || meta.nationality || "").slice(0, 80) || null,
    };
  }
  return base;
}

function validateSubmitFields(body, role) {
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!lastName) throw new ApplicationError("Nom requis.", 400);
  if (!firstName) throw new ApplicationError("Prénom requis.", 400);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApplicationError("Email valide requis.", 400);
  }
  if (!phone) throw new ApplicationError("Téléphone requis.", 400);

  if (role === PARTNER_ROLES.RELAY) {
    const relayName = typeof body.relayName === "string" ? body.relayName.trim() : "";
    const relayAddress = typeof body.relayAddress === "string" ? body.relayAddress.trim() : "";
    if (!relayName) throw new ApplicationError("Nom du point relais requis.", 400);
    if (!relayAddress) throw new ApplicationError("Adresse du point relais requise.", 400);
  }

  return { lastName, firstName, email, phone };
}

function docErrorMessage(code) {
  const map = {
    DOC_INVALID: "Document invalide.",
    DOC_UNSUPPORTED: "Format non supporté (JPG, PNG ou PDF uniquement).",
    DOC_EMPTY: "Fichier vide.",
    DOC_TOO_LARGE: "Document trop volumineux (max 5 Mo).",
    DOC_SIGNATURE_MISMATCH: "Le contenu du fichier ne correspond pas au format déclaré.",
  };
  return map[code] || "Erreur document.";
}

async function saveApplicationDocuments(applicationId, role, documentsPayload) {
  const allowed = documentsForRole(role);
  const required = requiredDocumentsForRole(role);
  const docs = documentsPayload && typeof documentsPayload === "object" ? documentsPayload : {};
  const saved = {};

  for (const docType of required) {
    const dataUrl = docs[docType];
    if (!dataUrl || typeof dataUrl !== "string") {
      throw new ApplicationError(`Document obligatoire manquant : ${docType}.`, 400);
    }
  }

  for (const docType of allowed) {
    const dataUrl = docs[docType];
    if (!dataUrl) continue;
    if (typeof dataUrl !== "string") {
      throw new ApplicationError(`Document invalide : ${docType}.`, 400);
    }
    try {
      const result = await saveApplicationDocument({ applicationId, docType, dataUrl });
      saved[docType] = {
        path: result.path,
        mime: result.mime,
        size: result.size,
      };
    } catch (e) {
      throw new ApplicationError(docErrorMessage(e.code), 400, e.code);
    }
  }

  for (const docType of required) {
    if (!saved[docType]) {
      throw new ApplicationError(`Document obligatoire manquant : ${docType}.`, 400);
    }
  }

  return saved;
}

function teamNotificationSubject(role, name) {
  if (role === PARTNER_ROLES.RELAY) return `[Point relais] Demande — ${name}`;
  return `[SoluPacker] Demande — ${name}`;
}

async function sendTeamNotification({ role, email, name, body }) {
  const to = process.env.CUSTOMERCARE_EMAIL || "customercare@lasolution.org";
  const label = role === PARTNER_ROLES.RELAY ? "Point relais partenaire" : "SoluPacker";
  const text = [
    `Nouvelle demande ${label}.`,
    "",
    `Email: ${email}`,
    `Nom: ${name}`,
    `Téléphone: ${body.phone || "—"}`,
    "",
    "Détails et documents en base (SecurityEvent).",
  ].join("\n");
  try {
    const transporter = createSmtpTransporter();
    await transporter.sendMail({
      from: buildMailFrom(),
      to,
      subject: teamNotificationSubject(role, name),
      text,
      replyTo: email,
    });
  } catch (mailErr) {
    console.warn("[application] email équipe non envoyé:", mailErr?.message || mailErr);
  }
}

/**
 * Soumission candidature (SoluPacker ou Point Relai).
 */
async function submitApplication(prisma, { applicationType, body, ip, userAgent }) {
  if (!prisma) throw new ApplicationError("Base indisponible.", 503);
  const role = roleFromApplicationType(applicationType);
  if (!role) throw new ApplicationError("Type de candidature invalide.", 400);

  const { lastName, firstName, email } = validateSubmitFields(body, role);
  const metaBody = sanitizeMetaBody(body);
  const name = `${firstName} ${lastName}`.trim();

  let event;
  try {
    event = await prisma.securityEvent.create({
      data: {
        type: applicationType,
        email,
        ip: ip || null,
        userAgent: userAgent || null,
        meta: {
          ...metaBody,
          status: "pending",
          submittedAt: new Date().toISOString(),
        },
      },
    });
  } catch (e) {
    throw new ApplicationError(String(e.message || e), 500);
  }

  let documentsMeta;
  try {
    documentsMeta = await saveApplicationDocuments(event.id, role, body.documents);
    const metaWithoutDocs = { ...metaBody, status: "pending", submittedAt: new Date().toISOString(), documents: documentsMeta };
    const metaStr = JSON.stringify(metaWithoutDocs);
    if (metaStr.length > 20000) {
      throw new ApplicationError("Données trop volumineuses.", 400);
    }
    await prisma.securityEvent.update({
      where: { id: event.id },
      data: { meta: metaWithoutDocs },
    });
  } catch (e) {
    await deleteApplicationDocumentsDir(event.id);
    try {
      await prisma.securityEvent.delete({ where: { id: event.id } });
    } catch (_) {}
    if (e instanceof ApplicationError) throw e;
    throw new ApplicationError(String(e.message || e), 500);
  }

  await sendTeamNotification({ role, email, name, body });
  return { ok: true, id: event.id };
}

function getApplicationStatus(meta) {
  const status = meta && typeof meta.status === "string" ? meta.status : "pending";
  return status;
}

async function createPartnerAccountFromApplication(tx, { application, role, adminId, ip }) {
  const meta = application.meta && typeof application.meta === "object" ? application.meta : {};
  const status = getApplicationStatus(meta);
  if (PROCESSED_STATUSES.has(status)) {
    throw new ApplicationError("Cette candidature a déjà été traitée.", 409);
  }

  const email = String(application.email || meta.email || "").trim().toLowerCase();
  if (!email) throw new ApplicationError("Email candidature manquant.", 400);

  const existing = await tx.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw new ApplicationError("Un compte existe déjà avec cet email.", 409);
  }

  const tempPassword = generateTempPassword();
  const passwordHash = hashPassword(tempPassword);
  const userId = crypto.randomUUID();
  const firstName = String(meta.firstName || "").trim();
  const lastName = String(meta.lastName || "").trim();
  const name = `${firstName} ${lastName}`.trim() || email;

  const profile = buildPartnerProfile(meta, role);
  const now = new Date().toISOString();

  await tx.user.create({
    data: {
      id: userId,
      email,
      name,
      role,
      passwordHash,
      profile,
    },
  });

  await tx.userApplication.create({
    data: {
      userId,
      role,
      status: "accepted",
    },
  });

  const updatedMeta = {
    ...meta,
    status: "accepted",
    acceptedAt: now,
    acceptedBy: adminId,
    userId,
  };

  await tx.securityEvent.update({
    where: { id: application.id },
    data: { meta: updatedMeta, userId },
  });

  try {
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "application.accepted",
        entityType: "SecurityEvent",
        entityId: application.id,
        after: {
          applicationId: application.id,
          action: "accepted",
          role,
          adminId,
          timestamp: now,
          ip: ip || null,
        },
      },
    });
  } catch (_) {}

  return { userId, email, name, tempPassword, role };
}

async function sendAcceptanceEmail({ email, name, tempPassword, role }) {
  const login = loginUrl();
  const roleLabel = role === PARTNER_ROLES.RELAY ? "Point Relai partenaire" : "SoluPacker";
  const subject =
    role === PARTNER_ROLES.RELAY
      ? "Votre demande Point Relai a été acceptée"
      : "Votre demande SoluPacker a été acceptée";
  const text = [
    `Bonjour ${name},`,
    "",
    `Votre candidature ${roleLabel} a été acceptée.`,
    "",
    "Identifiants de connexion :",
    `Email : ${email}`,
    `Mot de passe temporaire : ${tempPassword}`,
    "",
    `Connectez-vous ici : ${login}`,
    "",
    "Pour votre sécurité, changez ce mot de passe dès votre première connexion.",
    "",
    "L'équipe La Solution",
  ].join("\n");

  const transporter = createSmtpTransporter();
  await transporter.sendMail({
    from: buildMailFrom(),
    to: email,
    subject,
    text,
  });
}

async function logAcceptanceEmailFailure(prisma, { applicationId, email, adminId, role }) {
  try {
    await prisma.securityEvent.create({
      data: {
        type: "acceptance_email_failed",
        email,
        meta: {
          applicationId,
          role,
          adminId,
          failedAt: new Date().toISOString(),
        },
      },
    });
  } catch (_) {}
  try {
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "application.acceptance_email_failed",
        entityType: "SecurityEvent",
        entityId: applicationId,
        after: { applicationId, role, email },
      },
    });
  } catch (_) {}
}

async function acceptApplication(prisma, { applicationId, adminId, ip }) {
  if (!prisma) throw new ApplicationError("Base indisponible.", 503);

  const application = await prisma.securityEvent.findUnique({
    where: { id: applicationId },
  });
  if (!application) throw new ApplicationError("Candidature introuvable.", 404);
  if (!isApplicationType(application.type)) {
    throw new ApplicationError("Type de candidature non pris en charge.", 400);
  }

  const role = roleFromApplicationType(application.type);
  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const fresh = await tx.securityEvent.findUnique({ where: { id: applicationId } });
      if (!fresh) throw new ApplicationError("Candidature introuvable.", 404);
      return createPartnerAccountFromApplication(tx, {
        application: fresh,
        role,
        adminId,
        ip,
      });
    });
  } catch (e) {
    if (e instanceof ApplicationError) throw e;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ApplicationError("Un compte existe déjà avec cet email.", 409);
    }
    throw new ApplicationError(String(e.message || e), 500);
  }

  try {
    await sendAcceptanceEmail({
      email: result.email,
      name: result.name,
      tempPassword: result.tempPassword,
      role: result.role,
    });
  } catch (mailErr) {
    console.warn("[application] email acceptation non envoyé:", mailErr?.message || mailErr);
    await logAcceptanceEmailFailure(prisma, {
      applicationId,
      email: result.email,
      adminId,
      role: result.role,
    });
  }

  return { ok: true, userId: result.userId, role: result.role };
}

async function refuseApplication(prisma, { applicationId, adminId, reason, ip }) {
  if (!prisma) throw new ApplicationError("Base indisponible.", 503);

  const application = await prisma.securityEvent.findUnique({
    where: { id: applicationId },
  });
  if (!application) throw new ApplicationError("Candidature introuvable.", 404);
  if (!isApplicationType(application.type)) {
    throw new ApplicationError("Type de candidature non pris en charge.", 400);
  }

  const meta = application.meta && typeof application.meta === "object" ? { ...application.meta } : {};
  const status = getApplicationStatus(meta);
  if (PROCESSED_STATUSES.has(status)) {
    throw new ApplicationError("Cette candidature a déjà été traitée.", 409);
  }

  const role = roleFromApplicationType(application.type);
  const now = new Date().toISOString();
  const refusedReason = typeof reason === "string" ? reason.trim().slice(0, 2000) : "";

  const updatedMeta = {
    ...meta,
    status: "refused",
    reason: refusedReason || null,
    refusedAt: now,
    refusedBy: adminId,
  };

  await prisma.securityEvent.update({
    where: { id: applicationId },
    data: { meta: updatedMeta },
  });

  try {
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "application.refused",
        entityType: "SecurityEvent",
        entityId: applicationId,
        after: {
          applicationId,
          action: "refused",
          role,
          adminId,
          reason: refusedReason || null,
          timestamp: now,
          ip: ip || null,
        },
      },
    });
  } catch (_) {}

  if (application.email && refusedReason) {
    try {
      const transporter = createSmtpTransporter();
      await transporter.sendMail({
        from: buildMailFrom(),
        to: application.email,
        subject: "Votre demande de partenariat",
        text: [
          "Bonjour,",
          "",
          "Nous avons examiné votre candidature et ne pouvons pas l'accepter pour le moment.",
          refusedReason ? `Motif : ${refusedReason}` : "",
          "",
          "L'équipe La Solution",
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (mailErr) {
      console.warn("[application] email refus non envoyé:", mailErr?.message || mailErr);
    }
  }

  return { ok: true };
}

async function getApplicationDocument(prisma, { applicationId, docType, adminId }) {
  void adminId;
  if (!prisma) throw new ApplicationError("Base indisponible.", 503);

  const application = await prisma.securityEvent.findUnique({
    where: { id: applicationId },
    select: { id: true, type: true, meta: true },
  });
  if (!application) throw new ApplicationError("Candidature introuvable.", 404);
  if (!isApplicationType(application.type)) {
    throw new ApplicationError("Type de candidature non pris en charge.", 400);
  }

  const role = roleFromApplicationType(application.type);
  const allowed = documentsForRole(role);
  if (!allowed.includes(docType)) {
    throw new ApplicationError("Type de document non autorisé.", 400);
  }

  const meta = application.meta && typeof application.meta === "object" ? application.meta : {};
  const documents = meta.documents && typeof meta.documents === "object" ? meta.documents : {};
  const docMeta = documents[docType];
  if (!docMeta || !docMeta.path) {
    throw new ApplicationError("Document introuvable.", 404);
  }

  try {
    const { buf, mime } = await readApplicationDocument(applicationId, docMeta.path);
    return { buf, mime, docType };
  } catch {
    throw new ApplicationError("Document introuvable.", 404);
  }
}

module.exports = {
  ApplicationError,
  submitApplication,
  acceptApplication,
  refuseApplication,
  getApplicationDocument,
  createPartnerAccountFromApplication,
  sendAcceptanceEmail,
  generateTempPassword,
  APPLICATION_TYPES,
};
