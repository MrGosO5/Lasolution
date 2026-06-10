const fs = require("fs/promises");
const path = require("path");

const MAX_BYTES = 5 * 1024 * 1024; // 5MB — preuves commande
const MAX_TESTIMONIAL_BYTES = 1 * 1024 * 1024; // 1MB — photos avis
const MAX_TESTIMONIAL_DATA_URL_CHARS = Math.ceil(1.5 * 1024 * 1024);

function parseDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(String(dataUrl || ""));
  if (!m) return null;
  const mime = m[1];
  const b64 = m[2];
  return { mime, b64 };
}

function isJpeg(buf) {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isPng(buf) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) if (buf[i] !== sig[i]) return false;
  return true;
}

function throwPhotoError(code) {
  const err = new Error(code);
  err.code = code;
  throw err;
}

async function saveOrderProof({ orderId, photoDataUrl }) {
  const parsed = parseDataUrl(photoDataUrl);
  if (!parsed) throwPhotoError("PHOTO_INVALID");

  if (!["image/jpeg", "image/png"].includes(parsed.mime)) {
    throwPhotoError("PHOTO_UNSUPPORTED");
  }

  let buf;
  try {
    buf = Buffer.from(parsed.b64, "base64");
  } catch {
    throwPhotoError("PHOTO_INVALID");
  }

  if (!buf || buf.length === 0) throwPhotoError("PHOTO_INVALID");
  if (buf.length > MAX_BYTES) throwPhotoError("PHOTO_TOO_LARGE");

  const signatureOk = parsed.mime === "image/jpeg" ? isJpeg(buf) : isPng(buf);
  if (!signatureOk) throwPhotoError("PHOTO_NOT_IMAGE");

  const ext = parsed.mime === "image/png" ? "png" : "jpg";
  const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
  const ordersDir = path.join(dir, "orders");
  await fs.mkdir(ordersDir, { recursive: true });

  const filename = `${orderId}.${ext}`;
  const filePath = path.join(ordersDir, filename);
  await fs.writeFile(filePath, buf, { flag: "w" });

  return `/uploads/orders/${filename}`;
}

async function deleteProofByPublicPath(publicPath) {
  try {
    const p = String(publicPath || "");
    if (!p.startsWith("/uploads/")) return;
    const rel = p.replace(/^\/uploads\//, "");
    const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    const full = path.join(dir, rel);
    await fs.unlink(full);
  } catch {
    // ignore
  }
}

async function saveTestimonialPhoto({ testimonialId, photoDataUrl }) {
  const raw = String(photoDataUrl || "");
  if (raw.length > MAX_TESTIMONIAL_DATA_URL_CHARS) {
    throwPhotoError("PHOTO_TOO_LARGE");
  }

  const parsed = parseDataUrl(raw);
  if (!parsed) throwPhotoError("PHOTO_INVALID");

  if (!["image/jpeg", "image/png"].includes(parsed.mime)) {
    throwPhotoError("PHOTO_UNSUPPORTED");
  }

  let buf;
  try {
    buf = Buffer.from(parsed.b64, "base64");
  } catch {
    throwPhotoError("PHOTO_INVALID");
  }

  if (!buf || buf.length === 0) throwPhotoError("PHOTO_INVALID");
  if (buf.length > MAX_TESTIMONIAL_BYTES) throwPhotoError("PHOTO_TOO_LARGE");

  const signatureOk = parsed.mime === "image/jpeg" ? isJpeg(buf) : isPng(buf);
  if (!signatureOk) throwPhotoError("PHOTO_NOT_IMAGE");

  const ext = parsed.mime === "image/png" ? "png" : "jpg";
  const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
  const subDir = path.join(dir, "testimonials");
  await fs.mkdir(subDir, { recursive: true });

  const filename = `${testimonialId}.${ext}`;
  const filePath = path.join(subDir, filename);
  await fs.writeFile(filePath, buf, { flag: "w" });

  return `/uploads/testimonials/${filename}`;
}

module.exports = {
  saveOrderProof,
  saveTestimonialPhoto,
  deleteProofByPublicPath,
  MAX_BYTES,
  MAX_TESTIMONIAL_BYTES,
  MAX_TESTIMONIAL_DATA_URL_CHARS,
};
